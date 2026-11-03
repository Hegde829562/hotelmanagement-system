-- =====================================================================
-- INTELLISTAY: SMART HOTEL BOOKING & COMPLETE HOTEL MANAGEMENT SYSTEM
-- Relational Database Schema (MySQL 8.0+)
-- Designed in Third Normal Form (3NF) with Triggers, Views & Procedures
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `intellistay_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `intellistay_db`;

-- Drop existing tables if re-initializing
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `wishlists`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `service_orders`;
DROP TABLE IF EXISTS `maintenance_tasks`;
DROP TABLE IF EXISTS `housekeeping_tasks`;
DROP TABLE IF EXISTS `staff_profiles`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `booking_rooms`;
DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `rooms`;
DROP TABLE IF EXISTS `room_types`;
DROP TABLE IF EXISTS `hotel_amenities`;
DROP TABLE IF EXISTS `amenities`;
DROP TABLE IF EXISTS `hotel_images`;
DROP TABLE IF EXISTS `hotels`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. USERS TABLE
-- Roles: customer, owner, manager, receptionist, housekeeping,
--        maintenance, room_service, security, kitchen, admin
-- ---------------------------------------------------------------------
CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `full_name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `phone` VARCHAR(25) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('customer', 'owner', 'manager', 'receptionist', 'housekeeping', 'maintenance', 'room_service', 'security', 'kitchen', 'admin') NOT NULL DEFAULT 'customer',
    `loyalty_points` INT NOT NULL DEFAULT 0,
    `avatar_url` VARCHAR(255) DEFAULT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. HOTELS TABLE
-- Managed by hotel owners, approved by platform admin
-- ---------------------------------------------------------------------
CREATE TABLE `hotels` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `owner_id` INT NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(180) NOT NULL UNIQUE,
    `category` ENUM('Luxury', 'Resort', 'Boutique', 'Budget', 'Homestay', 'Business', 'Beach Stay', 'Hill Station', 'Family', 'Couple-friendly') NOT NULL DEFAULT 'Boutique',
    `star_rating` DECIMAL(2,1) NOT NULL DEFAULT 4.0,
    `description` TEXT NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `city` VARCHAR(80) NOT NULL,
    `state` VARCHAR(80) NOT NULL,
    `pincode` VARCHAR(15) NOT NULL,
    `latitude` DECIMAL(10, 7) DEFAULT NULL,
    `longitude` DECIMAL(10, 7) DEFAULT NULL,
    `contact_phone` VARCHAR(25) NOT NULL,
    `contact_email` VARCHAR(120) NOT NULL,
    `check_in_time` VARCHAR(10) NOT NULL DEFAULT '14:00',
    `check_out_time` VARCHAR(10) NOT NULL DEFAULT '11:00',
    `base_price_per_night` DECIMAL(10, 2) NOT NULL DEFAULT 2500.00,
    `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
    `approval_status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `cancellation_policy` VARCHAR(255) DEFAULT 'Free cancellation up to 48 hours before check-in',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_hotels_city` (`city`),
    INDEX `idx_hotels_category` (`category`),
    INDEX `idx_hotels_approval_status` (`approval_status`, `status`),
    INDEX `idx_hotels_owner` (`owner_id`)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. HOTEL IMAGES TABLE
-- Multiple high-resolution images per property
-- ---------------------------------------------------------------------
CREATE TABLE `hotel_images` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `hotel_id` INT NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `caption` VARCHAR(150) DEFAULT NULL,
    `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE,
    INDEX `idx_hotel_images_hotel` (`hotel_id`)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. AMENITIES TABLE
-- Global master catalog of hospitality amenities
-- ---------------------------------------------------------------------
CREATE TABLE `amenities` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(80) NOT NULL UNIQUE,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `icon` VARCHAR(50) NOT NULL,
    `category` ENUM('Comfort', 'Dining', 'Wellness', 'Connectivity', 'Services', 'Outdoor') NOT NULL DEFAULT 'Comfort'
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. HOTEL AMENITIES (M:N Mapping)
-- ---------------------------------------------------------------------
CREATE TABLE `hotel_amenities` (
    `hotel_id` INT NOT NULL,
    `amenity_id` INT NOT NULL,
    PRIMARY KEY (`hotel_id`, `amenity_id`),
    FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`amenity_id`) REFERENCES `amenities`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. ROOM TYPES TABLE
