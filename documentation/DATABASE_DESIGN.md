# INTELLISTAY: DATABASE ARCHITECTURE & RELATIONAL DESIGN (DBMS SPECIFICATION)

## 1. Overview & Theoretical Foundations
The **IntelliStay** relational database schema is engineered specifically for academic DBMS rigorous standards and real-world hospitality transaction resilience. It is normalized to **Third Normal Form (3NF)** to eliminate data anomalies (insertion, deletion, update) while maintaining low-latency indexing on high-volume reservation queries.

---

## 2. Relational Schema & Entity-Relationship Design

```
+----------------------------------------------------------------------------------------------------+
|                                      INTELLISTAY RELATIONAL SCHEMA                                 |
+----------------------------------------------------------------------------------------------------+

   [ users ] (1:N) <---------------------+
       |                                 |
       | (1:N)                           | (1:N)
       v                                 v
   [ hotels ] (1:N) --------------> [ reviews ]
       |
       +---> (1:N) [ hotel_images ]
       +---> (M:N) [ hotel_amenities ] <--- [ amenities ]
       +---> (1:N) [ room_types ] (1:N) ---> [ rooms ]
       |                                        |
       +---> (1:N) [ bookings ]                 +---> (1:N) [ housekeeping_tasks ]
       |               |                        +---> (1:N) [ maintenance_tasks ]
       |               +---> (1:N) [ booking_rooms ]
       |               +---> (1:1) [ payments ]
       |               +---> (1:N) [ service_orders ]
       v
   [ staff_profiles ]
```

---

## 3. Detailed Data Dictionary (Normalized Tables)

### 1. `users` Table
Stores all user accounts across the 10 role classifications.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `full_name`: VARCHAR(120) NOT NULL
- `email`: VARCHAR(150) NOT NULL UNIQUE (Indexed)
- `phone`: VARCHAR(25) NOT NULL
- `password_hash`: VARCHAR(255) NOT NULL (Bcrypt 10 rounds)
- `role`: ENUM('customer', 'owner', 'manager', 'receptionist', 'housekeeping', 'maintenance', 'room_service', 'security', 'kitchen', 'admin')
- `loyalty_points`: INT NOT NULL DEFAULT 0
- `avatar_url`: VARCHAR(255) DEFAULT NULL
- `is_active`: TINYINT(1) NOT NULL DEFAULT 1
- `created_at`, `updated_at`: TIMESTAMP

### 2. `hotels` Table
Stores property metadata managed by verified hotel owners.
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `owner_id`: INT NOT NULL, FK to `users(id)` ON DELETE CASCADE
- `name`: VARCHAR(150) NOT NULL
- `slug`: VARCHAR(180) NOT NULL UNIQUE
- `category`: ENUM('Luxury', 'Resort', 'Boutique', 'Budget', 'Homestay', 'Business', 'Beach Stay', 'Hill Station', 'Family', 'Couple-friendly')
- `star_rating`: DECIMAL(2,1) NOT NULL DEFAULT 4.0
- `description`: TEXT NOT NULL
- `address`: VARCHAR(255) NOT NULL
- `city`: VARCHAR(80) NOT NULL (Indexed)
- `state`: VARCHAR(80) NOT NULL
- `pincode`: VARCHAR(15) NOT NULL
- `contact_phone`, `contact_email`: VARCHAR
- `check_in_time`, `check_out_time`: VARCHAR(10) (Defaults '14:00' / '11:00')
- `base_price_per_night`: DECIMAL(10,2) NOT NULL
- `is_featured`: TINYINT(1) NOT NULL DEFAULT 0
- `approval_status`: ENUM('pending', 'approved', 'rejected') DEFAULT 'approved'
- `status`: ENUM('active', 'inactive') DEFAULT 'active'
- `cancellation_policy`: VARCHAR(255)

### 3. `hotel_images` Table
Multi-image repository per hotel property.
- `id`: INT PRIMARY KEY AUTO_INCREMENT
- `hotel_id`: INT NOT NULL, FK to `hotels(id)`
- `image_url`: VARCHAR(500) NOT NULL
- `caption`: VARCHAR(150)
- `is_primary`: TINYINT(1) DEFAULT 0

### 4. `amenities` & `hotel_amenities` (M:N Relationship)
Global master catalog of hospitality amenities.
- `amenities` (`id`, `name`, `code`, `icon`, `category`)
- `hotel_amenities` (`hotel_id`, `amenity_id`, PRIMARY KEY (`hotel_id`, `amenity_id`))

### 5. `room_types` Table
Defines categories of rooms within each hotel.
- `id`: INT PRIMARY KEY AUTO_INCREMENT
- `hotel_id`: INT NOT NULL, FK to `hotels(id)`
- `name`: VARCHAR(100) (e.g. Deluxe Room, Executive Suite)
- `slug`: VARCHAR(120) NOT NULL
- `base_price`: DECIMAL(10,2) NOT NULL
- `capacity_adults`, `capacity_children`: INT
- `bed_type`: VARCHAR(50)
- `room_size_sqft`: INT
- `image_url`: VARCHAR(500)
- `total_rooms`: INT NOT NULL

### 6. `rooms` Table (Physical Inventory)
Actual individual rooms tracked for operations.
- `id`: INT PRIMARY KEY AUTO_INCREMENT
- `hotel_id`: INT NOT NULL, FK to `hotels(id)`
- `room_type_id`: INT NOT NULL, FK to `room_types(id)`
- `room_number`: VARCHAR(20) NOT NULL
- `floor_number`: INT DEFAULT 1
- `status`: ENUM('available', 'occupied', 'cleaning', 'maintenance', 'out_of_order')
- `housekeeping_status`: ENUM('clean', 'dirty', 'inspecting', 'in_progress')
- UNIQUE KEY (`hotel_id`, `room_number`)

