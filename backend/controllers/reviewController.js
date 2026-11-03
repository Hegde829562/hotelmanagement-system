// =====================================================================
// INTELLISTAY: Reviews & Guest Feedback Controller
// =====================================================================

const db = require('../../database/db');

// 1. Get Reviews for a Hotel
exports.getHotelReviews = async (req, res) => {
  try {
    const { hotelId } = req.params;

    const [reviews] = await db.query(
      `SELECT r.*, u.full_name AS reviewer_name, u.avatar_url AS reviewer_avatar
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.hotel_id = ?
       ORDER BY r.created_at DESC`,
      [hotelId]
    );

    const [stats] = await db.query(
      `SELECT 
         COUNT(*) as total_reviews,
         AVG(rating) as avg_rating,
         AVG(cleanliness_rating) as avg_cleanliness,
         AVG(staff_rating) as avg_staff,
         AVG(service_rating) as avg_service,
         AVG(value_rating) as avg_value
       FROM reviews WHERE hotel_id = ?`,
      [hotelId]
    );

    return res.status(200).json({
      success: true,
      reviews,
      stats: stats[0] || {}
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Submit a Review (Customer Verified)
exports.createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      hotel_id,
      booking_id,
      rating,
      title,
      comment,
      cleanliness_rating = 5.0,
      staff_rating = 5.0,
      service_rating = 5.0,
      value_rating = 5.0
    } = req.body;

    if (!hotel_id || !rating || !title || !comment) {
      return res.status(400).json({ success: false, message: 'Please provide rating, title, and review comments.' });
    }

    // Insert review
    const [revRes] = await db.query(
      `INSERT INTO reviews (hotel_id, user_id, booking_id, rating, title, comment, cleanliness_rating, staff_rating, service_rating, value_rating, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        hotel_id, userId, booking_id || null,
        parseFloat(rating), title.trim(), comment.trim(),
        parseFloat(cleanliness_rating), parseFloat(staff_rating),
        parseFloat(service_rating), parseFloat(value_rating)
      ]
    );

    // Recompute hotel's average star rating
    const [avgRes] = await db.query('SELECT AVG(rating) as new_avg FROM reviews WHERE hotel_id = ?', [hotel_id]);
    if (avgRes.length > 0 && avgRes[0].new_avg) {
      const rounded = Math.round(avgRes[0].new_avg * 10) / 10;
      await db.query('UPDATE hotels SET star_rating = ? WHERE id = ?', [rounded, hotel_id]);
    }

    return res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! Your review has been published.',
      review_id: revRes.insertId
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