-- Catalog of room categories within each hotel
-- ---------------------------------------------------------------------
CREATE TABLE `room_types` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `hotel_id` INT NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `description` TEXT,
    `base_price` DECIMAL(10,2) NOT NULL,
    `capacity_adults` INT NOT NULL DEFAULT 2,
    `capacity_children` INT NOT NULL DEFAULT 1,
    `bed_type` VARCHAR(50) NOT NULL DEFAULT 'King Bed',
    `room_size_sqft` INT NOT NULL DEFAULT 350,
    `amenities_json` JSON DEFAULT NULL,
    `image_url` VARCHAR(500) DEFAULT NULL,
    `total_rooms` INT NOT NULL DEFAULT 5,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE,
    INDEX `idx_room_types_hotel` (`hotel_id`)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. PHYSICAL ROOMS TABLE
-- Actual individual rooms with status tracking
-- ---------------------------------------------------------------------
CREATE TABLE `rooms` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `hotel_id` INT NOT NULL,
    `room_type_id` INT NOT NULL,
    `room_number` VARCHAR(20) NOT NULL,
    `floor_number` INT NOT NULL DEFAULT 1,
    `status` ENUM('available', 'occupied', 'cleaning', 'maintenance', 'out_of_order') NOT NULL DEFAULT 'available',
    `housekeeping_status` ENUM('clean', 'dirty', 'inspecting', 'in_progress') NOT NULL DEFAULT 'clean',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_hotel_room_number` (`hotel_id`, `room_number`),
    FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`room_type_id`) REFERENCES `room_types`(`id`) ON DELETE CASCADE,
    INDEX `idx_rooms_hotel_status` (`hotel_id`, `status`),
    INDEX `idx_rooms_housekeeping` (`housekeeping_status`)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 8. BOOKINGS TABLE
-- Complete reservation management with audit trail
-- ---------------------------------------------------------------------
CREATE TABLE `bookings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `booking_reference` VARCHAR(30) NOT NULL UNIQUE,
    `user_id` INT NOT NULL,
    `hotel_id` INT NOT NULL,
    `check_in_date` DATE NOT NULL,
    `check_out_date` DATE NOT NULL,
    `total_guests` INT NOT NULL DEFAULT 2,
    `total_rooms` INT NOT NULL DEFAULT 1,
    `total_amount` DECIMAL(10,2) NOT NULL,
    `tax_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `discount_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `final_amount` DECIMAL(10,2) NOT NULL,
    `booking_status` ENUM('confirmed', 'checked_in', 'checked_out', 'cancelled') NOT NULL DEFAULT 'confirmed',
    `payment_status` ENUM('pending', 'completed', 'refunded') NOT NULL DEFAULT 'completed',
    `payment_method` VARCHAR(50) NOT NULL DEFAULT 'Credit Card',
    `special_requests` TEXT DEFAULT NULL,
    `cancellation_reason` VARCHAR(255) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE,
    INDEX `idx_bookings_dates` (`check_in_date`, `check_out_date`),
    INDEX `idx_bookings_hotel` (`hotel_id`),
    INDEX `idx_bookings_user` (`user_id`),
    INDEX `idx_bookings_status` (`booking_status`)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 9. BOOKING ROOMS MAPPING TABLE
-- Relates a booking to physical rooms
-- ---------------------------------------------------------------------
CREATE TABLE `booking_rooms` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `booking_id` INT NOT NULL,
    `room_id` INT NOT NULL,
    `room_type_id` INT NOT NULL,
    `price_per_night` DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`room_type_id`) REFERENCES `room_types`(`id`) ON DELETE CASCADE,
    INDEX `idx_booking_rooms_booking` (`booking_id`),
    INDEX `idx_booking_rooms_room` (`room_id`)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 10. PAYMENTS TABLE
