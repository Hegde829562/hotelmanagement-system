// =====================================================================
// INTELLISTAY: Authentication & Role-Based Access Control (RBAC)
// =====================================================================

const jwt = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../../database/db');

// Authenticate user by JWT token
async function authenticate(req, res, next) {
  let token = null;

  // Check Authorization header: Bearer <token>
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please log in to continue.'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const [users] = await db.query('SELECT id, full_name, email, phone, role, loyalty_points, avatar_url, is_active FROM users WHERE id = ?', [decoded.id]);

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.'
      });
    }

    const user = users[0];
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Session expired or invalid token. Please log in again.'
    });
  }
}

// Optional authentication (for public routes that can personalize if user is logged in)
async function optionalAuth(req, res, next) {
  let token = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      const [users] = await db.query('SELECT id, full_name, email, phone, role, loyalty_points, avatar_url FROM users WHERE id = ?', [decoded.id]);
      if (users && users.length > 0) {
        req.user = users[0];
      }
    } catch (e) {
      // Ignore invalid token for optional auth
    }
  }
  next();
}

// Authorize specific roles
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Admin has access to all authorized endpoints
    if (req.user.role === 'admin') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted for role '${req.user.role}'.`
      });
    }

    next();
  };
}

// Enforce property ownership: Ensure hotel owner/manager only operates on their own hotels
async function enforceHotelOwnership(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  // Admin bypasses ownership
  if (req.user.role === 'admin') {
    return next();
  }

  const hotelId = req.params.hotelId || req.body.hotel_id || req.query.hotel_id;
  if (!hotelId) {
    return next();
  }

  try {
    const [hotels] = await db.query('SELECT id, owner_id FROM hotels WHERE id = ?', [hotelId]);
    if (!hotels || hotels.length === 0) {
      return res.status(404).json({ success: false, message: 'Hotel not found.' });
    }

    const hotel = hotels[0];

    // If user is owner, check owner_id
    if (req.user.role === 'owner' && hotel.owner_id === req.user.id) {
      return next();
    }

    // If user is staff (manager, receptionist, housekeeping, etc.), check staff_profiles
    const [staff] = await db.query('SELECT id FROM staff_profiles WHERE user_id = ? AND hotel_id = ? AND is_active = 1', [req.user.id, hotelId]);
    if (staff && staff.length > 0) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'You do not have permission to manage this hotel property.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  enforceHotelOwnership
};

