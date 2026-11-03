// =====================================================================
// INTELLISTAY: Customer Dashboard Controller
// =====================================================================

document.addEventListener('DOMContentLoaded', async () => {
  const user = api.getUser();
  if (!user || user.role !== 'customer') {
    window.location.href = '/login.html?returnUrl=/customer-dashboard.html';
    return;
  }

  renderUserProfileHeader(user);
  await loadCustomerBookings();
  await loadCustomerWishlist();
  initTabNavigation();
});

function renderUserProfileHeader(user) {
  document.getElementById('cust-header-name').innerText = user.full_name;
  document.getElementById('cust-header-email').innerText = user.email;
  document.getElementById('cust-header-points').innerText = `${user.loyalty_points || 0} Points`;

  // Profile Form Pre-fill
  document.getElementById('prof-name').value = user.full_name || '';
  document.getElementById('prof-email').value = user.email || '';
  document.getElementById('prof-phone').value = user.phone || '';
}

function initTabNavigation() {
  const urlParams = new URLSearchParams(window.location.search);
  const tab = urlParams.get('tab');
  if (tab === 'wishlist') {
    const triggerEl = document.querySelector('#cust-tabs button[data-bs-target="#tab-wishlist"]');
    if (triggerEl) bootstrap.Tab.getOrCreateInstance(triggerEl).show();
  }
}

async function loadCustomerBookings() {
  const upcomingWrap = document.getElementById('upcoming-bookings-container');
  const pastWrap = document.getElementById('past-bookings-container');
  const cancelledWrap = document.getElementById('cancelled-bookings-container');

  try {
    const res = await api.get('/bookings/my-bookings');
    if (!res.success) return;

    // Upcoming
    if (res.upcoming.length === 0) {
      upcomingWrap.innerHTML = `
        <div class="p-4 text-center bg-white rounded-4 border text-muted">
          <i class="bi bi-calendar2-x fs-2 d-block mb-2 text-olive"></i>
          No upcoming reservations. Ready to plan your next peaceful escape?
          <div class="mt-3"><a href="/hotels.html" class="btn btn-forest btn-sm px-3">Find A Stay</a></div>
        </div>
      `;
    } else {
      upcomingWrap.innerHTML = res.upcoming.map(b => renderBookingCard(b, 'upcoming')).join('');
    }

    // Past
    if (res.past.length === 0) {
      pastWrap.innerHTML = '<div class="p-4 text-center bg-white rounded-4 border text-muted">No completed stays recorded yet.</div>';
    } else {
      pastWrap.innerHTML = res.past.map(b => renderBookingCard(b, 'past')).join('');
    }

    // Cancelled
    if (res.cancelled.length === 0) {
      cancelledWrap.innerHTML = '<div class="p-4 text-center bg-white rounded-4 border text-muted">No cancelled reservations.</div>';
    } else {
      cancelledWrap.innerHTML = res.cancelled.map(b => renderBookingCard(b, 'cancelled')).join('');
    }

  } catch (err) {
    console.error('Failed to load customer bookings:', err);
  }
}

function renderBookingCard(b, type) {
  const isUpcoming = type === 'upcoming';
  const isPast = type === 'past';
  const isCancelled = type === 'cancelled';

  return `
    <div class="card mb-3 border-0 shadow-sm rounded-4 overflow-hidden">
      <div class="row g-0 align-items-center">
        <div class="col-md-3">
          <img src="${b.hotel_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'}" class="img-fluid h-100 w-100" style="min-height: 160px; object-fit: cover;" alt="${b.hotel_name}">
        </div>
        <div class="col-md-6 p-4">
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge ${isUpcoming ? 'bg-forest' : isCancelled ? 'bg-danger' : 'bg-secondary'}">${b.booking_status.toUpperCase()}</span>
            <small class="text-muted fw-bold">Ref: ${b.booking_reference}</small>
          </div>
          <h5 class="fw-bold text-forest mb-1">${b.hotel_name}</h5>
          <div class="small text-muted mb-2"><i class="bi bi-geo-alt"></i> ${b.hotel_city}, ${b.hotel_state}</div>
          
          <div class="d-flex flex-wrap gap-3 small text-dark mb-1">
            <span><i class="bi bi-calendar-event text-olive me-1"></i> ${api.formatDate(b.check_in_date)} — ${api.formatDate(b.check_out_date)}</span>
            <span><i class="bi bi-door-closed text-olive me-1"></i> ${b.room_type_name || 'Standard'} (Room ${b.assigned_room_number || 'TBD'})</span>
          </div>

          <div class="small text-muted">
            Payment: <strong>${b.payment_status.toUpperCase()}</strong> via ${b.payment_method}
          </div>
        </div>
        <div class="col-md-3 p-4 text-md-end border-start">
          <div class="mb-2">
            <span class="text-muted small d-block">Total Paid</span>
            <span class="fs-4 fw-bold text-forest">${api.formatCurrency(b.final_amount)}</span>
          </div>

          ${isUpcoming ? `
            <button class="btn btn-outline-danger btn-sm px-3" onclick="handleCancelStay(${b.id}, '${b.booking_reference}')">
              Cancel Stay
            </button>
          ` : ''}

          ${isPast ? `
            <button class="btn btn-outline-forest btn-sm px-3" onclick="openReviewModal(${b.hotel_id}, ${b.id}, '${b.hotel_name.replace(/'/g, "\\'")}')">
              ${b.customer_review_rating ? 'Edit Review (' + b.customer_review_rating + '★)' : 'Write Review'}
            </button>
          ` : ''}

          ${isCancelled ? `
            <div class="small text-danger fw-semibold">Refund Processed</div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

