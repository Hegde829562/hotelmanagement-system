// =====================================================================
// INTELLISTAY: Transactional Booking Engine & Reservation Controller
// Robust date-overlap verification and concurrency locking
// =====================================================================

const db = require('../../database/db');
const { generateBookingReference, generateTransactionReference, calculateNights } = require('../utils/helpers');
const config = require('../config/config');

// 1. Check Live Room Availability for Date Range
exports.checkAvailability = async (req, res) => {
  try {
    const { hotel_id, check_in, check_out, guests = 2 } = req.query;

    if (!hotel_id || !check_in || !check_out) {
      return res.status(400).json({ success: false, message: 'Please provide hotel_id, check_in, and check_out dates.' });
    }

    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);

    if (isNaN(checkInDate) || isNaN(checkOutDate) || checkOutDate <= checkInDate) {
      return res.status(400).json({ success: false, message: 'Invalid date selection. Check-out must be after check-in.' });
    }

    const nights = calculateNights(check_in, check_out);

    // Find all room types for the hotel and calculate how many physical rooms are free
    const [roomTypes] = await db.query(
      `SELECT rt.* 
       FROM room_types rt 
       WHERE rt.hotel_id = ?`,
      [hotel_id]
    );

    const availableCategories = [];

    for (const rt of roomTypes) {
      // Find physical rooms of this room_type that DO NOT have an overlapping confirmed booking
      // Overlap formula: existing_check_in < requested_check_out AND existing_check_out > requested_check_in
      const [availableRooms] = await db.query(
        `SELECT r.id, r.room_number, r.floor_number
         FROM rooms r
         WHERE r.hotel_id = ? 
           AND r.room_type_id = ?
           AND r.status != 'out_of_order'
           AND r.id NOT IN (
             SELECT br.room_id
             FROM booking_rooms br
             JOIN bookings b ON br.booking_id = b.id
             WHERE b.booking_status IN ('confirmed', 'checked_in')
               AND b.check_in_date < ?
               AND b.check_out_date > ?
           )`,
        [hotel_id, rt.id, check_out, check_in]
      );

      const availableCount = availableRooms.length;
      const baseTotal = rt.base_price * nights;
      const taxAmount = Math.round(baseTotal * (config.taxRatePercent / 100));
      const totalEstimated = baseTotal + taxAmount;

      availableCategories.push({
        room_type_id: rt.id,
        name: rt.name,
        description: rt.description,
        capacity_adults: rt.capacity_adults,
        capacity_children: rt.capacity_children,
        bed_type: rt.bed_type,
        room_size_sqft: rt.room_size_sqft,
        image_url: rt.image_url,
        price_per_night: rt.base_price,
        nights,
        subtotal: baseTotal,
        tax_amount: taxAmount,
        total_amount: totalEstimated,
        available_rooms_count: availableCount,
        is_available: availableCount > 0,
        available_room_ids: availableRooms.map(r => r.id)
      });
    }

    return res.status(200).json({
      success: true,
      hotel_id,
      check_in,
      check_out,
      nights,
      categories: availableCategories
    });
  } catch (err) {
    console.error('Check availability error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Transactional Booking Creation with FOR UPDATE lock
exports.createBooking = async (req, res) => {
  const conn = await db.getConnection();

  try {
    const userId = req.user.id;
    const {
      hotel_id,
      room_type_id,
      check_in,
      check_out,
      total_guests = 2,
      payment_method = 'Credit Card',
      special_requests = '',
      simulated_payment_success = true
    } = req.body;

    if (!hotel_id || !room_type_id || !check_in || !check_out) {
      conn.release();
      return res.status(400).json({ success: false, message: 'Missing required booking details.' });
    }

    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);

    if (isNaN(checkInDate) || isNaN(checkOutDate) || checkOutDate <= checkInDate) {
      conn.release();
      return res.status(400).json({ success: false, message: 'Invalid check-in or check-out date range.' });
    }

    if (!simulated_payment_success) {
      conn.release();
      return res.status(400).json({ success: false, message: 'Simulated payment was cancelled or failed.' });
    }

    const nights = calculateNights(check_in, check_out);

    // 1. Begin MySQL Transaction
    await conn.beginTransaction();

    // 2. Fetch room type details
    const [roomTypeRows] = await conn.query('SELECT * FROM room_types WHERE id = ? AND hotel_id = ?', [room_type_id, hotel_id]);
    if (!roomTypeRows || roomTypeRows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ success: false, message: 'Selected room category not found in this hotel.' });
    }
    const roomType = roomTypeRows[0];

    // 3. Find and lock an available physical room using FOR UPDATE
    // Check overlap: existing_check_in < requested_check_out AND existing_check_out > requested_check_in
    const findRoomSql = `
      SELECT r.id, r.room_number, r.status
      FROM rooms r
      WHERE r.hotel_id = ? 
        AND r.room_type_id = ?
        AND r.status != 'out_of_order'
        AND r.id NOT IN (
          SELECT br.room_id
          FROM booking_rooms br
          JOIN bookings b ON br.booking_id = b.id
          WHERE b.booking_status IN ('confirmed', 'checked_in')
            AND b.check_in_date < ?
            AND b.check_out_date > ?
        )
      LIMIT 1
      FOR UPDATE
    `;

    const [candidateRooms] = await conn.query(findRoomSql, [hotel_id, room_type_id, check_out, check_in]);

    if (!candidateRooms || candidateRooms.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(409).json({
        success: false,
        message: 'Apologies, no rooms are currently available in this category for your selected dates. Please try other dates or room types.'
      });
    }

    const assignedRoom = candidateRooms[0];

    // 4. Calculate amounts
    const baseAmount = roomType.base_price * nights;
    const taxAmount = Math.round(baseAmount * (config.taxRatePercent / 100));
    const discountAmount = 0.00;
    const finalAmount = baseAmount + taxAmount - discountAmount;

    // 5. Generate unique booking reference
    const bookingRef = generateBookingReference();

    // 6. Insert Booking record
    const [bookingRes] = await conn.query(
      `INSERT INTO bookings (
        booking_reference, user_id, hotel_id, check_in_date, check_out_date,
        total_guests, total_rooms, total_amount, tax_amount, discount_amount, final_amount,
        booking_status, payment_status, payment_method, special_requests
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 'confirmed', 'completed', ?, ?)`,
      [
        bookingRef, userId, hotel_id, check_in, check_out,
        total_guests, baseAmount, taxAmount, discountAmount, finalAmount,
        payment_method, special_requests
      ]
    );

    const bookingId = bookingRes.insertId;

    // 7. Insert Booking Rooms mapping
    await conn.query(
      `INSERT INTO booking_rooms (booking_id, room_id, room_type_id, price_per_night)
       VALUES (?, ?, ?, ?)`,
      [bookingId, assignedRoom.id, room_type_id, roomType.base_price]
    );

    // 8. Record simulated payment transaction
    const txnRef = generateTransactionReference('TXN-PAY');
    await conn.query(
      `INSERT INTO payments (booking_id, transaction_reference, amount, payment_method, payment_status, payment_gateway_response)
       VALUES (?, ?, ?, ?, 'successful', ?)`,
      [
        bookingId, txnRef, finalAmount, payment_method,
        JSON.stringify({ gateway: 'IntelliStay Secure Vault', status: 'PAID', card_last4: '4242' })
      ]
    );

    // 9. Award loyalty points (1 point per Rs. 100)
    const earnedPoints = Math.floor(finalAmount / config.loyaltyPointsRate);
    await conn.query(
      'UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?',
      [earnedPoints, userId]
    );

    // 10. Send customer confirmation notification
    const [hotelInfo] = await conn.query('SELECT name FROM hotels WHERE id = ?', [hotel_id]);
    const hotelName = hotelInfo[0] ? hotelInfo[0].name : 'IntelliStay';

    await conn.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, 'Booking Confirmed!', ?, 'booking')`,
      [
        userId,
        `Your reservation ${bookingRef} at ${hotelName} (${check_in} to ${check_out}) is confirmed! +${earnedPoints} loyalty points added.`
      ]
    );

    // 11. Commit Transaction
    await conn.commit();
    conn.release();

    return res.status(201).json({
      success: true,
      message: 'Reservation confirmed successfully!',
      booking: {
        id: bookingId,
        booking_reference: bookingRef,
        hotel_name: hotelName,
        room_type_name: roomType.name,
        assigned_room_number: assignedRoom.room_number,
        check_in_date: check_in,
        check_out_date: check_out,
        nights,
        total_guests,
        final_amount: finalAmount,
        transaction_reference: txnRef,
        earned_loyalty_points: earnedPoints
      }
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('Booking creation error:', err);
    return res.status(500).json({ success: false, message: 'Failed to complete reservation: ' + err.message });
  }
};

// 3. Customer: Get My Bookings (upcoming, past, cancelled)
exports.getCustomerBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const [bookings] = await db.query(
      `SELECT 
         b.*,
         h.name AS hotel_name,
         h.city AS hotel_city,
         h.state AS hotel_state,
         h.address AS hotel_address,
         h.contact_phone AS hotel_phone,
         h.cancellation_policy,
         (SELECT image_url FROM hotel_images WHERE hotel_id = h.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS hotel_image,
         rt.name AS room_type_name,
         r.room_number AS assigned_room_number,
         p.transaction_reference,
         (SELECT rating FROM reviews WHERE booking_id = b.id LIMIT 1) AS customer_review_rating
       FROM bookings b
       JOIN hotels h ON b.hotel_id = h.id
       LEFT JOIN booking_rooms br ON b.id = br.booking_id
       LEFT JOIN room_types rt ON br.room_type_id = rt.id
       LEFT JOIN rooms r ON br.room_id = r.id
       LEFT JOIN payments p ON b.id = p.booking_id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [userId]
    );

    const today = new Date().toISOString().split('T')[0];

    const upcoming = bookings.filter(b => b.booking_status === 'confirmed' && b.check_in_date >= today);
    const past = bookings.filter(b => b.booking_status === 'checked_out' || (b.booking_status === 'confirmed' && b.check_in_date < today));
    const cancelled = bookings.filter(b => b.booking_status === 'cancelled');

    return res.status(200).json({
      success: true,
      all: bookings,
      upcoming,
      past,
      cancelled
    });
  } catch (err) {
    console.error('Get customer bookings error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Customer: Cancel Booking
exports.cancelBooking = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { bookingId } = req.params;
    const { reason = 'Plans changed' } = req.body;
    const userId = req.user.id;

    await conn.beginTransaction();

    const [bookings] = await conn.query(
      'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
      [bookingId, userId]
    );

    if (!bookings || bookings.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = bookings[0];

    if (booking.booking_status === 'cancelled') {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: 'This booking is already cancelled.' });
    }

    if (booking.booking_status === 'checked_in' || booking.booking_status === 'checked_out') {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: 'Cannot cancel an ongoing or completed stay.' });
    }

    // Update booking status
    await conn.query(
      `UPDATE bookings 
       SET booking_status = 'cancelled', 
           payment_status = 'refunded', 
           cancellation_reason = ? 
       WHERE id = ?`,
      [reason, bookingId]
    );

    // Update payment record
    await conn.query(
      `UPDATE payments 
       SET payment_status = 'refunded' 
       WHERE booking_id = ?`,
      [bookingId]
    );

    // Free any room status if set to reserved
    const [bRooms] = await conn.query('SELECT room_id FROM booking_rooms WHERE booking_id = ?', [bookingId]);
    for (const br of bRooms) {
      await conn.query('UPDATE rooms SET status = "available" WHERE id = ? AND status = "occupied"', [br.room_id]);
    }

    // Create notification
    await conn.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, 'Booking Cancelled', ?, 'booking')`,
      [userId, `Your booking ${booking.booking_reference} has been cancelled. Simulated refund initiated.`]
    );

    await conn.commit();
    conn.release();

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully. Refund of full amount initiated.',
      refund_amount: booking.final_amount
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Hotel Bookings List (Owner, Manager, Front Office)
exports.getHotelBookings = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { status, date } = req.query;

    let whereSql = 'WHERE b.hotel_id = ?';
    let params = [hotelId];

    if (status) {
      whereSql += ' AND b.booking_status = ?';
      params.push(status);
    }

    if (date) {
      whereSql += ' AND (? BETWEEN b.check_in_date AND b.check_out_date OR b.check_in_date = ?)';
      params.push(date, date);
    }

    const [bookings] = await db.query(
      `SELECT 
         b.*,
         u.full_name AS guest_name,
         u.email AS guest_email,
         u.phone AS guest_phone,
         rt.name AS room_type_name,
         r.room_number AS assigned_room_number,
         r.id AS physical_room_id
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       LEFT JOIN booking_rooms br ON b.id = br.booking_id
       LEFT JOIN room_types rt ON br.room_type_id = rt.id
       LEFT JOIN rooms r ON br.room_id = r.id
       ${whereSql}
       ORDER BY b.check_in_date ASC, b.id DESC`,
      params
    );

    return res.status(200).json({
      success: true,
      bookings
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 6. Front Desk Action: Check-In Guest
exports.checkInGuest = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const [bookings] = await db.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = bookings[0];
    if (booking.booking_status !== 'confirmed') {
      return res.status(400).json({ success: false, message: `Cannot check-in booking with status '${booking.booking_status}'.` });
    }

    await db.query("UPDATE bookings SET booking_status = 'checked_in' WHERE id = ?", [bookingId]);

    // Set assigned physical rooms to 'occupied'
    const [bRooms] = await db.query('SELECT room_id FROM booking_rooms WHERE booking_id = ?', [bookingId]);
    for (const br of bRooms) {
      await db.query("UPDATE rooms SET status = 'occupied' WHERE id = ?", [br.room_id]);
    }

    return res.status(200).json({
      success: true,
      message: `Guest checked in successfully for reference ${booking.booking_reference}. Room keys issued.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 7. Front Desk Action: Check-Out Guest
exports.checkOutGuest = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const [bookings] = await db.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = bookings[0];
    await db.query("UPDATE bookings SET booking_status = 'checked_out' WHERE id = ?", [bookingId]);

    // Set assigned physical rooms to 'cleaning' and housekeeping_status to 'dirty'
    const [bRooms] = await db.query('SELECT room_id FROM booking_rooms WHERE booking_id = ?', [bookingId]);
    const today = new Date().toISOString().split('T')[0];

    for (const br of bRooms) {
      await db.query("UPDATE rooms SET status = 'cleaning', housekeeping_status = 'dirty' WHERE id = ?", [br.room_id]);

      // Automatically create an urgent checkout cleaning task for housekeeping
      await db.query(
        `INSERT INTO housekeeping_tasks (hotel_id, room_id, task_type, priority, status, notes, scheduled_date)
         VALUES (?, ?, 'checkout_clean', 'urgent', 'pending', 'Automatic task: Guest checked out. Urgent turnover clean required.', ?)`,
        [booking.hotel_id, br.room_id, today]
      );
    }

    return res.status(200).json({
      success: true,
      message: `Guest checked out successfully. Room set to dirty and housekeeping turnover task generated.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

