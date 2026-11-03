// =====================================================================
// INTELLISTAY: Application Configuration & Constants
// =====================================================================

require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'intellistay_jwt_secret_dev_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  uploadMaxSize: parseInt(process.env.UPLOAD_MAX_SIZE, 10) || 5 * 1024 * 1024,
  
  // Tax rate (GST) standard for hospitality in India
  taxRatePercent: 12,

  // Loyalty reward rate: 1 point per Rs. 100 spent
  loyaltyPointsRate: 100,

  userRoles: {
    CUSTOMER: 'customer',
    OWNER: 'owner',
    MANAGER: 'manager',
    RECEPTIONIST: 'receptionist',
    HOUSEKEEPING: 'housekeeping',
    MAINTENANCE: 'maintenance',
    ROOM_SERVICE: 'room_service',
    SECURITY: 'security',
    KITCHEN: 'kitchen',
    ADMIN: 'admin'
  }
};

