# INTELLISTAY: RESTFUL API DOCUMENTATION

Base URL: `http://localhost:5000/api`

---

## 1. Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register/customer` | Public | Register a new customer account (+100 welcome loyalty points) |
| POST | `/auth/register/owner` | Public | Register a new hotel owner account |
| POST | `/auth/login` | Public | Universal login (Customer, Owner, Staff, Admin). Returns JWT. |
| GET | `/auth/me` | Authenticated | Get current authenticated user details and role profile |
| PUT | `/auth/profile` | Authenticated | Update full name, phone number, and avatar |
| PUT | `/auth/change-password` | Authenticated | Verify current password and update to new password |
| POST | `/auth/logout` | Authenticated | Clear session authentication cookies |

---

## 2. Hotels & Discovery Endpoints (`/api/hotels`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/hotels` | Public | Search hotels with filters: destination, checkIn, checkOut, guests, minPrice, maxPrice, categories, minRating, amenities, sort, page, limit |
| GET | `/hotels/curations/landing` | Public | Top-rated, budget-friendly, and featured destinations |
| GET | `/hotels/amenities/all` | Public | Master list of all hospitality amenities with icons |
| GET | `/hotels/compare` | Public | Side-by-side comparison for up to 3 hotel IDs |
| GET | `/hotels/:idOrSlug` | Public | Detailed hotel stay info (gallery, amenities, rooms, reviews) |
| GET | `/hotels/owner/my-hotels` | Owner | Get all hotel properties owned by current user |
| POST | `/hotels/owner/create` | Owner | Register new hotel property and generate default rooms |
| PUT | `/hotels/owner/:hotelId` | Owner | Update hotel property metadata and policies |
| GET | `/hotels/admin/all` | Admin | Master list of all hotels with approval filter |
| PATCH | `/hotels/admin/:hotelId/approval` | Admin | Set hotel approval status (`approved` or `rejected`) |
| PATCH | `/hotels/admin/:hotelId/status` | Admin | Toggle hotel status between `active` and `inactive` |

---

## 3. Room Inventory Endpoints (`/api/rooms`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/rooms/hotel/:hotelId` | Public | Get room categories and physical rooms for a hotel |
| POST | `/rooms/hotel/:hotelId/type` | Owner / Manager | Create a new room type category |
| POST | `/rooms/hotel/:hotelId/room` | Owner / Manager | Add physical room with room number & floor |
| PATCH | `/rooms/room/:roomId/status` | Staff / Owner | Update room operational & housekeeping status |

---

## 4. Reservations & Booking Endpoints (`/api/bookings`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/bookings/check-availability` | Public | Live date overlap check for rooms at a hotel |
| POST | `/bookings/create` | Customer | Concurrency-safe transactional booking creation with `FOR UPDATE` |
| GET | `/bookings/my-bookings` | Customer | Get customer's upcoming, past, and cancelled stays |
| PATCH | `/bookings/:bookingId/cancel` | Customer | Cancel stay and trigger simulated refund |
| GET | `/bookings/hotel/:hotelId` | Owner / Staff | Get all reservations for a specific hotel |
| PATCH | `/bookings/:bookingId/check-in` | Front Desk | Check in guest and mark room occupied |
| PATCH | `/bookings/:bookingId/check-out` | Front Desk | Check out guest, mark room dirty, and trigger turnover cleaning |

---

## 5. Staff & Operations Endpoints (`/api/staff`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/staff/hotel/:hotelId` | Owner / Manager | View hotel staff roster |
| POST | `/staff/hotel/:hotelId/add` | Owner / Manager | Create staff employee account |
| GET | `/staff/hotel/:hotelId/front-desk` | Front Desk | Arrivals, departures, and in-house guests |
| GET | `/staff/hotel/:hotelId/housekeeping`| Housekeeping | Cleaning task queue |
| PATCH | `/staff/housekeeping/:taskId` | Housekeeping | Mark cleaning task completed / clean room |
| GET | `/staff/hotel/:hotelId/maintenance` | Maintenance | Active repair tickets |
| POST | `/staff/hotel/:hotelId/maintenance` | Staff | Log new maintenance issue |
| PATCH | `/staff/maintenance/:taskId` | Maintenance | Resolve repair ticket with notes |
| GET | `/staff/hotel/:hotelId/service-orders`| F&B / Room Service| Active food and amenity orders |
| PATCH | `/staff/service-orders/:orderId` | F&B / Room Service| Update order status (`ordered`, `preparing`, `delivered`)|

---

## 6. Recommendations & Reviews Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/recommendations` | Public | Curated rule-based recommendations with natural explanations |
| GET | `/reviews/hotel/:hotelId` | Public | Verified guest reviews and sub-ratings |
| POST | `/reviews/add` | Customer | Submit verified guest review |
| GET | `/wishlist` | Customer | Get saved favorite stays |
| POST | `/wishlist/toggle` | Customer | Save or unsave stay from wishlist |
| GET | `/analytics/owner` | Owner | Occupancy, arrivals, departures, revenue trend |
| GET | `/analytics/admin` | Admin | Platform GMV, total hotels, active users |