async function handleCancelStay(bookingId, reference) {
  if (!confirm(`Are you sure you want to cancel reservation ${reference}? A full refund will be simulated per the cancellation policy.`)) {
    return;
  }

  try {
    const res = await api.patch(`/bookings/${bookingId}/cancel`, {
      reason: 'Guest requested cancellation via dashboard'
    });

    if (res.success) {
      api.showToast(`Reservation ${reference} cancelled. ${res.message}`, 'success');
      await loadCustomerBookings();
    }
  } catch (err) {
    api.showToast(err.message, 'error');
  }
}

async function loadCustomerWishlist() {
  const container = document.getElementById('wishlist-grid-container');
  if (!container) return;

  try {
    const res = await api.get('/wishlist');
    if (!res.success || !res.wishlist || res.wishlist.length === 0) {
      container.innerHTML = `
        <div class="col-12 p-4 text-center bg-white rounded-4 border text-muted">
          <i class="bi bi-heart fs-2 d-block mb-2 text-danger"></i>
          You haven't saved any stays to your wishlist yet.
          <div class="mt-3"><a href="/hotels.html" class="btn btn-forest btn-sm px-3">Explore Stays</a></div>
        </div>
      `;
      return;
    }

    container.innerHTML = res.wishlist.map(w => `
      <div class="col-lg-4 col-md-6 mb-4">
        <div class="stay-card">
          <div class="stay-image-wrapper">
            <img src="${w.primary_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'}" class="stay-image" alt="${w.name}">
            <span class="stay-badge-category">${w.category}</span>
          </div>
          <div class="stay-body">
            <div class="stay-location"><i class="bi bi-geo-alt"></i> ${w.city}, ${w.state}</div>
            <h5 class="stay-title">${w.name}</h5>
            <div class="stay-rating-row">
              <span class="rating-pill"><i class="bi bi-star-fill text-warning"></i> ${w.star_rating}</span>
            </div>
            <div class="stay-footer">
              <div>
                <span class="stay-price-val">${api.formatCurrency(w.base_price_per_night)}</span>
                <span class="stay-price-sub"> / night</span>
              </div>
              <a href="/hotel-detail.html?id=${w.slug || w.id}" class="btn btn-forest btn-sm px-3">Book Stay</a>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load wishlist:', err);
  }
}

// Review Modal Handling
let targetHotelIdForReview = null;
let targetBookingIdForReview = null;

function openReviewModal(hotelId, bookingId, hotelName) {
  targetHotelIdForReview = hotelId;
  targetBookingIdForReview = bookingId;

  document.getElementById('review-hotel-name').innerText = hotelName;
  const modal = new bootstrap.Modal(document.getElementById('writeReviewModal'));
  modal.show();
}

async function submitCustomerReview() {
  const rating = parseFloat(document.getElementById('review-overall-rating').value);
  const title = document.getElementById('review-title').value.trim();
  const comment = document.getElementById('review-comment').value.trim();
  const cleanliness = parseFloat(document.getElementById('review-cleanliness').value);
  const staff = parseFloat(document.getElementById('review-staff').value);

  if (!title || !comment) {
    api.showToast('Please provide both a title and review feedback.', 'warning');
    return;
  }

  try {
    const res = await api.post('/reviews/add', {
      hotel_id: targetHotelIdForReview,
      booking_id: targetBookingIdForReview,
      rating,
      title,
      comment,
      cleanliness_rating: cleanliness,
      staff_rating: staff,
      service_rating: 5.0,
      value_rating: 5.0
    });

    if (res.success) {
      api.showToast(res.message, 'success');
      const modal = bootstrap.Modal.getInstance(document.getElementById('writeReviewModal'));
      modal.hide();
      await loadCustomerBookings();
    }
  } catch (err) {
    api.showToast(err.message, 'error');
  }
}

// Profile update
async function handleProfileSave(e) {
  e.preventDefault();
  const full_name = document.getElementById('prof-name').value.trim();
  const phone = document.getElementById('prof-phone').value.trim();

  try {
    const res = await api.put('/auth/profile', { full_name, phone });
    if (res.success) {
      const user = api.getUser();
      user.full_name = full_name;
      user.phone = phone;
      api.setUser(user);
      api.showToast('Profile updated successfully.', 'success');
      renderUserProfileHeader(user);
    }
  } catch (err) {
    api.showToast(err.message, 'error');
  }
}

// Change Password
async function handleChangePassword(e) {
  e.preventDefault();
  const current_password = document.getElementById('pwd-current').value;
  const new_password = document.getElementById('pwd-new').value;

  if (new_password.length < 6) {
    api.showToast('New password must be at least 6 characters long.', 'warning');
    return;
  }

  try {
    const res = await api.put('/auth/change-password', { current_password, new_password });
    if (res.success) {
      api.showToast('Password changed successfully.', 'success');
      document.getElementById('pwd-current').value = '';
      document.getElementById('pwd-new').value = '';
    }
  } catch (err) {
    api.showToast(err.message, 'error');
  }
}

