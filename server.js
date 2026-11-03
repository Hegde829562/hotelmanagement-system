// =====================================================================
// INTELLISTAY: Smart Hotel Booking & Complete Hotel Management System
// Main Express Server Entry Point
// =====================================================================

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const db = require('./database/db');
const { runSeed } = require('./database/seedRunner');
const config = require('./backend/config/config');

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static assets from frontend
app.use(express.static(path.join(__dirname, 'frontend/public')));
app.use('/css', express.static(path.join(__dirname, 'frontend/css')));
app.use('/js', express.static(path.join(__dirname, 'frontend/js')));
app.use('/uploads', express.static(path.join(__dirname, 'frontend/public/uploads')));

// Mount API Routes
app.use('/api/auth', require('./backend/routes/authRoutes'));
app.use('/api/hotels', require('./backend/routes/hotelRoutes'));
app.use('/api/rooms', require('./backend/routes/roomRoutes'));
app.use('/api/bookings', require('./backend/routes/bookingRoutes'));
app.use('/api/staff', require('./backend/routes/staffRoutes'));
app.use('/api/reviews', require('./backend/routes/reviewRoutes'));
app.use('/api/wishlist', require('./backend/routes/wishlistRoutes'));
app.use('/api/analytics', require('./backend/routes/analyticsRoutes'));
app.use('/api/recommendations', require('./backend/routes/recommendationRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    platform: 'IntelliStay Hospitality Suite',
    timestamp: new Date().toISOString(),
    isFallbackDb: db.isFallback()
  });
});

// Fallback route: serve index.html for customer landing or direct HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/public/index.html'));
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
const PORT = config.port;
async function startServer() {
  try {
    console.log('🔄 Initializing database connection...');
    await db.initDb();

    // Check if hotels table exists and has records; if not, run seed automatically
    try {
      const [rows] = await db.query('SELECT count(*) as count FROM hotels');
      if (!rows || rows[0].count === 0) {
        console.log('🌱 No hotel listings detected. Running automated database seed...');
        await runSeed();
      } else {
        console.log(`🏨 Verified ${rows[0].count} stays loaded in database.`);
      }
    } catch (e) {
      console.log('🌱 Running initial migration & seeding...');
      await runSeed();
    }

    const server = app.listen(PORT, () => {
      console.log('================================================================');
      console.log(`🌟 IntelliStay Server running on: http://localhost:${PORT}`);
      console.log(`🛎️  Customer Portal:       http://localhost:${PORT}/index.html`);
      console.log(`🏨 Hotel Discovery:       http://localhost:${PORT}/hotels.html`);
      console.log(`👑 Hotel Owner Dashboard: http://localhost:${PORT}/owner-dashboard.html`);
      console.log(`👔 Staff Operations:      http://localhost:${PORT}/staff-dashboard.html`);
      console.log(`⚙️  Admin Portal:          http://localhost:${PORT}/admin-dashboard.html`);
      console.log('================================================================');
    });

    return server;
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;

