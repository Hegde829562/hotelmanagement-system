// =====================================================================
// INTELLISTAY: Room & Inventory Routes
// =====================================================================

const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { authenticate, authorize, enforceHotelOwnership } = require('../middleware/auth');

// Public or Authenticated: Get rooms for hotel
router.get('/hotel/:hotelId', roomController.getHotelRooms);

// Owner / Manager: Create room type
router.post('/hotel/:hotelId/type', authenticate, authorize('owner', 'manager'), enforceHotelOwnership, roomController.createRoomType);

// Owner / Manager: Add physical room
router.post('/hotel/:hotelId/room', authenticate, authorize('owner', 'manager'), enforceHotelOwnership, roomController.addPhysicalRoom);

// Owner / Manager / Receptionist / Housekeeping / Maintenance: Update room status
router.patch('/room/:roomId/status', authenticate, authorize('owner', 'manager', 'receptionist', 'housekeeping', 'maintenance'), roomController.updateRoomStatus);

module.exports = router;