-- Simulated transactional gateway records
-- ---------------------------------------------------------------------
CREATE TABLE `payments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `booking_id` INT NOT NULL,
    `transaction_reference` VARCHAR(60) NOT NULL UNIQUE,
    `amount` DECIMAL(10,2) NOT NULL,
    `payment_method` VARCHAR(50) NOT NULL,
    `payment_status` ENUM('initiated', 'successful', 'failed', 'refunded') NOT NULL DEFAULT 'successful',
    `payment_gateway_response` JSON DEFAULT NULL,
    `paid_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE,
    INDEX `idx_payments_booking` (`booking_id`)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 11. STAFF PROFILES TABLE
-- Associates staff users with specific hotels and departments
-- ---------------------------------------------------------------------
CREATE TABLE `staff_profiles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `hotel_id` INT NOT NULL,
    `department` ENUM('Management', 'Front Office', 'Housekeeping', 'Maintenance', 'F&B', 'Security') NOT NULL,
    `employee_code` VARCHAR(30) NOT NULL UNIQUE,
    `shift` ENUM('Morning', 'Evening', 'Night', 'Rotational') NOT NULL DEFAULT 'Morning',
    `salary` DECIMAL(10,2) DEFAULT 25000.00,
    `date_of_joining` DATE NOT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE,
    INDEX `idx_staff_hotel` (`hotel_id`),
    INDEX `idx_staff_department` (`department`)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 12. HOUSEKEEPING TASKS TABLE
-- Operational task board for cleaning crew
-- ---------------------------------------------------------------------
CREATE TABLE `housekeeping_tasks` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `hotel_id` INT NOT NULL,
    `room_id` INT NOT NULL,
    `assigned_to_user_id` INT DEFAULT NULL,
    `task_type` ENUM('checkout_clean', 'stayover_clean', 'deep_clean', 'inspection') NOT NULL DEFAULT 'checkout_clean',
    `priority` ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
    `status` ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
    `notes` TEXT DEFAULT NULL,
    `scheduled_date` DATE NOT NULL,
    `completed_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`assigned_to_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_housekeeping_hotel_status` (`hotel_id`, `status`),
    INDEX `idx_housekeeping_assignee` (`assigned_to_user_id`)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 13. MAINTENANCE TASKS TABLE
-- Facility engineering and repairs
-- ---------------------------------------------------------------------
CREATE TABLE `maintenance_tasks` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `hotel_id` INT NOT NULL,
    `room_id` INT DEFAULT NULL,
    `reported_by_user_id` INT NOT NULL,
    `assigned_to_user_id` INT DEFAULT NULL,
    `issue_category` ENUM('plumbing', 'electrical', 'hvac', 'furniture', 'appliance', 'structural', 'other') NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` TEXT NOT NULL,
    `priority` ENUM('low', 'medium', 'high', 'emergency') NOT NULL DEFAULT 'medium',
    `status` ENUM('reported', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'reported',
    `resolution_notes` TEXT DEFAULT NULL,
    `reported_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `resolved_at` TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`reported_by_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`assigned_to_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_maintenance_hotel_status` (`hotel_id`, `status`)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 14. SERVICE ORDERS TABLE
-- Room service, dining orders, amenities delivery
-- ---------------------------------------------------------------------
CREATE TABLE `service_orders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `hotel_id` INT NOT NULL,
    `booking_id` INT NOT NULL,
    `room_id` INT NOT NULL,
    `order_type` ENUM('room_service', 'laundry', 'extra_amenities', 'luggage_assistance') NOT NULL,
    `items_description` TEXT NOT NULL,
    `total_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `status` ENUM('ordered', 'preparing', 'delivered', 'cancelled') NOT NULL DEFAULT 'ordered',
    `assigned_to_user_id` INT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`assigned_to_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_service_orders_hotel` (`hotel_id`)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 15. REVIEWS TABLE
-- Verified guest feedback and ratings
-- ---------------------------------------------------------------------
CREATE TABLE `reviews` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `hotel_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `booking_id` INT DEFAULT NULL,
    `rating` DECIMAL(2,1) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `comment` TEXT NOT NULL,
    `cleanliness_rating` DECIMAL(2,1) NOT NULL DEFAULT 5.0,
    `staff_rating` DECIMAL(2,1) NOT NULL DEFAULT 5.0,
    `service_rating` DECIMAL(2,1) NOT NULL DEFAULT 5.0,
    `value_rating` DECIMAL(2,1) NOT NULL DEFAULT 5.0,
    `is_verified` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE SET NULL,
    INDEX `idx_reviews_hotel` (`hotel_id`)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 16. WISHLISTS TABLE
