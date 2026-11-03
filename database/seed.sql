-- =====================================================================
-- INTELLISTAY: Master Seed Data (MySQL 8.0+ Native Dump)
-- Generated automatically for standard MySQL import
-- =====================================================================

USE `intellistay_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- Master Amenities Catalog
INSERT INTO `amenities` (`name`, `code`, `icon`, `category`) VALUES
('High-Speed Wi-Fi', 'wifi', 'bi-wifi', 'Connectivity'),
('Swimming Pool', 'pool', 'bi-water', 'Wellness'),
('Spa & Wellness Sanctuary', 'spa', 'bi-flower1', 'Wellness'),
('Complimentary Gourmet Breakfast', 'breakfast', 'bi-cup-hot', 'Dining'),
('Fine Dining Restaurant', 'restaurant', 'bi-egg-fried', 'Dining'),
('Artisan Bar & Lounge', 'bar', 'bi-cup-straw', 'Dining'),
('24/7 Room Service', 'room_service', 'bi-bell', 'Services'),
('Modern Fitness Center', 'gym', 'bi-heart-pulse', 'Wellness'),
('Air Conditioning', 'ac', 'bi-snow', 'Comfort'),
('Complimentary Valet Parking', 'parking', 'bi-p-circle', 'Services'),
('Ocean / Lake View', 'view_water', 'bi-tsunami', 'Outdoor'),
('Panoramic Mountain View', 'view_mountain', 'bi-image-alt', 'Outdoor'),
('Private Balcony / Verandah', 'balcony', 'bi-door-open', 'Comfort'),
('Pet Friendly Accommodations', 'pet_friendly', 'bi-emoji-smile', 'Comfort'),
('Airport Luxury Transfer', 'airport_shuttle', 'bi-car-front', 'Services'),
('EV Charging Station', 'ev_charging', 'bi-lightning-charge', 'Services'),
('Bonfire & Stargazing Lawn', 'bonfire', 'bi-fire', 'Outdoor'),
('Yoga & Meditation Pavilion', 'yoga', 'bi-peace', 'Wellness')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Seed 10 User Roles
INSERT INTO `users` (`id`, `full_name`, `email`, `phone`, `password_hash`, `role`, `loyalty_points`, `avatar_url`) VALUES
(1, 'Ananya Deshmukh', 'admin@intellistay.com', '+91 98765 00001', '$2b$10$uMasZxMi4O0n9DiyiWch/OdZwv8TF49DPFd5KGT5LT545TG9dKoQy', 'admin', 0, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'),
(2, 'Kabir Oberoi', 'owner@intellistay.com', '+91 98765 00002', '$2b$10$2sR9c0r4Vt3l3IJPk71MzecMAVRM7v2Xctp7WEZYX6qzNILRfS28C', 'owner', 0, 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80'),
(3, 'Priya Sharma', 'priya.sharma@stays.in', '+91 98765 00003', '$2b$10$2sR9c0r4Vt3l3IJPk71MzecMAVRM7v2Xctp7WEZYX6qzNILRfS28C', 'owner', 0, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80'),
(4, 'Vikram Mehta', 'vikram.mehta@royalstays.in', '+91 98765 00004', '$2b$10$2sR9c0r4Vt3l3IJPk71MzecMAVRM7v2Xctp7WEZYX6qzNILRfS28C', 'owner', 0, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'),
(5, 'Rohan Verma', 'customer@intellistay.com', '+91 98765 00005', '$2b$10$2sR9c0r4Vt3l3IJPk71MzecMAVRM7v2Xctp7WEZYX6qzNILRfS28C', 'customer', 450, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'),
(6, 'Sunita Rao', 'manager@intellistay.com', '+91 98765 00006', '$2b$10$2sR9c0r4Vt3l3IJPk71MzecMAVRM7v2Xctp7WEZYX6qzNILRfS28C', 'manager', 0, 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=300&q=80'),
(7, 'Arjun Nair', 'receptionist@intellistay.com', '+91 98765 00007', '$2b$10$2sR9c0r4Vt3l3IJPk71MzecMAVRM7v2Xctp7WEZYX6qzNILRfS28C', 'receptionist', 0, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80'),
(8, 'Deepa Kumari', 'housekeeping@intellistay.com', '+91 98765 00008', '$2b$10$2sR9c0r4Vt3l3IJPk71MzecMAVRM7v2Xctp7WEZYX6qzNILRfS28C', 'housekeeping', 0, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80'),
(9, 'Mahesh Patil', 'maintenance@intellistay.com', '+91 98765 00009', '$2b$10$2sR9c0r4Vt3l3IJPk71MzecMAVRM7v2Xctp7WEZYX6qzNILRfS28C', 'maintenance', 0, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80'),
(10, 'Karan Singh', 'roomservice@intellistay.com', '+91 98765 00010', '$2b$10$2sR9c0r4Vt3l3IJPk71MzecMAVRM7v2Xctp7WEZYX6qzNILRfS28C', 'room_service', 0, 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80'),
(11, 'Chef Rajesh Khanna', 'kitchen@intellistay.com', '+91 98765 00011', '$2b$10$2sR9c0r4Vt3l3IJPk71MzecMAVRM7v2Xctp7WEZYX6qzNILRfS28C', 'kitchen', 0, 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=300&q=80'),
(12, 'Balwant Gurung', 'security@intellistay.com', '+91 98765 00012', '$2b$10$2sR9c0r4Vt3l3IJPk71MzecMAVRM7v2Xctp7WEZYX6qzNILRfS28C', 'security', 0, 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80')
ON DUPLICATE KEY UPDATE `email`=VALUES(`email`);

SET FOREIGN_KEY_CHECKS = 1;
