// =====================================================================
// INTELLISTAY: Customer Wishlist & Saved Stays Controller
// =====================================================================

const db = require('../../database/db');

// 1. Get Customer's Wishlist
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const [wishlist] = await db.query(
      `SELECT w.id AS wishlist_id, w.created_at AS saved_at,
              h.id, h.name, h.slug, h.category, h.star_rating, h.city, h.state, h.base_price_per_night,
              (SELECT image_url FROM hotel_images WHERE hotel_id = h.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS primary_image,
              (SELECT COUNT(*) FROM reviews WHERE hotel_id = h.id) AS review_count
       FROM wishlists w
       JOIN hotels h ON w.hotel_id = h.id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      wishlist
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Toggle Wishlist (Save / Unsave)
exports.toggleWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { hotel_id } = req.body;

    if (!hotel_id) {
      return res.status(400).json({ success: false, message: 'Hotel ID is required.' });
    }

    const [existing] = await db.query('SELECT id FROM wishlists WHERE user_id = ? AND hotel_id = ?', [userId, hotel_id]);

    if (existing.length > 0) {
      await db.query('DELETE FROM wishlists WHERE id = ?', [existing[0].id]);
      return res.status(200).json({
        success: true,
        is_saved: false,
        message: 'Removed from your saved stays.'
      });
    } else {
      await db.query('INSERT INTO wishlists (user_id, hotel_id) VALUES (?, ?)', [userId, hotel_id]);
      return res.status(200).json({
        success: true,
        is_saved: true,
        message: 'Added to your saved stays.'
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