### 7. `bookings` Table
Complete transactional reservation records.
- `id`: INT PRIMARY KEY AUTO_INCREMENT
- `booking_reference`: VARCHAR(30) NOT NULL UNIQUE (Format `BK-YYYY-XXXXX`)
- `user_id`: INT NOT NULL, FK to `users(id)`
- `hotel_id`: INT NOT NULL, FK to `hotels(id)`
- `check_in_date`: DATE NOT NULL
- `check_out_date`: DATE NOT NULL
- `total_guests`: INT NOT NULL
- `total_amount`, `tax_amount`, `discount_amount`, `final_amount`: DECIMAL(10,2)
- `booking_status`: ENUM('confirmed', 'checked_in', 'checked_out', 'cancelled')
- `payment_status`: ENUM('pending', 'completed', 'refunded')
- `payment_method`: VARCHAR(50)
- `special_requests`: TEXT
- `cancellation_reason`: VARCHAR(255)

### 8. `booking_rooms` Table
Mapping between a reservation and physical room allocations.
- `id`: INT PRIMARY KEY AUTO_INCREMENT
- `booking_id`: INT NOT NULL, FK to `bookings(id)`
- `room_id`: INT NOT NULL, FK to `rooms(id)`
- `room_type_id`: INT NOT NULL, FK to `room_types(id)`
- `price_per_night`: DECIMAL(10,2) NOT NULL

### 9. `payments` Table
Records simulated payment gateway transactions.
- `id`: INT PRIMARY KEY AUTO_INCREMENT
- `booking_id`: INT NOT NULL, FK to `bookings(id)`
- `transaction_reference`: VARCHAR(60) NOT NULL UNIQUE
- `amount`: DECIMAL(10,2) NOT NULL
- `payment_method`: VARCHAR(50)
- `payment_status`: ENUM('initiated', 'successful', 'failed', 'refunded')
- `paid_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### 10. `staff_profiles` Table
Associates employees to hotel properties and departments.
- `id`: INT PRIMARY KEY AUTO_INCREMENT
- `user_id`: INT NOT NULL, FK to `users(id)`
- `hotel_id`: INT NOT NULL, FK to `hotels(id)`
- `department`: ENUM('Management', 'Front Office', 'Housekeeping', 'Maintenance', 'F&B', 'Security')
- `employee_code`: VARCHAR(30) UNIQUE
- `shift`: ENUM('Morning', 'Evening', 'Night', 'Rotational')
- `salary`: DECIMAL(10,2)
- `date_of_joining`: DATE

### 11. `housekeeping_tasks` Table
Operational turnover board for cleaning staff.
- `id`: INT PRIMARY KEY AUTO_INCREMENT
- `hotel_id`: INT NOT NULL, FK to `hotels(id)`
- `room_id`: INT NOT NULL, FK to `rooms(id)`
- `assigned_to_user_id`: INT, FK to `users(id)`
- `task_type`: ENUM('checkout_clean', 'stayover_clean', 'deep_clean', 'inspection')
- `priority`: ENUM('low', 'medium', 'high', 'urgent')
- `status`: ENUM('pending', 'in_progress', 'completed')
- `scheduled_date`: DATE

### 12. `maintenance_tasks` Table
Facility issues and repair tickets.
- `id`: INT PRIMARY KEY AUTO_INCREMENT
- `hotel_id`: INT NOT NULL, FK to `hotels(id)`
- `room_id`: INT, FK to `rooms(id)`
- `reported_by_user_id`: INT, FK to `users(id)`
- `assigned_to_user_id`: INT, FK to `users(id)`
- `issue_category`: ENUM('plumbing', 'electrical', 'hvac', 'furniture', 'appliance', 'structural', 'other')
- `title`: VARCHAR(150)
- `description`: TEXT
- `priority`: ENUM('low', 'medium', 'high', 'emergency')
- `status`: ENUM('reported', 'in_progress', 'resolved', 'closed')
- `resolution_notes`: TEXT

---

## 4. Anti-Double Booking Concurrency & Overlap Formula

### Mathematical Overlap Proof
Two date intervals $[S_1, E_1)$ and $[S_2, E_2)$ overlap if and only if:
$$\text{Existing Check-In} < \text{Requested Check-Out} \quad \text{AND} \quad \text{Existing Check-Out} > \text{Requested Check-In}$$

### Transactional SQL Implementation
```sql
START TRANSACTION;

SELECT r.id, r.room_number
FROM rooms r
WHERE r.hotel_id = ? 
  AND r.room_type_id = ?
  AND r.status != 'out_of_order'
  AND r.id NOT IN (
    SELECT br.room_id
    FROM booking_rooms br
    JOIN bookings b ON br.booking_id = b.id
    WHERE b.booking_status IN ('confirmed', 'checked_in')
      AND b.check_in_date < ?   -- requested check_out
      AND b.check_out_date > ?  -- requested check_in
  )
LIMIT 1
FOR UPDATE;

-- Insert booking records, link room, award loyalty points
COMMIT;
```

---

## 5. Database Views & Triggers

### View: `view_hotel_summary`
Precomputes real-time average ratings, review count, and minimum room rates.

### View: `view_owner_occupancy`
Aggregates room status counts (Available, Occupied, Cleaning, Maintenance) per hotel.

### Trigger: `trg_after_booking_insert`
Automatically increments customer loyalty points by 1 point per ₹100 spent upon confirmed booking.

### Trigger: `trg_after_room_checkout`
Automatically creates an urgent checkout cleaning task in `housekeeping_tasks` when a room is marked dirty.

