// =====================================================================
// INTELLISTAY: Room & Inventory Management Controller
// =====================================================================

const db = require('../../database/db');

// 1. Get All Room Types and Physical Rooms for a Hotel
exports.getHotelRooms = async (req, res) => {
  try {
    const { hotelId } = req.params;

    // Room Types
    const [roomTypes] = await db.query(
      `SELECT rt.*,
              (SELECT COUNT(*) FROM rooms r WHERE r.room_type_id = rt.id) AS total_physical_rooms,
              (SELECT COUNT(*) FROM rooms r WHERE r.room_type_id = rt.id AND r.status = 'available') AS available_rooms
       FROM room_types rt
       WHERE rt.hotel_id = ?
       ORDER BY rt.base_price ASC`,
      [hotelId]
    );

    // Physical Rooms
    const [rooms] = await db.query(
      `SELECT r.*, rt.name AS room_type_name, rt.base_price
       FROM rooms r
       JOIN room_types rt ON r.room_type_id = rt.id
       WHERE r.hotel_id = ?
       ORDER BY r.floor_number ASC, r.room_number ASC`,
      [hotelId]
    );

    return res.status(200).json({
      success: true,
      roomTypes,
      rooms
    });
  } catch (err) {
    console.error('Get hotel rooms error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Create Room Type
exports.createRoomType = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const {
      name,
      description,
      base_price,
      capacity_adults = 2,
      capacity_children = 1,
      bed_type = 'King Bed',
      room_size_sqft = 350,
      image_url,
      initial_rooms_count = 2
    } = req.body;

    if (!name || !base_price) {
      return res.status(400).json({ success: false, message: 'Please provide room type name and base price.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

    const [rtRes] = await db.query(
      `INSERT INTO room_types (hotel_id, name, slug, description, base_price, capacity_adults, capacity_children, bed_type, room_size_sqft, image_url, total_rooms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [hotelId, name.trim(), slug, description || '', parseFloat(base_price), parseInt(capacity_adults, 10), parseInt(capacity_children, 10), bed_type, parseInt(room_size_sqft, 10), image_url || null, parseInt(initial_rooms_count, 10)]
    );

    const roomTypeId = rtRes.insertId;

    // Create initial physical rooms automatically
    const count = Math.max(1, parseInt(initial_rooms_count, 10));
    for (let i = 1; i <= count; i++) {
      const roomNum = `${roomTypeId}0${i}`;
      await db.query(
        'INSERT INTO rooms (hotel_id, room_type_id, room_number, floor_number, status, housekeeping_status) VALUES (?, ?, ?, 1, "available", "clean")',
        [hotelId, roomTypeId, roomNum]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Room category created and initial physical rooms generated.',
      room_type_id: roomTypeId
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Add Physical Room
exports.addPhysicalRoom = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { room_type_id, room_number, floor_number = 1 } = req.body;

    if (!room_type_id || !room_number) {
      return res.status(400).json({ success: false, message: 'Room type and room number are required.' });
    }

    // Check duplicate room number
    const [existing] = await db.query(
      'SELECT id FROM rooms WHERE hotel_id = ? AND room_number = ?',
      [hotelId, room_number.trim()]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: `Room ${room_number} already exists in this hotel.` });
    }

    const [resRoom] = await db.query(
      'INSERT INTO rooms (hotel_id, room_type_id, room_number, floor_number, status, housekeeping_status) VALUES (?, ?, ?, ?, "available", "clean")',
      [hotelId, room_type_id, room_number.trim(), parseInt(floor_number, 10)]
    );

    return res.status(201).json({
      success: true,
      message: `Room ${room_number} added successfully.`,
      room_id: resRoom.insertId
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Update Physical Room Operational Status
exports.updateRoomStatus = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { status, housekeeping_status } = req.body;

    const [room] = await db.query('SELECT hotel_id, room_number, status, housekeeping_status FROM rooms WHERE id = ?', [roomId]);
    if (!room || room.length === 0) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    const oldHk = room[0].housekeeping_status;

    await db.query(
      `UPDATE rooms 
       SET status = COALESCE(?, status), 
           housekeeping_status = COALESCE(?, housekeeping_status)
       WHERE id = ?`,
      [status, housekeeping_status, roomId]
    );

    // If marked dirty, generate housekeeping task if not already open
    if (housekeeping_status === 'dirty' && oldHk !== 'dirty') {
      const today = new Date().toISOString().split('T')[0];
      await db.query(
        `INSERT INTO housekeeping_tasks (hotel_id, room_id, task_type, priority, status, notes, scheduled_date)
         VALUES (?, ?, 'checkout_clean', 'high', 'pending', 'Automatic task: Room marked dirty for cleaning', ?)`,
        [room[0].hotel_id, roomId, today]
      );
    }

    return res.status(200).json({
      success: true,
      message: `Room ${room[0].room_number} status updated successfully.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

