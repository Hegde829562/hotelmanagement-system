# INTELLISTAY: COMPLETE USER & EVALUATION MANUAL

Welcome to **IntelliStay – Smart Hotel Booking & Complete Hotel Management System**.

This document outlines testing workflows, system features, and role-by-role credentials.

---

## 1. Quick Demo Credentials (1-Click Ready)

On the **[Sign In Page](http://localhost:5000/login.html)**, you can click any of the 1-Click Demo buttons or manually log in using the credentials below:

| Role | Email | Password | Primary Interface |
|---|---|---|---|
| **Customer** | `customer@intellistay.com` | `password123` | [Customer Dashboard](http://localhost:5000/customer-dashboard.html) |
| **Hotel Owner** | `owner@intellistay.com` | `password123` | [Owner Dashboard](http://localhost:5000/owner-dashboard.html) |
| **Hotel Manager** | `manager@intellistay.com` | `password123` | [Staff Operations](http://localhost:5000/staff-dashboard.html) |
| **Receptionist** | `receptionist@intellistay.com` | `password123` | [Front Desk View](http://localhost:5000/staff-dashboard.html) |
| **Housekeeping** | `housekeeping@intellistay.com` | `password123` | [Housekeeping Board](http://localhost:5000/staff-dashboard.html) |
| **Maintenance** | `maintenance@intellistay.com` | `password123` | [Engineering Board](http://localhost:5000/staff-dashboard.html) |
| **Platform Admin** | `admin@intellistay.com` | `admin123` | [Admin Portal](http://localhost:5000/admin-dashboard.html) |

---

## 2. Key Testing Workflows

### Scenario A: Customer Discovery & Anti-Double Booking Flow
1. Open the **[Landing Page](http://localhost:5000/index.html)**.
2. In the floating search bar, enter Destination: `Coorg`, select dates, and click **Search Stays**.
3. On the **Explore Stays** page, view the filtered results. Try sorting by "Highest Rating" or "Price: Low to High". Adjust the Max Budget slider or tick desired amenities like "High-Speed Wi-Fi" and "Spa".
4. Click **View Details** on any stay.
5. In the stay details view, adjust your check-in and check-out dates. Notice the live inventory checking.
6. Click **Reserve Room** on an available category.
7. Review the price breakdown (Nights $\times$ Room rate + 12% GST). Select a payment method and click **Complete Simulated Payment & Book**.
8. Notice the instant confirmation with unique booking reference `BK-2026-XXXXX` and assigned physical room number.
9. Try booking the exact same physical room for overlapping dates on another tab to observe the anti-double booking protection!

### Scenario B: Customer Management & Cancellation
1. Log in as Customer (`customer@intellistay.com`).
2. Navigate to **[My Dashboard](http://localhost:5000/customer-dashboard.html)**.
3. View your upcoming reservations, earned loyalty points, and saved wishlist stays.
4. Click **Cancel Stay** on an upcoming reservation to test the policy check and simulated refund.
5. Click **Write Review** on any completed stay to publish detailed sub-ratings (Cleanliness, Staff, Service, Value).

### Scenario C: Hotel Owner Multi-Property Management
1. Log in as Hotel Owner (`owner@intellistay.com`).
2. On the **[Owner Dashboard](http://localhost:5000/owner-dashboard.html)**:
   - Use the **Property Switcher** dropdown in the top bar to toggle between "The Glasshouse Garden Manor" and "Silicon Horizon Tech Suites".
   - Review the Chart.js revenue velocity curve and room status distribution doughnut chart.
   - Click the **Room Status Grid** tab to view physical room tiles (101, 102, 201). Click any room tile to alter its operational status.
   - Click **Bookings & Front Desk** to perform one-click guest Check-In or Check-Out.
   - Click **Add Property** to register a new stay with automatic room inventory generation.
   - Click **Staff & Employees** to register a new staff member and assign their shift.

### Scenario D: Housekeeping Turnover Workflow
1. When a guest is checked out at the Front Desk, notice that the room is automatically set to dirty and an urgent checkout turnover task is created in the database.
2. Log in as Housekeeping (`housekeeping@intellistay.com`).
3. On the **[Staff Dashboard](http://localhost:5000/staff-dashboard.html)**, view the **Housekeeping Board**.
4. Click **Mark Clean** on any pending task. The task will be marked completed and the room returned to `available` status in real-time.

### Scenario E: Platform Admin Approvals
1. Log in as Super Admin (`admin@intellistay.com`).
2. On the **[Admin Dashboard](http://localhost:5000/admin-dashboard.html)**, inspect platform GMV, total active stays, and pending approvals.
3. Click **Approve** or **Reject** on any property, or toggle the **Active / Deactivate** switch to control public search visibility.

---

## 3. Database & Architecture Verification

- **Pure MySQL Script**: The full SQL dump is located at `database/seed.sql` and the schema at `database/schema.sql`.
- **Automatic Fallback Resilience**: The system features a dual-mode database layer. If MySQL 8.0+ is running, it connects via `mysql2/promise`. If MySQL is offline, it seamlessly runs the exact relational schema on SQLite WebAssembly with zero downtime.