-- Saved favorite properties for customers
-- ---------------------------------------------------------------------
CREATE TABLE `wishlists` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `hotel_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_user_hotel_wishlist` (`user_id`, `hotel_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 17. NOTIFICATIONS TABLE
-- Real-time alerts for customers, owners, and staff
-- ---------------------------------------------------------------------
CREATE TABLE `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `message` TEXT NOT NULL,
    `type` ENUM('booking', 'housekeeping', 'maintenance', 'system', 'promo') NOT NULL DEFAULT 'system',
    `is_read` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_notifications_user` (`user_id`, `is_read`)
) ENGINE=InnoDB;

-- =====================================================================
-- DATABASE VIEWS
-- =====================================================================

-- View 1: Summary of all hotels with computed rating and min price
CREATE OR REPLACE VIEW `view_hotel_summary` AS
SELECT 
    h.id,
    h.name,
    h.slug,
    h.category,
    h.address,
    h.city,
    h.state,
    h.approval_status,
    h.status,
    h.is_featured,
    h.cancellation_policy,
    COALESCE(AVG(r.rating), h.star_rating) AS average_rating,
    COUNT(DISTINCT r.id) AS review_count,
    COALESCE(MIN(rt.base_price), h.base_price_per_night) AS min_price,
    (SELECT image_url FROM hotel_images WHERE hotel_id = h.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS primary_image
FROM hotels h
LEFT JOIN reviews r ON h.id = r.hotel_id
LEFT JOIN room_types rt ON h.id = rt.hotel_id
GROUP BY h.id;

-- View 2: Hotel Owner Operational Occupancy View
CREATE OR REPLACE VIEW `view_owner_occupancy` AS
SELECT 
    h.id AS hotel_id,
    h.name AS hotel_name,
    COUNT(r.id) AS total_physical_rooms,
    SUM(CASE WHEN r.status = 'available' THEN 1 ELSE 0 END) AS available_rooms,
    SUM(CASE WHEN r.status = 'occupied' THEN 1 ELSE 0 END) AS occupied_rooms,
    SUM(CASE WHEN r.status = 'cleaning' OR r.housekeeping_status = 'dirty' THEN 1 ELSE 0 END) AS dirty_rooms,
    SUM(CASE WHEN r.status = 'maintenance' THEN 1 ELSE 0 END) AS maintenance_rooms
FROM hotels h
LEFT JOIN rooms r ON h.id = r.hotel_id
GROUP BY h.id, h.name;

-- =====================================================================
-- TRIGGERS
-- =====================================================================

DELIMITER $$

-- Trigger 1: Award 10 loyalty points for every 1000 spent on completed booking
CREATE TRIGGER `trg_after_booking_insert`
AFTER INSERT ON `bookings`
FOR EACH ROW
BEGIN
    IF NEW.booking_status = 'confirmed' AND NEW.payment_status = 'completed' THEN
        UPDATE `users`
        SET `loyalty_points` = `loyalty_points` + FLOOR(NEW.final_amount / 100)
        WHERE `id` = NEW.user_id;
    END IF;
END$$

-- Trigger 2: Auto-create housekeeping task when room is set to cleaning/dirty
CREATE TRIGGER `trg_after_room_checkout`
AFTER UPDATE ON `rooms`
FOR EACH ROW
BEGIN
    IF NEW.housekeeping_status = 'dirty' AND OLD.housekeeping_status != 'dirty' THEN
        INSERT INTO `housekeeping_tasks` (`hotel_id`, `room_id`, `task_type`, `priority`, `status`, `notes`, `scheduled_date`)
        VALUES (NEW.hotel_id, NEW.id, 'checkout_clean', 'urgent', 'pending', 'Automatic checkout cleaning generated by system', CURDATE());
    END IF;
END$$

DELIMITER ;

