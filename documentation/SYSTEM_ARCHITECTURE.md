# INTELLISTAY: SYSTEM ARCHITECTURE & TECHNICAL SPECIFICATION

## 1. Executive Architecture Summary

**IntelliStay** is a production-grade, database-driven web application built following the classical **Model-View-Controller (MVC)** architectural pattern. It delivers an editorial, human-centered hospitality experience on the frontend and an ACID-compliant transaction pipeline on the backend.

```
+-----------------------------------------------------------------------------+
|                             INTELLISTAY TIERS                               |
+-----------------------------------------------------------------------------+

  [ PRESENTATION LAYER (FRONTEND) ]
  • HTML5, CSS3 Custom Design System (Warm Ivory, Forest Green, Gold)
  • Bootstrap 5.3 Responsive Grid & Modals + Bootstrap Icons
  • Vanilla JavaScript Modules (api.js, auth.js, hotels.js, dashboards.js)
  • Chart.js 4.4 Data Visualizations

                          | HTTP / RESTful JSON / JWT
                          v

  [ APPLICATION LAYER (BACKEND) ]
  • Node.js & Express.js
  • Middleware: auth.js (RBAC & property ownership), multer (file uploads)
  • Controllers: auth, hotels, rooms, bookings, staff, reviews, analytics
  • Date-Overlap Validation & Concurrency Engine

                          | mysql2 Connection Pool / sql.js Fallback
                          v

  [ DATA TIER (DATABASE) ]
  • MySQL 8.0+ Relational Database (3NF Normalized)
  • 17 Core Tables, Foreign Keys with CASCADE, Unique Constraints
  • Views: view_hotel_summary, view_owner_occupancy
  • Triggers: trg_after_booking_insert, trg_after_room_checkout
```

---

## 2. Directory Layout

```
hotelmanahementsystem/
│
├── database/
│   ├── schema.sql           -- DDL: 17 normalized tables, views, triggers
│   ├── seed.sql             -- Pure MySQL 8.0+ native SQL dump
│   ├── seedData.js          -- Master datasets (52+ hotels across 20 cities)
│   ├── seedRunner.js        -- Migration runner
│   ├── db.js                -- Dual-mode database abstraction (MySQL2 / SQLite)
│   └── intellistay.sqlite   -- Embedded relational backup instance
│
├── backend/
│   ├── config/
│   │   └── config.js        -- Configuration constants & roles
│   ├── middleware/
│   │   ├── auth.js          -- JWT authentication & RBAC authorization
│   │   └── upload.js        -- Multer image upload handling
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── hotelController.js
│   │   ├── roomController.js
│   │   ├── bookingController.js
│   │   ├── staffController.js
│   │   ├── reviewController.js
│   │   ├── wishlistController.js
│   │   ├── analyticsController.js
│   │   └── recommendationController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── hotelRoutes.js
│   │   ├── roomRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── staffRoutes.js
│   │   ├── reviewRoutes.js
│   │   ├── wishlistRoutes.js
│   │   ├── analyticsRoutes.js
│   │   └── recommendationRoutes.js
│   └── utils/
│       └── helpers.js       -- Formatting, references, date math
│
├── frontend/
│   ├── public/
│   │   ├── index.html               -- Customer landing page
│   │   ├── hotels.html              -- Discovery, search, and filters
│   │   ├── hotel-detail.html        -- Details, gallery, live booking
│   │   ├── compare.html             -- 3-way hotel comparison
│   │   ├── recommendations.html     -- Rule-based recommendations
│   │   ├── customer-dashboard.html  -- Customer bookings & wishlist
│   │   ├── owner-dashboard.html     -- Owner multi-property dashboard
│   │   ├── staff-dashboard.html     -- Front Desk, HK, Maintenance, F&B
│   │   ├── admin-dashboard.html     -- Super admin control panel
│   │   ├── login.html               -- Universal login with 1-click demo
│   │   └── register.html            -- Customer & Owner signup
│   ├── css/
│   │   ├── main.css                 -- Warm hospitality design system
│   │   └── dashboard.css            -- Clean dashboards & room status grid
│   └── js/
│       ├── api.js                   -- Centralized fetch client & toast helper
│       ├── auth.js                  -- Auth state & dynamic navbar
│       ├── main.js                  -- Landing page curations
│       ├── hotels.js                -- Search, filtering, and pagination
│       ├── hotel-detail.js          -- Detail view & booking submission
│       ├── compare.js               -- Side-by-side comparison logic
│       ├── customer-dashboard.js    -- Customer bookings & review actions
│       ├── owner-dashboard.js       -- Owner analytics & room status grid
│       ├── staff-dashboard.js       -- Staff task operations
│       └── admin-dashboard.js       -- Admin approvals & metrics
│
├── documentation/
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── DATABASE_DESIGN.md
│   ├── API_DOCUMENTATION.md
│   └── USER_GUIDE.md
│
├── server.js                        -- Express entry point
├── package.json
└── .env
```

---

## 3. Security Architecture
1. **Password Encryption**: Bcrypt hashing with 10 salt rounds. Plaintext passwords are never stored or logged.
2. **Stateless JWT Sessions**: JSON Web Tokens with 7-day expiration verifying user identity, email, and system role.
3. **Role-Based Access Control (RBAC)**: Specific route protection guaranteeing that customers cannot access owner/staff dashboards, and staff members cannot access owner analytics.
4. **Property Ownership Enforcement**: Middleware verifies that an owner can only view, update, or assign staff to properties registered under their own `owner_id`.

