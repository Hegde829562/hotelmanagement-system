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

let cachedCustomerBookings = [];

async function loadCustomerBookings() {
  const upcomingWrap = document.getElementById('upcoming-bookings-container');
  const pastWrap = document.getElementById('past-bookings-container');
  const cancelledWrap = document.getElementById('cancelled-bookings-container');

  try {
    const res = await api.get('/bookings/my-bookings');
    if (!res.success) return;

    cachedCustomerBookings = [...(res.upcoming || []), ...(res.past || []), ...(res.cancelled || [])];

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

          <div class="mt-2">
            <button class="btn btn-outline-danger btn-sm px-2 py-1 w-100" style="font-size: 0.75rem;" onclick="openRaiseComplaintModal(${b.hotel_id}, '${b.hotel_name.replace(/'/g, "\\'")}', '${b.assigned_room_number || ''}')">
              <i class="bi bi-shield-exclamation me-1"></i> Raise Complaint
            </button>
          </div>
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

// =====================================================================
// CUSTOMER COMPLAINTS & SERVICE REQUESTS
// =====================================================================

async function loadCustomerComplaints() {
  const container = document.getElementById('customer-complaints-container');
  if (!container) return;

  container.innerHTML = '<div class="text-center py-4 text-muted"><span class="spinner-border spinner-border-sm me-2"></span>Loading complaints...</div>';

  try {
    const res = await api.get('/staff/customer/complaints');
    if (!res.success || !res.complaints || res.complaints.length === 0) {
      container.innerHTML = `
        <div class="p-4 text-center bg-light rounded-4 border text-muted">
          <i class="bi bi-shield-check fs-2 text-success d-block mb-2"></i>
          No open issues or complaints reported. Have a concern during your stay? Click "Raise New Complaint" above.
        </div>
      `;
      return;
    }

    container.innerHTML = res.complaints.map(c => {
      const isResolved = c.status === 'resolved' || c.status === 'closed';

      return `
        <div class="card mb-3 border rounded-3 p-3 shadow-sm" style="border-left: 5px solid ${isResolved ? '#2d5a27' : '#dc3545'} !important;">
          <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-2">
            <div>
              <span class="badge bg-secondary me-2">TKT-#${c.id}</span>
              <strong class="text-forest fs-5">${c.title}</strong>
              <div class="small text-muted">
                <i class="bi bi-building me-1"></i> ${c.hotel_name} (${c.hotel_city})
                ${c.room_number ? ' • Room ' + c.room_number : ''}
              </div>
            </div>
            <div class="d-flex align-items-center gap-2">
              <span class="badge ${c.priority === 'emergency' ? 'bg-danger' : (c.priority === 'high' ? 'bg-warning text-dark' : 'bg-light text-dark border')} text-uppercase">${c.priority} Priority</span>
              <span class="status-pill ${isResolved ? 'status-pill-success' : 'status-pill-danger'}">${c.status.toUpperCase()}</span>
            </div>
          </div>

          <p class="text-muted small mb-2">${c.description}</p>

          ${c.resolution_notes ? `
            <div class="p-2 bg-success-subtle rounded-3 small text-success border border-success-subtle mb-2">
              <strong><i class="bi bi-check-circle me-1"></i> Operations Resolution:</strong> ${c.resolution_notes}
            </div>
          ` : ''}

          <div class="d-flex justify-content-between align-items-center pt-2 border-top">
            <small class="text-muted"><i class="bi bi-clock me-1"></i> Reported on ${api.formatDate(c.created_at)}</small>
            <div>
              ${isResolved ? `
                <button class="btn btn-outline-danger btn-sm py-1 px-3" onclick="reopenCustomerComplaint(${c.id})">
                  <i class="bi bi-arrow-counterclockwise me-1"></i> Issue Not Resolved? Re-open Complaint
                </button>
              ` : `
                <span class="small text-muted"><i class="bi bi-hourglass-split me-1 text-warning"></i> Operations team dispatched</span>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div class="text-danger small py-3">${err.message}</div>`;
  }
}

function openRaiseComplaintModal(hotelId, hotelName, roomNumber) {
  const hotelSelect = document.getElementById('cmpl-hotel-id');
  const roomInput = document.getElementById('cmpl-room-number');

  if (hotelSelect) {
    if (cachedCustomerBookings.length > 0) {
      hotelSelect.innerHTML = cachedCustomerBookings.map(b => 
        `<option value="${b.hotel_id}" ${hotelId == b.hotel_id ? 'selected' : ''}>${b.hotel_name} (${b.hotel_city}) - Ref: ${b.booking_reference}</option>`
      ).join('');
    } else {
      hotelSelect.innerHTML = `<option value="${hotelId || 1}">${hotelName || 'Current Hotel Stay'}</option>`;
    }
  }

  if (roomInput && roomNumber) {
    roomInput.value = roomNumber;
  }

  const modalEl = document.getElementById('raiseComplaintModal');
  if (modalEl) {
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }
}

async function submitCustomerComplaint(e) {
  e.preventDefault();
  const hotel_id = document.getElementById('cmpl-hotel-id').value;
  const room_number = document.getElementById('cmpl-room-number').value.trim();
  const issue_category = document.getElementById('cmpl-category').value;
  const title = document.getElementById('cmpl-title').value.trim();
  const description = document.getElementById('cmpl-desc').value.trim();

  const submitBtn = document.getElementById('cmpl-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Submitting...';
  }

  try {
    const res = await api.post('/staff/customer/complaints', {
      hotel_id,
      room_number: room_number || null,
      issue_category,
      title,
      description,
      priority: 'high'
    });

    if (res.success) {
      api.showToast('Your complaint has been submitted. Operations staff alerted.', 'success');
      e.target.reset();
      const modalEl = document.getElementById('raiseComplaintModal');
      const instance = bootstrap.Modal.getInstance(modalEl);
      if (instance) instance.hide();

      // Switch to complaints tab and reload
      const triggerEl = document.querySelector('#cust-tabs button[data-bs-target="#tab-complaints"]');
      if (triggerEl) bootstrap.Tab.getOrCreateInstance(triggerEl).show();
      await loadCustomerComplaints();
    }
  } catch (err) {
    api.showToast(err.message, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Submit Complaint Ticket';
    }
  }
}

async function reopenCustomerComplaint(taskId) {
  const reason = prompt('Please explain why the issue is still unresolved (e.g. Defect recurred, noise resumed):');
  if (!reason) return;

  try {
    const res = await api.patch(`/staff/maintenance/${taskId}/reopen`, { reason });
    if (res.success) {
      api.showToast('Complaint re-opened. Hotel supervisor alerted.', 'warning');
      await loadCustomerComplaints();
    }
  } catch (err) {
    api.showToast(err.message, 'error');
  }
}

