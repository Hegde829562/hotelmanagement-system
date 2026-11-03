// =====================================================================
// INTELLISTAY: Booking & Reservation Routes
// =====================================================================

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate, authorize, enforceHotelOwnership } = require('../middleware/auth');

// Public availability check
router.get('/check-availability', bookingController.checkAvailability);

// Customer transactional booking
router.post('/create', authenticate, authorize('customer'), bookingController.createBooking);

// Customer bookings list
router.get('/my-bookings', authenticate, authorize('customer'), bookingController.getCustomerBookings);

// Customer booking cancellation
router.patch('/:bookingId/cancel', authenticate, authorize('customer'), bookingController.cancelBooking);

// Owner / Front Desk: Get bookings for hotel
router.get('/hotel/:hotelId', authenticate, authorize('owner', 'manager', 'receptionist'), enforceHotelOwnership, bookingController.getHotelBookings);

// Front Desk: Check-in guest
router.patch('/:bookingId/check-in', authenticate, authorize('owner', 'manager', 'receptionist'), bookingController.checkInGuest);

// Front Desk: Check-out guest
router.patch('/:bookingId/check-out', authenticate, authorize('owner', 'manager', 'receptionist'), bookingController.checkOutGuest);

module.exports = router;

