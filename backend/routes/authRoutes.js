// =====================================================================
// INTELLISTAY: Auth Routes
// =====================================================================

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register/customer', authController.registerCustomer);
router.post('/register/owner', authController.registerOwner);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/change-password', authenticate, authController.changePassword);
router.post('/logout', authController.logout);

module.exports = router;

