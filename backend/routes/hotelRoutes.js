// =====================================================================
// INTELLISTAY: Hotel Discovery & Management Routes
// =====================================================================

const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const { authenticate, authorize, enforceHotelOwnership } = require('../middleware/auth');

// Public routes
router.get('/', hotelController.searchHotels);
router.get('/curations/landing', hotelController.getLandingCurations);
router.get('/amenities/all', hotelController.getAllAmenities);
router.get('/compare', hotelController.compareHotels);
router.get('/:idOrSlug', hotelController.getHotelById);

// Owner routes
router.get('/owner/my-hotels', authenticate, authorize('owner'), hotelController.getOwnerHotels);
router.post('/owner/create', authenticate, authorize('owner'), hotelController.createHotel);
router.put('/owner/:hotelId', authenticate, authorize('owner'), enforceHotelOwnership, hotelController.updateHotel);

// Admin routes
router.get('/admin/all', authenticate, authorize('admin'), hotelController.adminGetAllHotels);
router.patch('/admin/:hotelId/approval', authenticate, authorize('admin'), hotelController.adminSetApprovalStatus);
router.patch('/admin/:hotelId/status', authenticate, authorize('admin'), hotelController.adminToggleHotelStatus);

module.exports = router;

