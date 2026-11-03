// =====================================================================
// INTELLISTAY: Hotel Discovery & Management Controller
// =====================================================================

const db = require('../../database/db');

// 1. Public Search & Filter Hotels
exports.searchHotels = async (req, res) => {
  try {
    const {
      destination,
      checkIn,
      checkOut,
      guests,
      minPrice,
      maxPrice,
      categories,
      minRating,
      amenities,
      sort,
      page = 1,
      limit = 12
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let whereClauses = ["h.approval_status = 'approved'", "h.status = 'active'"];
    let params = [];

    // Filter: Destination (City, State, or Hotel Name)
    if (destination && destination.trim()) {
      const term = `%${destination.trim().toLowerCase()}%`;
      whereClauses.push('(LOWER(h.city) LIKE ? OR LOWER(h.state) LIKE ? OR LOWER(h.name) LIKE ?)');
      params.push(term, term, term);
    }

    // Filter: Categories (comma-separated or single)
    if (categories) {
      const catList = Array.isArray(categories) ? categories : categories.split(',').map(c => c.trim());
      if (catList.length > 0) {
        const placeholders = catList.map(() => '?').join(',');
        whereClauses.push(`h.category IN (${placeholders})`);
        params.push(...catList);
      }
    }

    // Filter: Minimum Star Rating
    if (minRating) {
      whereClauses.push('h.star_rating >= ?');
      params.push(parseFloat(minRating));
    }

    // Filter: Base Price Range
    if (minPrice) {
      whereClauses.push('h.base_price_per_night >= ?');
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      whereClauses.push('h.base_price_per_night <= ?');
      params.push(parseFloat(maxPrice));
    }

    // Filter: Guest Capacity
    if (guests) {
      const guestsCount = parseInt(guests, 10);
      whereClauses.push(`EXISTS (
        SELECT 1 FROM room_types rt 
        WHERE rt.hotel_id = h.id AND (rt.capacity_adults + rt.capacity_children) >= ?
      )`);
      params.push(guestsCount);
    }

    // Filter: Specific Amenities (All must match)
    if (amenities) {
      const amenList = Array.isArray(amenities) ? amenities : amenities.split(',').map(a => a.trim());
      for (const amenCode of amenList) {
        if (amenCode) {
          whereClauses.push(`EXISTS (
            SELECT 1 FROM hotel_amenities ha 
            JOIN amenities a ON ha.amenity_id = a.id 
            WHERE ha.hotel_id = h.id AND a.code = ?
          )`);
          params.push(amenCode);
        }
      }
    }

    // Sorting
    let orderBy = 'h.is_featured DESC, h.star_rating DESC';
    if (sort === 'price_asc') {
      orderBy = 'h.base_price_per_night ASC';
    } else if (sort === 'price_desc') {
      orderBy = 'h.base_price_per_night DESC';
    } else if (sort === 'rating_desc') {
      orderBy = 'h.star_rating DESC';
    } else if (sort === 'rating_asc') {
      orderBy = 'h.star_rating ASC';
    } else if (sort === 'newest') {
      orderBy = 'h.id DESC';
    } else if (sort === 'popular') {
      orderBy = 'h.star_rating DESC, h.id ASC';
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Total Count
    const countSql = `SELECT COUNT(*) AS total FROM hotels h ${whereSql}`;
    const [countRows] = await db.query(countSql, params);
    const total = countRows[0].total || 0;

    // Fetch Hotels
    const dataSql = `
      SELECT 
        h.id, h.name, h.slug, h.category, h.star_rating, h.description, 
        h.address, h.city, h.state, h.pincode, h.base_price_per_night, 
        h.is_featured, h.cancellation_policy,
        (SELECT image_url FROM hotel_images WHERE hotel_id = h.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS primary_image,
        (SELECT COUNT(*) FROM reviews WHERE hotel_id = h.id) AS review_count
      FROM hotels h
      ${whereSql}
      ORDER BY ${orderBy}
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const [hotels] = await db.query(dataSql, params);

    // Fetch amenities for each returned hotel
    const hotelIds = hotels.map(h => h.id);
    let amenitiesByHotel = {};
    if (hotelIds.length > 0) {
      const placeholders = hotelIds.map(() => '?').join(',');
      const [amenRows] = await db.query(
        `SELECT ha.hotel_id, a.name, a.code, a.icon, a.category
         FROM hotel_amenities ha
         JOIN amenities a ON ha.amenity_id = a.id
         WHERE ha.hotel_id IN (${placeholders})`,
        hotelIds
      );
      amenRows.forEach(r => {
        if (!amenitiesByHotel[r.hotel_id]) amenitiesByHotel[r.hotel_id] = [];
        amenitiesByHotel[r.hotel_id].push(r);
      });
    }

    const enrichedHotels = hotels.map(h => ({
      ...h,
      amenities: amenitiesByHotel[h.id] || []
    }));

    return res.status(200).json({
      success: true,
      data: enrichedHotels,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    console.error('Search hotels error:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving hotel stays.' });
  }
};

// 2. Get Featured Destinations & Landing Page Curations
exports.getLandingCurations = async (req, res) => {
  try {
    // 1. Featured Top-Rated Stays
    const [topRated] = await db.query(
      `SELECT h.id, h.name, h.slug, h.category, h.star_rating, h.city, h.state, h.base_price_per_night,
              (SELECT image_url FROM hotel_images WHERE hotel_id = h.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS primary_image,
              (SELECT COUNT(*) FROM reviews WHERE hotel_id = h.id) AS review_count
       FROM hotels h
       WHERE h.approval_status = 'approved' AND h.status = 'active'
       ORDER BY h.star_rating DESC, h.is_featured DESC
       LIMIT 6`
    );

    // 2. Budget-Friendly Escapes (< Rs. 4000)
    const [budgetFriendly] = await db.query(
      `SELECT h.id, h.name, h.slug, h.category, h.star_rating, h.city, h.state, h.base_price_per_night,
              (SELECT image_url FROM hotel_images WHERE hotel_id = h.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS primary_image
       FROM hotels h
       WHERE h.approval_status = 'approved' AND h.status = 'active' AND h.base_price_per_night <= 4000
       ORDER BY h.star_rating DESC
       LIMIT 6`
    );

    // 3. Iconic Luxury & Heritage Resorts
    const [luxuryResorts] = await db.query(
      `SELECT h.id, h.name, h.slug, h.category, h.star_rating, h.city, h.state, h.base_price_per_night,
              (SELECT image_url FROM hotel_images WHERE hotel_id = h.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS primary_image
       FROM hotels h
       WHERE h.approval_status = 'approved' AND h.status = 'active' AND h.category IN ('Luxury', 'Resort')
       ORDER BY h.star_rating DESC
       LIMIT 6`
    );

    // 4. Distinct Destination Counts
    const [destinationSummary] = await db.query(
      `SELECT city, state, COUNT(*) AS stay_count, MIN(base_price_per_night) AS starting_price,
              (SELECT image_url FROM hotel_images hi JOIN hotels h2 ON hi.hotel_id = h2.id WHERE h2.city = hotels.city LIMIT 1) AS dest_image
       FROM hotels
       WHERE approval_status = 'approved' AND status = 'active'
       GROUP BY city, state
       ORDER BY stay_count DESC
       LIMIT 8`
    );

    return res.status(200).json({
      success: true,
      topRated,
      budgetFriendly,
      luxuryResorts,
      destinations: destinationSummary
    });
  } catch (err) {
    console.error('Landing curations error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Get Hotel Details by ID or Slug
exports.getHotelById = async (req, res) => {
  try {
    const identifier = req.params.idOrSlug;
    const isNumeric = /^\d+$/.test(identifier);

    const sql = isNumeric 
      ? 'SELECT * FROM hotels WHERE id = ?' 
      : 'SELECT * FROM hotels WHERE slug = ?';

    const [hotels] = await db.query(sql, [identifier]);

    if (!hotels || hotels.length === 0) {
      return res.status(404).json({ success: false, message: 'Hotel not found.' });
    }

    const hotel = hotels[0];

    // Images
    const [images] = await db.query(
      'SELECT id, image_url, caption, is_primary FROM hotel_images WHERE hotel_id = ? ORDER BY is_primary DESC, id ASC',
      [hotel.id]
    );

    // Amenities
    const [amenitiesList] = await db.query(
      `SELECT a.id, a.name, a.code, a.icon, a.category 
       FROM hotel_amenities ha
       JOIN amenities a ON ha.amenity_id = a.id
       WHERE ha.hotel_id = ?`,
      [hotel.id]
    );

    // Room Types with live available counts
    const [roomTypes] = await db.query(
      `SELECT rt.*, 
              (SELECT COUNT(*) FROM rooms r WHERE r.room_type_id = rt.id AND r.status = 'available') AS available_inventory
       FROM room_types rt
       WHERE rt.hotel_id = ?`,
      [hotel.id]
    );

    // Recent Reviews
    const [reviews] = await db.query(
      `SELECT r.*, u.full_name AS reviewer_name, u.avatar_url AS reviewer_avatar
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.hotel_id = ?
       ORDER BY r.created_at DESC LIMIT 10`,
      [hotel.id]
    );

    // Review statistics
    const [reviewStats] = await db.query(
      `SELECT 
         COUNT(*) as total_reviews,
         AVG(rating) as avg_rating,
         AVG(cleanliness_rating) as avg_cleanliness,
         AVG(staff_rating) as avg_staff,
         AVG(service_rating) as avg_service,
         AVG(value_rating) as avg_value
       FROM reviews WHERE hotel_id = ?`,
      [hotel.id]
    );

    // Owner contact info
    const [owner] = await db.query('SELECT id, full_name, email, phone FROM users WHERE id = ?', [hotel.owner_id]);

    return res.status(200).json({
      success: true,
      hotel: {
        ...hotel,
        images,
        amenities: amenitiesList,
        roomTypes,
        reviews,
        reviewStats: reviewStats[0] || {},
        owner: owner[0] || {}
      }
    });
  } catch (err) {
    console.error('Get hotel detail error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Hotel Comparison (up to 3 hotels)
exports.compareHotels = async (req, res) => {
  try {
    const { ids } = req.query;
    if (!ids) {
      return res.status(400).json({ success: false, message: 'Please provide comma-separated hotel IDs to compare.' });
    }

    const hotelIdList = ids.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id)).slice(0, 3);
    if (hotelIdList.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid hotel IDs provided.' });
    }

    const placeholders = hotelIdList.map(() => '?').join(',');

    const [hotels] = await db.query(
      `SELECT h.*, 
              (SELECT image_url FROM hotel_images WHERE hotel_id = h.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS primary_image,
              (SELECT COUNT(*) FROM reviews WHERE hotel_id = h.id) AS review_count
       FROM hotels h
       WHERE h.id IN (${placeholders})`,
      hotelIdList
    );

    // Get amenities for all compared hotels
    const [amenitiesRows] = await db.query(
      `SELECT ha.hotel_id, a.id, a.name, a.code, a.icon, a.category
       FROM hotel_amenities ha
       JOIN amenities a ON ha.amenity_id = a.id
       WHERE ha.hotel_id IN (${placeholders})`,
      hotelIdList
    );

    // Get room types for all compared hotels
    const [roomTypeRows] = await db.query(
      `SELECT rt.hotel_id, rt.name, rt.base_price, rt.capacity_adults, rt.capacity_children, rt.bed_type, rt.room_size_sqft
       FROM room_types rt
       WHERE rt.hotel_id IN (${placeholders})`,
      hotelIdList
    );

    const result = hotels.map(hotel => ({
      ...hotel,
      amenities: amenitiesRows.filter(a => a.hotel_id === hotel.id),
      roomTypes: roomTypeRows.filter(rt => rt.hotel_id === hotel.id)
    }));

    return res.status(200).json({
      success: true,
      hotels: result
    });
  } catch (err) {
    console.error('Compare hotels error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Owner: List all owned properties
exports.getOwnerHotels = async (req, res) => {
  try {
    const ownerId = req.user.id;

    const [hotels] = await db.query(
      `SELECT h.*,
              (SELECT image_url FROM hotel_images WHERE hotel_id = h.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS primary_image,
              (SELECT COUNT(*) FROM rooms WHERE hotel_id = h.id) AS total_rooms,
              (SELECT COUNT(*) FROM rooms WHERE hotel_id = h.id AND status = 'available') AS available_rooms,
              (SELECT COUNT(*) FROM rooms WHERE hotel_id = h.id AND status = 'occupied') AS occupied_rooms,
              (SELECT COUNT(*) FROM rooms WHERE hotel_id = h.id AND (status = 'cleaning' OR housekeeping_status = 'dirty')) AS dirty_rooms,
              (SELECT COUNT(*) FROM bookings WHERE hotel_id = h.id AND booking_status = 'confirmed') AS upcoming_bookings
       FROM hotels h
       WHERE h.owner_id = ?
       ORDER BY h.id DESC`,
      [ownerId]
    );

    return res.status(200).json({
      success: true,
      hotels
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 6. Owner: Create New Hotel
exports.createHotel = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const {
      name,
      category,
      star_rating = 4.0,
      description,
      address,
      city,
      state,
      pincode,
      contact_phone,
      contact_email,
      check_in_time = '14:00',
      check_out_time = '11:00',
      base_price_per_night,
      amenities = [],
      primary_image_url
    } = req.body;

    if (!name || !city || !state || !address || !base_price_per_night) {
      return res.status(400).json({ success: false, message: 'Please provide all required hotel details.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

    const [resHotel] = await db.query(
      `INSERT INTO hotels (owner_id, name, slug, category, star_rating, description, address, city, state, pincode, contact_phone, contact_email, check_in_time, check_out_time, base_price_per_night, approval_status, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 'active')`,
      [ownerId, name.trim(), slug, category || 'Boutique', parseFloat(star_rating), description || '', address.trim(), city.trim(), state.trim(), pincode || '560001', contact_phone || req.user.phone, contact_email || req.user.email, check_in_time, check_out_time, parseFloat(base_price_per_night)]
    );

    const hotelId = resHotel.insertId;

    // Add primary image
    const imgUrl = primary_image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';
    await db.query(
      'INSERT INTO hotel_images (hotel_id, image_url, caption, is_primary) VALUES (?, ?, ?, 1)',
      [hotelId, imgUrl, 'Main Exterior View']
    );

    // Map amenities
    if (Array.isArray(amenities) && amenities.length > 0) {
      for (const amenId of amenities) {
        try {
          await db.query('INSERT INTO hotel_amenities (hotel_id, amenity_id) VALUES (?, ?)', [hotelId, amenId]);
        } catch (ignored) {}
      }
    }

    // Automatically create 4 room types & 20+ physical rooms across 4 floors
    const defaultCategories = [
      { name: 'Deluxe Classic Room', slug: `${slug}-deluxe`, price: parseFloat(base_price_per_night), adults: 2, children: 1, bed: 'King Bed', size: 350, floor: 1 },
      { name: 'Executive Premium Suite', slug: `${slug}-executive`, price: Math.round(parseFloat(base_price_per_night) * 1.5), adults: 3, children: 2, bed: 'Super King Bed', size: 520, floor: 2 },
      { name: 'Royal Heritage Villa', slug: `${slug}-royal-villa`, price: Math.round(parseFloat(base_price_per_night) * 2.2), adults: 4, children: 2, bed: '2 King Beds', size: 850, floor: 3 },
      { name: 'Garden Terrace Studio', slug: `${slug}-studio`, price: Math.round(parseFloat(base_price_per_night) * 1.2), adults: 2, children: 1, bed: 'Queen Bed', size: 400, floor: 4 }
    ];

    for (const cat of defaultCategories) {
      const [rtRes] = await db.query(
        `INSERT INTO room_types (hotel_id, name, slug, description, base_price, capacity_adults, capacity_children, bed_type, room_size_sqft, total_rooms)
         VALUES (?, ?, ?, 'Premium accommodations with bespoke interior styling and en-suite bath.', ?, ?, ?, ?, ?, 5)`,
        [hotelId, cat.name, cat.slug, cat.price, cat.adults, cat.children, cat.bed, cat.size]
      );
      const roomTypeId = rtRes.insertId;

      // Create 5 physical rooms per floor = 20 total rooms
      for (let rNum = 1; rNum <= 5; rNum++) {
        const roomNumber = `${cat.floor}0${rNum}`;
        const status = (cat.floor === 1 && rNum === 1) ? 'occupied' : (cat.floor === 1 && rNum === 2) ? 'cleaning' : 'available';
        const hkStatus = (cat.floor === 1 && rNum === 2) ? 'dirty' : 'clean';

        await db.query(
          'INSERT INTO rooms (hotel_id, room_type_id, room_number, floor_number, status, housekeeping_status) VALUES (?, ?, ?, ?, ?, ?)',
          [hotelId, roomTypeId, roomNumber, cat.floor, status, hkStatus]
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Hotel added successfully with initialized room inventory and amenities.',
      hotel_id: hotelId
    });
  } catch (err) {
    console.error('Create hotel error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 7. Owner: Update Hotel Details
exports.updateHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { name, category, description, address, city, state, pincode, base_price_per_night, check_in_time, check_out_time, cancellation_policy } = req.body;

    await db.query(
      `UPDATE hotels 
       SET name = COALESCE(?, name),
           category = COALESCE(?, category),
           description = COALESCE(?, description),
           address = COALESCE(?, address),
           city = COALESCE(?, city),
           state = COALESCE(?, state),
           pincode = COALESCE(?, pincode),
           base_price_per_night = COALESCE(?, base_price_per_night),
           check_in_time = COALESCE(?, check_in_time),
           check_out_time = COALESCE(?, check_out_time),
           cancellation_policy = COALESCE(?, cancellation_policy)
       WHERE id = ?`,
      [name, category, description, address, city, state, pincode, base_price_per_night, check_in_time, check_out_time, cancellation_policy, hotelId]
    );

    return res.status(200).json({
      success: true,
      message: 'Hotel property details updated successfully.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 8. Admin: List All Hotels with Approval / Status Filter
exports.adminGetAllHotels = async (req, res) => {
  try {
    const { approval_status, status } = req.query;
    let whereClauses = [];
    let params = [];

    if (approval_status) {
      whereClauses.push('h.approval_status = ?');
      params.push(approval_status);
    }
    if (status) {
      whereClauses.push('h.status = ?');
      params.push(status);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [hotels] = await db.query(
      `SELECT h.*, u.full_name AS owner_name, u.email AS owner_email,
              (SELECT COUNT(*) FROM rooms WHERE hotel_id = h.id) AS total_rooms,
              (SELECT COUNT(*) FROM bookings WHERE hotel_id = h.id) AS total_bookings
       FROM hotels h
       JOIN users u ON h.owner_id = u.id
       ${whereSql}
       ORDER BY h.id DESC`,
      params
    );

    return res.status(200).json({
      success: true,
      hotels
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 9. Admin: Approve or Reject Hotel
exports.adminSetApprovalStatus = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { approval_status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(approval_status)) {
      return res.status(400).json({ success: false, message: 'Invalid approval status.' });
    }

    await db.query('UPDATE hotels SET approval_status = ? WHERE id = ?', [approval_status, hotelId]);

    return res.status(200).json({
      success: true,
      message: `Hotel status updated to ${approval_status}.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 10. Admin: Toggle Active / Inactive
exports.adminToggleHotelStatus = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const [h] = await db.query('SELECT status FROM hotels WHERE id = ?', [hotelId]);
    if (!h || h.length === 0) return res.status(404).json({ success: false, message: 'Hotel not found.' });

    const newStatus = h[0].status === 'active' ? 'inactive' : 'active';
    await db.query('UPDATE hotels SET status = ? WHERE id = ?', [newStatus, hotelId]);

    return res.status(200).json({
      success: true,
      message: `Hotel is now ${newStatus}.`,
      status: newStatus
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 11. Master Amenities List
exports.getAllAmenities = async (req, res) => {
  try {
    const [amenities] = await db.query('SELECT * FROM amenities ORDER BY category, name');
    return res.status(200).json({ success: true, amenities });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

