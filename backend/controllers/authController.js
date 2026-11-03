// =====================================================================
// INTELLISTAY: Authentication Controller
// =====================================================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../database/db');
const config = require('../config/config');

// Generate JWT token for user
function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

// 1. Customer Registration
exports.registerCustomer = async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;

    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Please provide full name, email, phone, and password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // Check if email already registered
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, loyalty_points)
       VALUES (?, ?, ?, ?, 'customer', 100)`,
      [full_name.trim(), email.trim().toLowerCase(), phone.trim(), password_hash]
    );

    const newUser = {
      id: result.insertId,
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role: 'customer',
      loyalty_points: 100
    };

    const token = signToken(newUser);

    // Welcome notification
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, 'Welcome to IntelliStay!', 'Welcome to our hospitality family. You have received 100 bonus loyalty points to begin your journeys.', 'system')`,
      [newUser.id]
    );

    res.cookie('token', token, {
      httpOnly: false,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({
      success: true,
      message: 'Customer account created successfully.',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Register customer error:', err);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// 2. Hotel Owner Registration
exports.registerOwner = async (req, res) => {
  try {
    const { full_name, email, phone, password, business_name } = req.body;

    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Please provide full name, email, phone, and password.' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES (?, ?, ?, ?, 'owner')`,
      [full_name.trim(), email.trim().toLowerCase(), phone.trim(), password_hash]
    );

    const newOwner = {
      id: result.insertId,
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role: 'owner',
      loyalty_points: 0
    };

    const token = signToken(newOwner);

    res.cookie('token', token, {
      httpOnly: false,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({
      success: true,
      message: 'Hotel Owner partner account registered successfully. You can now add properties and assign staff.',
      token,
      user: newOwner
    });
  } catch (err) {
    console.error('Register owner error:', err);
    return res.status(500).json({ success: false, message: 'Server error during owner registration.' });
  }
};

// 3. Universal Login (Customer, Owner, Staff, Admin)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const [users] = await db.query(
      'SELECT id, full_name, email, phone, password_hash, role, loyalty_points, avatar_url, is_active FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'This account has been deactivated. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // If user is staff, fetch their assigned hotel info
    let staffHotel = null;
    if (['manager', 'receptionist', 'housekeeping', 'maintenance', 'room_service', 'security', 'kitchen'].includes(user.role)) {
      const [staffProfiles] = await db.query(
        `SELECT sp.*, h.name AS hotel_name, h.city AS hotel_city
         FROM staff_profiles sp
         JOIN hotels h ON sp.hotel_id = h.id
         WHERE sp.user_id = ? AND sp.is_active = 1 LIMIT 1`,
        [user.id]
      );
      if (staffProfiles.length > 0) {
        staffHotel = staffProfiles[0];
      }
    }

    const token = signToken(user);

    res.cookie('token', token, {
      httpOnly: false,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const userPayload = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      loyalty_points: user.loyalty_points,
      avatar_url: user.avatar_url,
      staff_info: staffHotel
    };

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.full_name}.`,
      token,
      user: userPayload
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// 4. Get Current User Profile
exports.getCurrentUser = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, full_name, email, phone, role, loyalty_points, avatar_url, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = users[0];
    let staffInfo = null;

    if (['manager', 'receptionist', 'housekeeping', 'maintenance', 'room_service', 'security', 'kitchen'].includes(user.role)) {
      const [staff] = await db.query(
        `SELECT sp.*, h.name AS hotel_name, h.city AS hotel_city
         FROM staff_profiles sp
         JOIN hotels h ON sp.hotel_id = h.id
         WHERE sp.user_id = ? AND sp.is_active = 1 LIMIT 1`,
        [user.id]
      );
      if (staff.length > 0) staffInfo = staff[0];
    }

    return res.status(200).json({
      success: true,
      user: { ...user, staff_info: staffInfo }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const { full_name, phone, avatar_url } = req.body;
    await db.query(
      'UPDATE users SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), avatar_url = COALESCE(?, avatar_url) WHERE id = ?',
      [full_name, phone, avatar_url, req.user.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 6. Change Password
exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Please provide both current and new password.' });
    }

    const [users] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const isMatch = await bcrypt.compare(current_password, users[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(new_password, salt);

    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 7. Logout
exports.logout = (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

