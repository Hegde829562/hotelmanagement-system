// =====================================================================
// INTELLISTAY: Analytics Routes
// =====================================================================

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/owner', authenticate, authorize('owner', 'manager'), analyticsController.getOwnerAnalytics);
router.get('/admin', authenticate, authorize('admin'), analyticsController.getAdminAnalytics);

module.exports = router;

