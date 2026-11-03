// =====================================================================
// INTELLISTAY: Staff Operations Controller
// Covers Front Desk, Housekeeping, Maintenance, F&B, Security
// =====================================================================

const bcrypt = require('bcryptjs');
const db = require('../../database/db');

// 1. Owner/Manager: Get all staff members for a hotel
exports.getHotelStaff = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const [staff] = await db.query(
      `SELECT sp.*, u.full_name, u.email, u.phone, u.role, u.avatar_url
       FROM staff_profiles sp
       JOIN users u ON sp.user_id = u.id
       WHERE sp.hotel_id = ?
       ORDER BY sp.department, u.full_name`,
      [hotelId]
    );

    return res.status(200).json({
      success: true,
      staff
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Owner/Manager: Register and add a new staff employee
exports.addStaffMember = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const {
      full_name,
      email,
      phone,
      password = 'password123',
      role,
      department,
      shift = 'Morning',
      salary = 25000,
      date_of_joining
    } = req.body;

    if (!full_name || !email || !phone || !role || !department) {
      return res.status(400).json({ success: false, message: 'Please provide full name, email, phone, role, and department.' });
    }

    // Check if user with email exists
    let userId;
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing.length > 0) {
      userId = existing[0].id;
      // Update role
      await db.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    } else {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      const [uRes] = await db.query(
        'INSERT INTO users (full_name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        [full_name.trim(), email.trim().toLowerCase(), phone.trim(), hash, role]
      );
      userId = uRes.insertId;
    }

    // Check if employee code exists or generate one
    const empCode = `EMP-${role.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const joinDate = date_of_joining || new Date().toISOString().split('T')[0];

    const [spRes] = await db.query(
      `INSERT INTO staff_profiles (user_id, hotel_id, department, employee_code, shift, salary, date_of_joining, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [userId, hotelId, department, empCode, shift, parseFloat(salary), joinDate]
    );

    return res.status(201).json({
      success: true,
      message: `Staff employee ${full_name} registered as ${role}.`,
      staff_id: spRes.insertId,
      employee_code: empCode
    });
  } catch (err) {
    console.error('Add staff error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2b. Owner/Manager: Update staff details (persists cleanly to DB)
exports.updateStaffMember = async (req, res) => {
  try {
    const { staffId } = req.params;
    const {
      full_name,
      email,
      phone,
      role,
      department,
      shift,
      salary,
      is_active
    } = req.body;

    const [staff] = await db.query('SELECT user_id, hotel_id FROM staff_profiles WHERE id = ?', [staffId]);
    if (!staff || staff.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff profile not found.' });
    }

    const userId = staff[0].user_id;

    // Update user record
    await db.query(
      `UPDATE users 
       SET full_name = COALESCE(?, full_name),
           email = COALESCE(?, email),
           phone = COALESCE(?, phone),
           role = COALESCE(?, role),
           is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [full_name, email, phone, role, is_active, userId]
    );

    // Update staff profile record
    await db.query(
      `UPDATE staff_profiles 
       SET department = COALESCE(?, department),
           shift = COALESCE(?, shift),
           salary = COALESCE(?, salary),
           is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [department, shift, salary, is_active, staffId]
    );

    return res.status(200).json({
      success: true,
      message: 'Staff profile updated successfully.'
    });
  } catch (err) {
    console.error('Update staff error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2c. Owner/Manager: Toggle staff active status
exports.toggleStaffStatus = async (req, res) => {
  try {
    const { staffId } = req.params;

    const [staff] = await db.query('SELECT user_id, is_active FROM staff_profiles WHERE id = ?', [staffId]);
    if (!staff || staff.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff profile not found.' });
    }

    const newStatus = staff[0].is_active ? 0 : 1;

    await db.query('UPDATE staff_profiles SET is_active = ? WHERE id = ?', [newStatus, staffId]);
    await db.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, staff[0].user_id]);

    return res.status(200).json({
      success: true,
      message: `Staff member is now ${newStatus ? 'active' : 'inactive'}.`,
      is_active: newStatus
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2d. Owner/Manager: Delete staff member
exports.deleteStaffMember = async (req, res) => {
  try {
    const { staffId } = req.params;
    const [staff] = await db.query('SELECT user_id FROM staff_profiles WHERE id = ?', [staffId]);
    if (!staff || staff.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff profile not found.' });
    }

    await db.query('DELETE FROM staff_profiles WHERE id = ?', [staffId]);

    return res.status(200).json({
      success: true,
      message: 'Staff member removed successfully.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =====================================================================
// HOUSEKEEPING OPERATIONS
// =====================================================================

// 3. Housekeeping: Get tasks for staff member or hotel
exports.getHousekeepingTasks = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { status, priority } = req.query;

    let whereSql = 'WHERE ht.hotel_id = ?';
    let params = [hotelId];

    if (status) {
      whereSql += ' AND ht.status = ?';
      params.push(status);
    }
    if (priority) {
      whereSql += ' AND ht.priority = ?';
      params.push(priority);
    }

    const [tasks] = await db.query(
      `SELECT 
         ht.*,
         r.room_number,
         r.floor_number,
         r.housekeeping_status AS current_room_hk_status,
         rt.name AS room_type_name,
         u.full_name AS assigned_to_name
       FROM housekeeping_tasks ht
       JOIN rooms r ON ht.room_id = r.id
       JOIN room_types rt ON r.room_type_id = rt.id
       LEFT JOIN users u ON ht.assigned_to_user_id = u.id
       ${whereSql}
       ORDER BY 
         CASE ht.priority 
           WHEN 'urgent' THEN 1 
           WHEN 'high' THEN 2 
           WHEN 'medium' THEN 3 
           ELSE 4 
         END,
         ht.created_at DESC`,
      params
    );

    return res.status(200).json({
      success: true,
      tasks
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Housekeeping: Update task status & room cleanliness
exports.updateHousekeepingTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, notes, room_clean_status } = req.body;

    const [taskRows] = await db.query('SELECT hotel_id, room_id FROM housekeeping_tasks WHERE id = ?', [taskId]);
    if (!taskRows || taskRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const task = taskRows[0];
    const completedAt = status === 'completed' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;

    await db.query(
      `UPDATE housekeeping_tasks 
       SET status = COALESCE(?, status), 
           notes = COALESCE(?, notes),
           completed_at = COALESCE(?, completed_at)
       WHERE id = ?`,
      [status, notes, completedAt, taskId]
    );

    // If task marked completed, mark room as clean and ready
    if (status === 'completed' || room_clean_status === 'clean') {
      await db.query("UPDATE rooms SET housekeeping_status = 'clean', status = 'available' WHERE id = ? AND status = 'cleaning'", [task.room_id]);
    } else if (room_clean_status) {
      await db.query('UPDATE rooms SET housekeeping_status = ? WHERE id = ?', [room_clean_status, task.room_id]);
    }

    return res.status(200).json({
      success: true,
      message: 'Housekeeping task updated successfully.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =====================================================================
// MAINTENANCE OPERATIONS
// =====================================================================

// 5. Maintenance: Get all maintenance tickets for a hotel
exports.getMaintenanceTasks = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { status } = req.query;

    let whereSql = 'WHERE mt.hotel_id = ?';
    let params = [hotelId];

    if (status) {
      whereSql += ' AND mt.status = ?';
      params.push(status);
    }

    const [tasks] = await db.query(
      `SELECT 
         mt.*,
         r.room_number,
         reporter.full_name AS reported_by_name,
         assignee.full_name AS assigned_to_name
       FROM maintenance_tasks mt
       LEFT JOIN rooms r ON mt.room_id = r.id
       JOIN users reporter ON mt.reported_by_user_id = reporter.id
       LEFT JOIN users assignee ON mt.assigned_to_user_id = assignee.id
       ${whereSql}
       ORDER BY 
         CASE mt.priority 
           WHEN 'emergency' THEN 1 
           WHEN 'high' THEN 2 
           WHEN 'medium' THEN 3 
           ELSE 4 
         END,
         mt.reported_at DESC`,
      params
    );

    return res.status(200).json({
      success: true,
      tasks
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 6. Maintenance: Create a new maintenance ticket
exports.createMaintenanceTask = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const userId = req.user.id;
    const {
      room_id,
      issue_category,
      title,
      description,
      priority = 'medium',
      mark_room_maintenance = false
    } = req.body;

    if (!issue_category || !title || !description) {
      return res.status(400).json({ success: false, message: 'Please provide issue category, title, and description.' });
    }

    const [resMt] = await db.query(
      `INSERT INTO maintenance_tasks (hotel_id, room_id, reported_by_user_id, issue_category, title, description, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'reported')`,
      [hotelId, room_id || null, userId, issue_category, title.trim(), description.trim(), priority]
    );

    if (room_id && mark_room_maintenance) {
      await db.query("UPDATE rooms SET status = 'maintenance' WHERE id = ?", [room_id]);
    }

    return res.status(201).json({
      success: true,
      message: 'Maintenance ticket created successfully.',
      task_id: resMt.insertId
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 7. Maintenance: Update ticket status and resolution notes
exports.updateMaintenanceTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, resolution_notes } = req.body;

    const [taskRows] = await db.query('SELECT hotel_id, room_id FROM maintenance_tasks WHERE id = ?', [taskId]);
    if (!taskRows || taskRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Maintenance ticket not found.' });
    }

    const task = taskRows[0];
    const resolvedAt = (status === 'resolved' || status === 'closed') ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;

    await db.query(
      `UPDATE maintenance_tasks 
       SET status = COALESCE(?, status),
           resolution_notes = COALESCE(?, resolution_notes),
           resolved_at = COALESCE(?, resolved_at)
       WHERE id = ?`,
      [status, resolution_notes, resolvedAt, taskId]
    );

    // If resolved and room was in maintenance, return room to available
    if ((status === 'resolved' || status === 'closed') && task.room_id) {
      await db.query("UPDATE rooms SET status = 'available' WHERE id = ? AND status = 'maintenance'", [task.room_id]);
    }

    return res.status(200).json({
      success: true,
      message: 'Maintenance ticket updated successfully.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =====================================================================
// FRONT DESK (RECEPTIONIST) OPERATIONS
// =====================================================================

// 8. Front Desk: Operations board (Today's arrivals, departures, in-house)
exports.getFrontDeskBoard = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    // Today's Arrivals
    const [arrivals] = await db.query(
      `SELECT b.*, u.full_name AS guest_name, u.phone AS guest_phone, rt.name AS room_type_name, r.room_number
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN booking_rooms br ON b.id = br.booking_id
       JOIN room_types rt ON br.room_type_id = rt.id
       LEFT JOIN rooms r ON br.room_id = r.id
       WHERE b.hotel_id = ? AND b.check_in_date = ? AND b.booking_status = 'confirmed'`,
      [hotelId, today]
    );

    // Today's Departures
    const [departures] = await db.query(
      `SELECT b.*, u.full_name AS guest_name, u.phone AS guest_phone, rt.name AS room_type_name, r.room_number
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN booking_rooms br ON b.id = br.booking_id
       JOIN room_types rt ON br.room_type_id = rt.id
       LEFT JOIN rooms r ON br.room_id = r.id
       WHERE b.hotel_id = ? AND b.check_out_date = ? AND b.booking_status = 'checked_in'`,
      [hotelId, today]
    );

    // Current In-House Guests
    const [inHouse] = await db.query(
      `SELECT b.*, u.full_name AS guest_name, u.phone AS guest_phone, rt.name AS room_type_name, r.room_number
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN booking_rooms br ON b.id = br.booking_id
       JOIN room_types rt ON br.room_type_id = rt.id
       LEFT JOIN rooms r ON br.room_id = r.id
       WHERE b.hotel_id = ? AND b.booking_status = 'checked_in'`,
      [hotelId]
    );

    // Room Status Grid
    const [rooms] = await db.query(
      `SELECT r.*, rt.name AS room_type_name
       FROM rooms r
       JOIN room_types rt ON r.room_type_id = rt.id
       WHERE r.hotel_id = ?
       ORDER BY r.floor_number ASC, r.room_number ASC`,
      [hotelId]
    );

    return res.status(200).json({
      success: true,
      today,
      arrivals,
      departures,
      inHouse,
      rooms
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =====================================================================
// ROOM SERVICE & KITCHEN OPERATIONS
// =====================================================================

// 9. Service Orders List (Kitchen & Room Service)
exports.getServiceOrders = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { status } = req.query;

    let whereSql = 'WHERE so.hotel_id = ?';
    let params = [hotelId];

    if (status) {
      whereSql += ' AND so.status = ?';
      params.push(status);
    }

    const [orders] = await db.query(
      `SELECT so.*, r.room_number, b.booking_reference, u.full_name AS guest_name
       FROM service_orders so
       JOIN rooms r ON so.room_id = r.id
       JOIN bookings b ON so.booking_id = b.id
       JOIN users u ON b.user_id = u.id
       ${whereSql}
       ORDER BY so.created_at DESC`,
      params
    );

    return res.status(200).json({
      success: true,
      orders
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 10. Update Service Order Status
exports.updateServiceOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    await db.query('UPDATE service_orders SET status = ? WHERE id = ?', [status, orderId]);

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

