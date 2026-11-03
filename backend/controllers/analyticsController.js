// =====================================================================
// INTELLISTAY: Analytics & Operational Intelligence Controller
// Supports Owner multi-property analytics and Admin platform metrics
// =====================================================================

const db = require('../../database/db');

// 1. Hotel Owner Operational & Revenue Analytics
exports.getOwnerAnalytics = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { hotelId } = req.query;

    let targetHotelIds = [];

    if (hotelId && hotelId !== 'all') {
      targetHotelIds = [parseInt(hotelId, 10)];
    } else {
      const [hotels] = await db.query('SELECT id FROM hotels WHERE owner_id = ?', [ownerId]);
      targetHotelIds = hotels.map(h => h.id);
    }

    if (targetHotelIds.length === 0) {
      return res.status(200).json({
        success: true,
        summary: {
          totalHotels: 0,
          totalRooms: 0,
          availableRooms: 0,
          occupiedRooms: 0,
          cleaningRooms: 0,
          maintenanceRooms: 0,
          occupancyRate: 0,
          todayArrivals: 0,
          todayDepartures: 0,
          pendingHousekeeping: 0,
          pendingMaintenance: 0,
          totalRevenue: 0
        },
        revenueTrend: [],
        roomStatusBreakdown: []
      });
    }

    const placeholders = targetHotelIds.map(() => '?').join(',');
    const today = new Date().toISOString().split('T')[0];

    // Room Status Counts
    const [roomStats] = await db.query(
      `SELECT 
         COUNT(*) as total_rooms,
         SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_rooms,
         SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_rooms,
         SUM(CASE WHEN status = 'cleaning' OR housekeeping_status = 'dirty' THEN 1 ELSE 0 END) as cleaning_rooms,
         SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_rooms
       FROM rooms 
       WHERE hotel_id IN (${placeholders})`,
      targetHotelIds
    );

    const rs = roomStats[0] || {};
    const totalRooms = rs.total_rooms || 0;
    const occupiedRooms = rs.occupied_rooms || 0;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // Today's Arrivals
    const [arrRes] = await db.query(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE hotel_id IN (${placeholders}) AND check_in_date = ? AND booking_status = 'confirmed'`,
      [...targetHotelIds, today]
    );

    // Today's Departures
    const [depRes] = await db.query(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE hotel_id IN (${placeholders}) AND check_out_date = ? AND booking_status = 'checked_in'`,
      [...targetHotelIds, today]
    );

    // Pending Housekeeping Tasks
    const [hkRes] = await db.query(
      `SELECT COUNT(*) as count FROM housekeeping_tasks 
       WHERE hotel_id IN (${placeholders}) AND status != 'completed'`,
      targetHotelIds
    );

    // Pending Maintenance Tickets
    const [mntRes] = await db.query(
      `SELECT COUNT(*) as count FROM maintenance_tasks 
       WHERE hotel_id IN (${placeholders}) AND status NOT IN ('resolved', 'closed')`,
      targetHotelIds
    );

    // Total Revenue
    const [revRes] = await db.query(
      `SELECT COALESCE(SUM(final_amount), 0) as total_rev 
       FROM bookings 
       WHERE hotel_id IN (${placeholders}) AND payment_status = 'completed'`,
      targetHotelIds
    );

    // 7-day revenue trend simulation
    const [recentBookings] = await db.query(
      `SELECT DATE(created_at) as booking_date, SUM(final_amount) as daily_revenue, COUNT(*) as bookings_count
       FROM bookings
       WHERE hotel_id IN (${placeholders}) AND payment_status = 'completed'
       GROUP BY DATE(created_at)
       ORDER BY booking_date DESC LIMIT 7`,
      targetHotelIds
    );

    return res.status(200).json({
      success: true,
      summary: {
        totalHotels: targetHotelIds.length,
        totalRooms,
        availableRooms: rs.available_rooms || 0,
        occupiedRooms,
        cleaningRooms: rs.cleaning_rooms || 0,
        maintenanceRooms: rs.maintenance_rooms || 0,
        occupancyRate,
        todayArrivals: arrRes[0].count || 0,
        todayDepartures: depRes[0].count || 0,
        pendingHousekeeping: hkRes[0].count || 0,
        pendingMaintenance: mntRes[0].count || 0,
        totalRevenue: revRes[0].total_rev || 0
      },
      revenueTrend: recentBookings.reverse(),
      roomStatusBreakdown: [
        { label: 'Available', value: rs.available_rooms || 0, color: '#4A6B56' },
        { label: 'Occupied', value: occupiedRooms, color: '#1B382B' },
        { label: 'Cleaning / Dirty', value: rs.cleaning_rooms || 0, color: '#C5A880' },
        { label: 'Maintenance', value: rs.maintenance_rooms || 0, color: '#D9534F' }
      ]
    });
  } catch (err) {
    console.error('Owner analytics error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Platform Admin Metrics & Platform Health
exports.getAdminAnalytics = async (req, res) => {
  try {
    const [hotelStats] = await db.query(
      `SELECT 
         COUNT(*) as total_hotels,
         SUM(CASE WHEN approval_status = 'approved' AND status = 'active' THEN 1 ELSE 0 END) as active_hotels,
         SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) as pending_approvals
       FROM hotels`
    );

    const [userStats] = await db.query(
      `SELECT 
         COUNT(*) as total_users,
         SUM(CASE WHEN role = 'customer' THEN 1 ELSE 0 END) as customers,
         SUM(CASE WHEN role = 'owner' THEN 1 ELSE 0 END) as owners,
         SUM(CASE WHEN role NOT IN ('customer', 'owner', 'admin') THEN 1 ELSE 0 END) as staff_members
       FROM users`
    );

    const [bookingStats] = await db.query(
      `SELECT 
         COUNT(*) as total_bookings,
         SUM(CASE WHEN booking_status = 'confirmed' THEN 1 ELSE 0 END) as active_bookings,
         SUM(CASE WHEN booking_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
         COALESCE(SUM(final_amount), 0) as platform_gmv
       FROM bookings`
    );

    const [topDestinations] = await db.query(
      `SELECT city, COUNT(*) as hotel_count, AVG(star_rating) as avg_rating
       FROM hotels
       WHERE approval_status = 'approved'
       GROUP BY city
       ORDER BY hotel_count DESC LIMIT 6`
    );

    return res.status(200).json({
      success: true,
      hotels: hotelStats[0],
      users: userStats[0],
      bookings: bookingStats[0],
      topDestinations
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

