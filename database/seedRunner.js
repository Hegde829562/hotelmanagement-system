// =====================================================================
// INTELLISTAY: Database Seeder and Migration Runner
// Populates 52+ hotels, 10 user roles, 24 physical rooms per hotel,
// staff assignments across hotels, tasks, and bookings.
// =====================================================================

const fs = require('fs');
const path = require('path');
const db = require('./db');
const { amenities, users, hospitalityImages, roomImages, hotelsData } = require('./seedData');

async function runSeed() {
  console.log('🚀 Starting IntelliStay Database Migration & Seeding...');
  await db.initDb();

  // Drop tables to guarantee a fresh, consistent schema with 20+ rooms per hotel
  const dropTables = [
    'notifications', 'wishlists', 'reviews', 'service_orders', 'maintenance_tasks',
    'housekeeping_tasks', 'staff_profiles', 'payments', 'booking_rooms', 'bookings',
    'rooms', 'room_types', 'hotel_amenities', 'amenities', 'hotel_images', 'hotels', 'users'
  ];

  for (const t of dropTables) {
    try {
      await db.query(`DROP TABLE IF EXISTS ${t}`);
    } catch (ignored) {}
  }

  // Create tables
  const tableDefinitions = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(120) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      phone VARCHAR(25) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(30) NOT NULL DEFAULT 'customer',
      loyalty_points INT NOT NULL DEFAULT 0,
      avatar_url VARCHAR(255) DEFAULT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS hotels (
      id INT AUTO_INCREMENT PRIMARY KEY,
      owner_id INT NOT NULL,
      name VARCHAR(150) NOT NULL,
      slug VARCHAR(180) NOT NULL UNIQUE,
      category VARCHAR(50) NOT NULL DEFAULT 'Boutique',
      star_rating DECIMAL(2,1) NOT NULL DEFAULT 4.0,
      description TEXT NOT NULL,
      address VARCHAR(255) NOT NULL,
      city VARCHAR(80) NOT NULL,
      state VARCHAR(80) NOT NULL,
      pincode VARCHAR(15) NOT NULL,
      latitude DECIMAL(10, 7) DEFAULT NULL,
      longitude DECIMAL(10, 7) DEFAULT NULL,
      contact_phone VARCHAR(25) NOT NULL,
      contact_email VARCHAR(120) NOT NULL,
      check_in_time VARCHAR(10) NOT NULL DEFAULT '14:00',
      check_out_time VARCHAR(10) NOT NULL DEFAULT '11:00',
      base_price_per_night DECIMAL(10, 2) NOT NULL DEFAULT 2500.00,
      is_featured TINYINT(1) NOT NULL DEFAULT 0,
      approval_status VARCHAR(20) NOT NULL DEFAULT 'approved',
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      cancellation_policy VARCHAR(255) DEFAULT 'Free cancellation up to 48 hours before check-in',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS hotel_images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hotel_id INT NOT NULL,
      image_url VARCHAR(500) NOT NULL,
      caption VARCHAR(150) DEFAULT NULL,
      is_primary TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS amenities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(80) NOT NULL UNIQUE,
      code VARCHAR(50) NOT NULL UNIQUE,
      icon VARCHAR(50) NOT NULL,
      category VARCHAR(50) NOT NULL DEFAULT 'Comfort'
    )`,

    `CREATE TABLE IF NOT EXISTS hotel_amenities (
      hotel_id INT NOT NULL,
      amenity_id INT NOT NULL,
      PRIMARY KEY (hotel_id, amenity_id)
    )`,

    `CREATE TABLE IF NOT EXISTS room_types (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hotel_id INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(120) NOT NULL,
      description TEXT,
      base_price DECIMAL(10,2) NOT NULL,
      capacity_adults INT NOT NULL DEFAULT 2,
      capacity_children INT NOT NULL DEFAULT 1,
      bed_type VARCHAR(50) NOT NULL DEFAULT 'King Bed',
      room_size_sqft INT NOT NULL DEFAULT 350,
      amenities_json TEXT DEFAULT NULL,
      image_url VARCHAR(500) DEFAULT NULL,
      total_rooms INT NOT NULL DEFAULT 6,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS rooms (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hotel_id INT NOT NULL,
      room_type_id INT NOT NULL,
      room_number VARCHAR(20) NOT NULL,
      floor_number INT NOT NULL DEFAULT 1,
      status VARCHAR(30) NOT NULL DEFAULT 'available',
      housekeeping_status VARCHAR(30) NOT NULL DEFAULT 'clean',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      booking_reference VARCHAR(30) NOT NULL UNIQUE,
      user_id INT NOT NULL,
      hotel_id INT NOT NULL,
      check_in_date DATE NOT NULL,
      check_out_date DATE NOT NULL,
      total_guests INT NOT NULL DEFAULT 2,
      total_rooms INT NOT NULL DEFAULT 1,
      total_amount DECIMAL(10,2) NOT NULL,
      tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      final_amount DECIMAL(10,2) NOT NULL,
      booking_status VARCHAR(30) NOT NULL DEFAULT 'confirmed',
      payment_status VARCHAR(30) NOT NULL DEFAULT 'completed',
      payment_method VARCHAR(50) NOT NULL DEFAULT 'Credit Card',
      special_requests TEXT DEFAULT NULL,
      cancellation_reason VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS booking_rooms (
      id INT AUTO_INCREMENT PRIMARY KEY,
      booking_id INT NOT NULL,
      room_id INT NOT NULL,
      room_type_id INT NOT NULL,
      price_per_night DECIMAL(10,2) NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      booking_id INT NOT NULL,
      transaction_reference VARCHAR(60) NOT NULL UNIQUE,
      amount DECIMAL(10,2) NOT NULL,
      payment_method VARCHAR(50) NOT NULL,
      payment_status VARCHAR(30) NOT NULL DEFAULT 'successful',
      payment_gateway_response TEXT DEFAULT NULL,
      paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS staff_profiles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      hotel_id INT NOT NULL,
      department VARCHAR(50) NOT NULL,
      employee_code VARCHAR(30) NOT NULL UNIQUE,
      shift VARCHAR(30) NOT NULL DEFAULT 'Morning',
      salary DECIMAL(10,2) DEFAULT 25000.00,
      date_of_joining DATE NOT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS housekeeping_tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hotel_id INT NOT NULL,
      room_id INT NOT NULL,
      assigned_to_user_id INT DEFAULT NULL,
      task_type VARCHAR(50) NOT NULL DEFAULT 'checkout_clean',
      priority VARCHAR(20) NOT NULL DEFAULT 'medium',
      status VARCHAR(30) NOT NULL DEFAULT 'pending',
      notes TEXT DEFAULT NULL,
      scheduled_date DATE NOT NULL,
      completed_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS maintenance_tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hotel_id INT NOT NULL,
      room_id INT DEFAULT NULL,
      reported_by_user_id INT NOT NULL,
      assigned_to_user_id INT DEFAULT NULL,
      issue_category VARCHAR(50) NOT NULL,
      title VARCHAR(150) NOT NULL,
      description TEXT NOT NULL,
      priority VARCHAR(20) NOT NULL DEFAULT 'medium',
      status VARCHAR(30) NOT NULL DEFAULT 'reported',
      resolution_notes TEXT DEFAULT NULL,
      reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP NULL DEFAULT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS service_orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hotel_id INT NOT NULL,
      booking_id INT NOT NULL,
      room_id INT NOT NULL,
      order_type VARCHAR(50) NOT NULL,
      items_description TEXT NOT NULL,
      total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      status VARCHAR(30) NOT NULL DEFAULT 'ordered',
      assigned_to_user_id INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hotel_id INT NOT NULL,
      user_id INT NOT NULL,
      booking_id INT DEFAULT NULL,
      rating DECIMAL(2,1) NOT NULL,
      title VARCHAR(150) NOT NULL,
      comment TEXT NOT NULL,
      cleanliness_rating DECIMAL(2,1) NOT NULL DEFAULT 5.0,
      staff_rating DECIMAL(2,1) NOT NULL DEFAULT 5.0,
      service_rating DECIMAL(2,1) NOT NULL DEFAULT 5.0,
      value_rating DECIMAL(2,1) NOT NULL DEFAULT 5.0,
      is_verified TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS wishlists (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      hotel_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(150) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(30) NOT NULL DEFAULT 'system',
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  console.log('📦 Creating database tables...');
  for (const tableSql of tableDefinitions) {
    await db.query(tableSql);
  }

  // 1. Seed Amenities
  console.log('✨ Seeding amenities catalog...');
  const amenityMap = {};
  for (const a of amenities) {
    const [res] = await db.query(
      'INSERT INTO amenities (name, code, icon, category) VALUES (?, ?, ?, ?)',
      [a.name, a.code, a.icon, a.category]
    );
    amenityMap[a.code] = res.insertId;
  }

  // 2. Seed Users
  console.log('👤 Seeding core user roles...');
  for (const u of users) {
    await db.query(
      `INSERT INTO users (id, full_name, email, phone, password_hash, role, loyalty_points, avatar_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.id, u.full_name, u.email, u.phone, u.password_hash, u.role, u.loyalty_points, u.avatar_url]
    );
  }

  // 3. Seed Hotels with AT LEAST 24 PHYSICAL ROOMS each!
  console.log(`🏨 Seeding ${hotelsData.length} authentic hotels with 24 rooms each across 4 floors...`);
  let hotelIndex = 0;
  for (const h of hotelsData) {
    hotelIndex++;
    const slug = h.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const contactPhone = `+91 9845${String(hotelIndex).padStart(4, '0')}0`;
    const contactEmail = `reservations@${slug.slice(0, 15)}.intellistay.in`;
    
    const [hRes] = await db.query(
      `INSERT INTO hotels (owner_id, name, slug, category, star_rating, description, address, city, state, pincode, contact_phone, contact_email, base_price_per_night, is_featured, approval_status, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 'active')`,
      [h.owner_id, h.name, slug, h.category, h.star_rating, h.description, h.address, h.city, h.state, h.pincode, contactPhone, contactEmail, h.base_price, h.is_featured]
    );
    const hotelId = hRes.insertId;

    // Hotel Images (3 images per hotel)
    const img1 = hospitalityImages[(hotelIndex * 3) % hospitalityImages.length];
    const img2 = hospitalityImages[(hotelIndex * 3 + 1) % hospitalityImages.length];
    const img3 = hospitalityImages[(hotelIndex * 3 + 2) % hospitalityImages.length];

    await db.query('INSERT INTO hotel_images (hotel_id, image_url, caption, is_primary) VALUES (?, ?, ?, 1)', [hotelId, img1, 'Facade & Grounds']);
    await db.query('INSERT INTO hotel_images (hotel_id, image_url, caption, is_primary) VALUES (?, ?, ?, 0)', [hotelId, img2, 'Lobby & Architectural Accents']);
    await db.query('INSERT INTO hotel_images (hotel_id, image_url, caption, is_primary) VALUES (?, ?, ?, 0)', [hotelId, img3, 'Lounge & Serene Atmosphere']);

    // Hotel Amenities mapping
    for (const code of h.amenities) {
      const amId = amenityMap[code];
      if (amId) {
        try {
          await db.query('INSERT INTO hotel_amenities (hotel_id, amenity_id) VALUES (?, ?)', [hotelId, amId]);
        } catch (ignored) {}
      }
    }

    // 4 Room Types per Hotel across 4 Floors (6 rooms per floor = 24 total rooms!)
    const types = [
      {
        name: 'Deluxe Heritage Room',
        slug: `${slug}-deluxe`,
        desc: 'Refined retreat featuring hand-woven textiles, bespoke furnishings, and garden terrace views.',
        price: h.base_price,
        adults: 2,
        children: 1,
        bed: 'King Bed',
        size: 380,
        floor: 1,
        img: roomImages[0]
      },
      {
        name: 'Executive Panorama Suite',
        slug: `${slug}-executive-suite`,
        desc: 'Elevated space with separate private sitting room, panoramic windows, and luxury marble bathroom.',
        price: Math.round(h.base_price * 1.5),
        adults: 3,
        children: 2,
        bed: 'Super King Bed',
        size: 560,
        floor: 2,
        img: roomImages[1]
      },
      {
        name: 'Signature Royal Sanctuary Villa',
        slug: `${slug}-sanctuary-villa`,
        desc: 'Expansive private domain featuring personal plunge pool or private sit-out and dedicated butler assistance.',
        price: Math.round(h.base_price * 2.3),
        adults: 4,
        children: 2,
        bed: '2 King Beds',
        size: 920,
        floor: 3,
        img: roomImages[2]
      },
      {
        name: 'Garden Terrace Studio',
        slug: `${slug}-studio`,
        desc: 'Tranquil garden-facing studio with private sun patio, organic cotton bedding, and artisan coffee bar.',
        price: Math.round(h.base_price * 1.2),
        adults: 2,
        children: 1,
        bed: 'Queen Bed',
        size: 420,
        floor: 4,
        img: roomImages[3] || roomImages[0]
      }
    ];

    for (let tIdx = 0; tIdx < types.length; tIdx++) {
      const rt = types[tIdx];
      const [rtRes] = await db.query(
        `INSERT INTO room_types (hotel_id, name, slug, description, base_price, capacity_adults, capacity_children, bed_type, room_size_sqft, image_url, total_rooms)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 6)`,
        [hotelId, rt.name, rt.slug, rt.desc, rt.price, rt.adults, rt.children, rt.bed, rt.size, rt.img]
      );
      const roomTypeId = rtRes.insertId;

      // 6 physical rooms per floor = 24 rooms per hotel!
      // Rooms: 101-106, 201-206, 301-306, 401-406
      for (let rNum = 1; rNum <= 6; rNum++) {
        const roomNumber = `${rt.floor}0${rNum}`;
        const floor = rt.floor;

        // Give varied, realistic operational states
        let status = 'available';
        let hkStatus = 'clean';

        if (rNum === 1) {
          status = 'occupied';
          hkStatus = 'clean';
        } else if (rNum === 2) {
          status = 'cleaning';
          hkStatus = 'dirty';
        } else if (tIdx === 2 && rNum === 5) {
          status = 'maintenance';
          hkStatus = 'clean';
        } else if (rNum === 4 && tIdx === 1) {
          status = 'occupied';
          hkStatus = 'clean';
        }

        await db.query(
          `INSERT INTO rooms (hotel_id, room_type_id, room_number, floor_number, status, housekeeping_status)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [hotelId, roomTypeId, roomNumber, floor, status, hkStatus]
        );
      }
    }

    // Customer Reviews
    await db.query(
      `INSERT INTO reviews (hotel_id, user_id, rating, title, comment, cleanliness_rating, staff_rating, service_rating, value_rating, is_verified)
       VALUES (?, 5, ?, 'Unforgettable hospitality & impeccable detail', 'From the peaceful welcome drink to the bespoke breakfast, every moment was thoughtfully curated. Will return without hesitation.', 5.0, 5.0, 4.8, 4.9, 1)`,
      [hotelId, h.star_rating]
    );
    await db.query(
      `INSERT INTO reviews (hotel_id, user_id, rating, title, comment, cleanliness_rating, staff_rating, service_rating, value_rating, is_verified)
       VALUES (?, 5, ?, 'Tranquil ambiance and supreme comfort', 'The attention to serenity, subtle fragrance, and immaculate room cleanliness made this trip truly restful.', 4.8, 4.7, 4.9, 4.6, 1)`,
      [hotelId, Math.max(4.0, h.star_rating - 0.2)]
    );
  }

  // 4. Staff Profiles for MULTIPLE HOTELS!
  console.log('👔 Setting up staff profiles across managed hotels...');
  // Hotel 1 (Primary Demo Hotel)
  const defaultStaffH1 = [
    { userId: 6, dept: 'Management', code: 'EMP-MGR-001', shift: 'Morning', salary: 65000 },
    { userId: 7, dept: 'Front Office', code: 'EMP-REC-002', shift: 'Morning', salary: 32000 },
    { userId: 8, dept: 'Housekeeping', code: 'EMP-HSK-003', shift: 'Morning', salary: 26000 },
    { userId: 9, dept: 'Maintenance', code: 'EMP-MNT-004', shift: 'Rotational', salary: 30000 },
    { userId: 10, dept: 'Front Office', code: 'EMP-RMS-005', shift: 'Evening', salary: 24000 },
    { userId: 11, dept: 'F&B', code: 'EMP-KIT-006', shift: 'Morning', salary: 45000 },
    { userId: 12, dept: 'Security', code: 'EMP-SEC-007', shift: 'Night', salary: 28000 }
  ];

  for (const sa of defaultStaffH1) {
    await db.query(
      `INSERT INTO staff_profiles (user_id, hotel_id, department, employee_code, shift, salary, date_of_joining, is_active)
       VALUES (?, 1, ?, ?, ?, ?, '2025-01-15', 1)`,
      [sa.userId, sa.dept, sa.code, sa.shift, sa.salary]
    );
  }

  // Seed staff for Hotels 2, 3, 4, 6 so switching properties shows full rosters
  const additionalStaffHotels = [2, 3, 4, 6];
  let extraUserCounter = 20;

  for (const hId of additionalStaffHotels) {
    const rolesList = [
      { name: 'Hotel Manager', role: 'manager', dept: 'Management', shift: 'Morning', salary: 62000 },
      { name: 'Lead Receptionist', role: 'receptionist', dept: 'Front Office', shift: 'Morning', salary: 31000 },
      { name: 'Housekeeping Supervisor', role: 'housekeeping', dept: 'Housekeeping', shift: 'Morning', salary: 25000 },
      { name: 'Chief Engineer', role: 'maintenance', dept: 'Maintenance', shift: 'Rotational', salary: 29000 },
      { name: 'Guest Dining Lead', role: 'room_service', dept: 'F&B', shift: 'Evening', salary: 23000 }
    ];

    for (const r of rolesList) {
      extraUserCounter++;
      const empEmail = `staff.${r.role}.${hId}@intellistay.com`;
      const empCode = `EMP-${r.role.slice(0, 3).toUpperCase()}-${String(hId).padStart(2, '0')}${extraUserCounter}`;

      const [uRes] = await db.query(
        `INSERT INTO users (full_name, email, phone, password_hash, role)
         VALUES (?, ?, '+91 98450 00000', '$2b$10$2sR9c0r4Vt3l3IJPk71MzecMAVRM7v2Xctp7WEZYX6qzNILRfS28C', ?)`,
        [`${r.name} (H${hId})`, empEmail, r.role]
      );
      const newUid = uRes.insertId;

      await db.query(
        `INSERT INTO staff_profiles (user_id, hotel_id, department, employee_code, shift, salary, date_of_joining, is_active)
         VALUES (?, ?, ?, ?, ?, ?, '2025-02-01', 1)`,
        [newUid, hId, r.dept, empCode, r.shift, r.salary]
      );
    }
  }

  // 5. Active Housekeeping and Maintenance Tasks
  console.log('🧹 Seeding sample operational tasks for staff...');
  const today = new Date().toISOString().split('T')[0];
  await db.query(
    `INSERT INTO housekeeping_tasks (hotel_id, room_id, assigned_to_user_id, task_type, priority, status, notes, scheduled_date)
     VALUES (1, 2, 8, 'checkout_clean', 'urgent', 'pending', 'Guest checked out early. Thorough sanitization requested for VIP arrival.', ?)`,
    [today]
  );
  await db.query(
    `INSERT INTO housekeeping_tasks (hotel_id, room_id, assigned_to_user_id, task_type, priority, status, notes, scheduled_date)
     VALUES (1, 3, 8, 'stayover_clean', 'medium', 'in_progress', 'Linen change, replenish organic lemongrass toiletries and bottled spring water.', ?)`,
    [today]
  );
  await db.query(
    `INSERT INTO housekeeping_tasks (hotel_id, room_id, assigned_to_user_id, task_type, priority, status, notes, scheduled_date)
     VALUES (1, 4, 8, 'deep_clean', 'low', 'completed', 'Curtain steam clean completed and balcony floor polished.', ?)`,
    [today]
  );

  await db.query(
    `INSERT INTO maintenance_tasks (hotel_id, room_id, reported_by_user_id, assigned_to_user_id, issue_category, title, description, priority, status)
     VALUES (1, 5, 7, 9, 'hvac', 'AC Thermostat Calibration', 'Thermostat sensor running 2 degrees warmer than digital display setting.', 'medium', 'in_progress')`
  );
  await db.query(
    `INSERT INTO maintenance_tasks (hotel_id, room_id, reported_by_user_id, assigned_to_user_id, issue_category, title, description, priority, status)
     VALUES (1, 8, 8, 9, 'plumbing', 'Rain Shower Pressure Check', 'Low water pressure reported on cold mix valve in Room 202.', 'high', 'reported')`
  );

  // 6. Active and Past Bookings for Customer Rohan Verma
  console.log('📅 Seeding realistic bookings for customer...');
  const [b1Res] = await db.query(
    `INSERT INTO bookings (booking_reference, user_id, hotel_id, check_in_date, check_out_date, total_guests, total_rooms, total_amount, tax_amount, discount_amount, final_amount, booking_status, payment_status, payment_method, special_requests)
     VALUES ('BK-2026-88102', 5, 1, '2026-11-20', '2026-11-23', 2, 1, 20400.00, 2448.00, 1000.00, 21848.00, 'confirmed', 'completed', 'UPI / Google Pay', 'Late check-in around 6 PM requested. Upper floor preferred.')`
  );
  await db.query('INSERT INTO booking_rooms (booking_id, room_id, room_type_id, price_per_night) VALUES (?, 1, 1, 6800.00)', [b1Res.insertId]);
  await db.query(
    `INSERT INTO payments (booking_id, transaction_reference, amount, payment_method, payment_status)
     VALUES (?, 'TXN-UPI-992182746', 21848.00, 'UPI', 'successful')`,
    [b1Res.insertId]
  );

  // Wishlists & Notifications
  await db.query('INSERT INTO wishlists (user_id, hotel_id) VALUES (5, 4)');
  await db.query('INSERT INTO wishlists (user_id, hotel_id) VALUES (5, 6)');
  await db.query('INSERT INTO wishlists (user_id, hotel_id) VALUES (5, 9)');

  await db.query(
    `INSERT INTO notifications (user_id, title, message, type)
     VALUES (5, 'Booking Confirmed!', 'Your reservation BK-2026-88102 at The Glasshouse Garden Manor is confirmed for Nov 20, 2026.', 'booking')`
  );

  console.log('✅ IntelliStay Database initialization and seeding completed successfully!');
}

if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Seeding Error:', err);
      process.exit(1);
    });
}

module.exports = { runSeed };
