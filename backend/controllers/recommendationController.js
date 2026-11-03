// =====================================================================
// INTELLISTAY: Rule-Based Stay Recommendation Engine
// Provides curated recommendations with clear, natural explanations
// =====================================================================

const db = require('../../database/db');

// 1. Get Curated Recommendations with Explanations
exports.getRecommendations = async (req, res) => {
  try {
    const { category, city, maxPrice } = req.query;

    // Rule 1: Highest-Rated Luxury Escapes (Rating >= 4.8, Category Luxury or Resort)
    const [luxuryEscapes] = await db.query(
      `SELECT h.*, 
              (SELECT image_url FROM hotel_images WHERE hotel_id = h.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS primary_image,
              (SELECT COUNT(*) FROM reviews WHERE hotel_id = h.id) AS review_count
       FROM hotels h
       WHERE h.approval_status = 'approved' AND h.status = 'active'
         AND h.star_rating >= 4.8 
         AND h.category IN ('Luxury', 'Resort', 'Boutique')
       ORDER BY h.star_rating DESC, h.is_featured DESC
       LIMIT 4`
    );

    const luxuryWithReasons = luxuryEscapes.map(hotel => ({
      ...hotel,
      recommendation_badge: 'Exceptional Luxury',
      recommendation_reason: `Recommended for peerless guest satisfaction with a verified ${hotel.star_rating}/5.0 rating across verified reviews.`
    }));

    // Rule 2: Best Value-for-Money Stays (High rating >= 4.6, Base price <= Rs. 4,500)
    const [bestValue] = await db.query(
      `SELECT h.*, 
              (SELECT image_url FROM hotel_images WHERE hotel_id = h.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS primary_image,
              (SELECT COUNT(*) FROM reviews WHERE hotel_id = h.id) AS review_count
       FROM hotels h
       WHERE h.approval_status = 'approved' AND h.status = 'active'
         AND h.star_rating >= 4.6 
         AND h.base_price_per_night <= 4500
       ORDER BY (h.star_rating / h.base_price_per_night) DESC
       LIMIT 4`
    );

    const bestValueWithReasons = bestValue.map(hotel => ({
      ...hotel,
      recommendation_badge: 'Best Value for Money',
      recommendation_reason: `Calculated as prime value offering premium comfort (${hotel.star_rating}★) at an accessible rate of under ₹4,500 per night.`
    }));

    // Rule 3: Serene Nature & Mountain Sanctuaries (Hill Station / Resort with mountain/view)
    const [natureRetreats] = await db.query(
      `SELECT h.*, 
              (SELECT image_url FROM hotel_images WHERE hotel_id = h.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS primary_image,
              (SELECT COUNT(*) FROM reviews WHERE hotel_id = h.id) AS review_count
       FROM hotels h
       WHERE h.approval_status = 'approved' AND h.status = 'active'
         AND (h.category = 'Hill Station' OR h.city IN ('Coorg', 'Ooty', 'Munnar', 'Manali', 'Shimla', 'Rishikesh', 'Wayanad'))
       ORDER BY h.star_rating DESC
       LIMIT 4`
    );

    const natureWithReasons = natureRetreats.map(hotel => ({
      ...hotel,
      recommendation_badge: 'Tranquil Nature Retreat',
      recommendation_reason: `Selected for breathtaking natural surroundings, fresh air, and peaceful highland retreats away from busy city life.`
    }));

    // Rule 4: Coastal & Beach Escapes (Goa, Varkala, Gokarna, Chennai beach stays)
    const [beachEscapes] = await db.query(
      `SELECT h.*, 
              (SELECT image_url FROM hotel_images WHERE hotel_id = h.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS primary_image,
              (SELECT COUNT(*) FROM reviews WHERE hotel_id = h.id) AS review_count
       FROM hotels h
       WHERE h.approval_status = 'approved' AND h.status = 'active'
         AND (h.category = 'Beach Stay' OR h.city IN ('Goa', 'Varkala', 'Gokarna', 'Kochi'))
       ORDER BY h.star_rating DESC
       LIMIT 4`
    );

    const beachWithReasons = beachEscapes.map(hotel => ({
      ...hotel,
      recommendation_badge: 'Seaside Coastal Escape',
      recommendation_reason: `Recommended for proximity to scenic coastlines, ocean breeze, and relaxed waterside living.`
    }));

    return res.status(200).json({
      success: true,
      sections: [
        {
          id: 'luxury',
          title: 'Top Rated Luxury & Heritage Sanctuaries',
          description: 'Properties maintaining unmatched review standards and architectural elegance.',
          stays: luxuryWithReasons
        },
        {
          id: 'value',
          title: 'Best Value for Money',
          description: 'High guest ratings paired with sensible, budget-friendly pricing.',
          stays: bestValueWithReasons
        },
        {
          id: 'nature',
          title: 'Highland & Nature Retreats',
          description: 'Serene mountain lodges, coffee plantations, and cloudline hideaways.',
          stays: natureWithReasons
        },
        {
          id: 'coastal',
          title: 'Coastal & Beachside Getaways',
          description: 'Sun-drenched seaside villas and tranquil ocean cliff retreats.',
          stays: beachWithReasons
        }
      ]
    });
  } catch (err) {
    console.error('Recommendations error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

