// =====================================================================
// INTELLISTAY: Staff & Operations Routes
// =====================================================================

const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { authenticate, authorize, enforceHotelOwnership } = require('../middleware/auth');

// Hotel Staff Roster (Owner, Manager)
router.get('/hotel/:hotelId', authenticate, authorize('owner', 'manager'), enforceHotelOwnership, staffController.getHotelStaff);
router.post('/hotel/:hotelId/add', authenticate, authorize('owner', 'manager'), enforceHotelOwnership, staffController.addStaffMember);
router.put('/member/:staffId', authenticate, authorize('owner', 'manager'), staffController.updateStaffMember);
router.patch('/member/:staffId/status', authenticate, authorize('owner', 'manager'), staffController.toggleStaffStatus);
router.delete('/member/:staffId', authenticate, authorize('owner', 'manager'), staffController.deleteStaffMember);

// Front Desk Board
router.get('/hotel/:hotelId/front-desk', authenticate, authorize('owner', 'manager', 'receptionist'), enforceHotelOwnership, staffController.getFrontDeskBoard);

// Housekeeping
router.get('/hotel/:hotelId/housekeeping', authenticate, authorize('owner', 'manager', 'receptionist', 'housekeeping'), enforceHotelOwnership, staffController.getHousekeepingTasks);
router.patch('/housekeeping/:taskId', authenticate, authorize('owner', 'manager', 'housekeeping'), staffController.updateHousekeepingTask);

// Maintenance
router.get('/hotel/:hotelId/maintenance', authenticate, authorize('owner', 'manager', 'maintenance', 'receptionist'), enforceHotelOwnership, staffController.getMaintenanceTasks);
router.post('/hotel/:hotelId/maintenance', authenticate, authorize('owner', 'manager', 'maintenance', 'receptionist', 'housekeeping'), enforceHotelOwnership, staffController.createMaintenanceTask);
router.patch('/maintenance/:taskId', authenticate, authorize('owner', 'manager', 'maintenance'), staffController.updateMaintenanceTask);

// Service Orders (Kitchen / Room Service)
router.get('/hotel/:hotelId/service-orders', authenticate, authorize('owner', 'manager', 'room_service', 'kitchen'), enforceHotelOwnership, staffController.getServiceOrders);
router.patch('/service-orders/:orderId', authenticate, authorize('owner', 'manager', 'room_service', 'kitchen'), staffController.updateServiceOrderStatus);

module.exports = router;

