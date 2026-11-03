// =====================================================================
// INTELLISTAY: Wishlist Routes
// =====================================================================

const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('customer'), wishlistController.getWishlist);
router.post('/toggle', authenticate, authorize('customer'), wishlistController.toggleWishlist);

module.exports = router;

