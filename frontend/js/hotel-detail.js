// =====================================================================
// INTELLISTAY: Hotel Detail & Live Booking Controller
// =====================================================================

let currentHotel = null;
let currentAvailability = null;
let selectedRoomTypeId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const hotelIdOrSlug = urlParams.get('id') || '1';

  initDatePickers();
  await loadHotelDetail(hotelIdOrSlug);
});

function initDatePickers() {
  const checkIn = document.getElementById('detail-checkin');
  const checkOut = document.getElementById('detail-checkout');

  if (checkIn && checkOut) {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 2);

    checkIn.value = today.toISOString().split('T')[0];
    checkIn.min = today.toISOString().split('T')[0];

    checkOut.value = tomorrow.toISOString().split('T')[0];
    checkOut.min = tomorrow.toISOString().split('T')[0];

    checkIn.addEventListener('change', () => {
      const selected = new Date(checkIn.value);
      selected.setDate(selected.getDate() + 1);
      checkOut.min = selected.toISOString().split('T')[0];
      if (new Date(checkOut.value) <= new Date(checkIn.value)) {
        checkOut.value = selected.toISOString().split('T')[0];
      }
      checkLiveAvailability();
    });

    checkOut.addEventListener('change', () => {
      checkLiveAvailability();
    });
  }
}

async function loadHotelDetail(idOrSlug) {
  try {
    const res = await api.get(`/hotels/${idOrSlug}`);
    if (!res.success || !res.hotel) {
      document.getElementById('hotel-detail-container').innerHTML = `
        <div class="col-12 py-5 text-center">
          <h3 class="font-serif">Hotel not found</h3>
          <p class="text-muted">The requested stay could not be retrieved.</p>
          <a href="/hotels.html" class="btn btn-forest">Back to All Stays</a>
        </div>
      `;
      return;
    }

    currentHotel = res.hotel;
    renderHotelContent(currentHotel);
    await checkLiveAvailability();
  } catch (err) {
    console.error('Failed to load hotel:', err);
  }
}

function renderHotelContent(hotel) {
  // Title & breadcrumbs
  document.title = `${hotel.name} – IntelliStay`;
  document.getElementById('hotel-name').innerText = hotel.name;
  document.getElementById('hotel-category-badge').innerText = hotel.category;
  document.getElementById('hotel-location-text').innerHTML = `<i class="bi bi-geo-alt-fill text-olive me-1"></i> ${hotel.address}, ${hotel.city}, ${hotel.state} - ${hotel.pincode}`;
  document.getElementById('hotel-rating-badge').innerHTML = `<i class="bi bi-star-fill text-warning me-1"></i> ${hotel.star_rating} (${hotel.reviewStats.total_reviews || 0} verified reviews)`;

  // Image Gallery
  const images = hotel.images || [];
  const mainImg = images.length > 0 ? images[0].image_url : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';
  const subImg1 = images.length > 1 ? images[1].image_url : 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80';
  const subImg2 = images.length > 2 ? images[2].image_url : 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80';

  document.getElementById('gallery-primary-img').src = mainImg;
  document.getElementById('gallery-sub-img-1').src = subImg1;
  document.getElementById('gallery-sub-img-2').src = subImg2;

  // Description
  document.getElementById('hotel-description').innerText = hotel.description;

  // Policies
  document.getElementById('hotel-checkin-time').innerText = hotel.check_in_time || '14:00';
  document.getElementById('hotel-checkout-time').innerText = hotel.check_out_time || '11:00';
  document.getElementById('hotel-cancellation-policy').innerText = hotel.cancellation_policy || 'Free cancellation up to 48 hours prior to arrival.';

  // Amenities
  const amenContainer = document.getElementById('hotel-amenities-list');
  if (amenContainer) {
    amenContainer.innerHTML = (hotel.amenities || []).map(a => `
      <div class="col-md-4 col-6 mb-2">
        <div class="d-flex align-items-center gap-2 p-2 rounded-3 bg-white border border-1">
          <i class="bi ${a.icon || 'bi-check-circle'} text-olive fs-5"></i>
          <span class="small fw-medium">${a.name}</span>
        </div>
      </div>
    `).join('');
  }

  // Reviews
  renderReviewsSection(hotel.reviews || [], hotel.reviewStats || {});
}

async function checkLiveAvailability() {
  if (!currentHotel) return;

  const checkIn = document.getElementById('detail-checkin').value;
  const checkOut = document.getElementById('detail-checkout').value;
  const guests = document.getElementById('detail-guests').value;

  const roomsContainer = document.getElementById('room-types-selection-container');
  if (!roomsContainer) return;

  roomsContainer.innerHTML = `
    <div class="text-center py-4">
      <div class="spinner-border spinner-border-sm text-forest" role="status"></div>
      <span class="ms-2 small text-muted">Checking real-time room availability...</span>
    </div>
  `;

  try {
    const res = await api.get('/bookings/check-availability', {
      hotel_id: currentHotel.id,
      check_in: checkIn,
      check_out: checkOut,
      guests
    });

    if (res.success && res.categories) {
      currentAvailability = res;
      renderAvailableRooms(res.categories, res.nights);
    }
  } catch (err) {
    roomsContainer.innerHTML = `<div class="text-danger small py-3">Failed to check dates: ${err.message}</div>`;
  }
}

function renderAvailableRooms(categories, nights) {
  const container = document.getElementById('room-types-selection-container');
  if (!container) return;

  if (categories.length === 0) {
    container.innerHTML = '<div class="alert alert-warning small">No rooms defined for this property.</div>';
    return;
  }

  container.innerHTML = categories.map(cat => {
    const isAvail = cat.is_available;
    const roomImg = cat.image_url || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=400&q=80';

    return `
      <div class="room-selection-card ${isAvail ? '' : 'opacity-75'}">
        <div class="row align-items-center g-3">
          <div class="col-md-3">
            <img src="${roomImg}" class="rounded-3 w-100" style="height: 120px; object-fit: cover;" alt="${cat.name}">
          </div>
          <div class="col-md-5">
            <h5 class="fw-bold text-forest mb-1">${cat.name}</h5>
            <p class="text-muted small mb-2">${cat.description || ''}</p>
            <div class="d-flex flex-wrap gap-2 small text-muted">
              <span><i class="bi bi-person me-1"></i> ${cat.capacity_adults} Adults, ${cat.capacity_children} Child</span>
              <span>•</span>
              <span><i class="bi bi-aspect-ratio me-1"></i> ${cat.room_size_sqft} sq ft</span>
              <span>•</span>
              <span><i class="bi bi-moon me-1"></i> ${cat.bed_type}</span>
            </div>
            <div class="mt-2">
              ${isAvail 
                ? `<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-check2-circle me-1"></i> ${cat.available_rooms_count} rooms available for selected dates</span>`
                : `<span class="badge bg-danger-subtle text-danger border border-danger-subtle"><i class="bi bi-x-circle me-1"></i> Sold out for selected dates</span>`
              }
            </div>
          </div>
          <div class="col-md-4 text-md-end">
            <div class="mb-2">
              <span class="fs-4 fw-bold text-forest">${api.formatCurrency(cat.price_per_night)}</span>
              <small class="text-muted"> / night</small>
            </div>
            <div class="small text-muted mb-3">
              Total for ${nights} night${nights > 1 ? 's' : ''}: <strong>${api.formatCurrency(cat.total_amount)}</strong> <span style="font-size: 0.72rem;">(incl. GST)</span>
            </div>
            <button class="btn ${isAvail ? 'btn-forest' : 'btn-secondary'} btn-sm px-4" 
                    ${isAvail ? '' : 'disabled'} 
                    onclick="openBookingModal(${cat.room_type_id})">
              ${isAvail ? 'Reserve Room' : 'Unavailable'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openBookingModal(roomTypeId) {
  const user = api.getUser();
  if (!user) {
    api.showToast('Please sign in or create an account to book your stay.', 'warning');
    setTimeout(() => {
      window.location.href = `/login.html?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    }, 1200);
    return;
  }

  selectedRoomTypeId = roomTypeId;
  const category = (currentAvailability.categories || []).find(c => c.room_type_id === roomTypeId);
  if (!category) return;

  const checkIn = document.getElementById('detail-checkin').value;
  const checkOut = document.getElementById('detail-checkout').value;
  const guests = document.getElementById('detail-guests').value;

  // Fill modal
  document.getElementById('modal-hotel-title').innerText = currentHotel.name;
  document.getElementById('modal-room-type').innerText = category.name;
  document.getElementById('modal-dates').innerText = `${api.formatDate(checkIn)} to ${api.formatDate(checkOut)} (${currentAvailability.nights} nights)`;
  document.getElementById('modal-guests').innerText = `${guests} Guests`;

  document.getElementById('modal-subtotal').innerText = api.formatCurrency(category.subtotal);
  document.getElementById('modal-tax').innerText = api.formatCurrency(category.tax_amount);
  document.getElementById('modal-total').innerText = api.formatCurrency(category.total_amount);

  // Auto-fill customer info
  document.getElementById('booking-guest-name').value = user.full_name || '';
  document.getElementById('booking-guest-email').value = user.email || '';
  document.getElementById('booking-guest-phone').value = user.phone || '';

  const modal = new bootstrap.Modal(document.getElementById('bookingConfirmModal'));
  modal.show();
}

async function confirmBookingSubmission() {
  const submitBtn = document.getElementById('modal-confirm-btn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Confirming & Holding Room...';

  const checkIn = document.getElementById('detail-checkin').value;
  const checkOut = document.getElementById('detail-checkout').value;
  const guests = parseInt(document.getElementById('detail-guests').value, 10);
  const paymentMethod = document.getElementById('booking-payment-method').value;
  const specialRequests = document.getElementById('booking-special-requests').value;

  const payload = {
    hotel_id: currentHotel.id,
    room_type_id: selectedRoomTypeId,
    check_in: checkIn,
    check_out: checkOut,
    total_guests: guests,
    payment_method: paymentMethod,
    special_requests: specialRequests,
    simulated_payment_success: true
  };

  try {
    const res = await api.post('/bookings/create', payload);

    if (res.success && res.booking) {
      // Hide modal
      const modalElement = document.getElementById('bookingConfirmModal');
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal.hide();

      // Show success modal
      document.getElementById('success-booking-ref').innerText = res.booking.booking_reference;
      document.getElementById('success-room-number').innerText = res.booking.assigned_room_number;
      document.getElementById('success-loyalty-pts').innerText = `+${res.booking.earned_loyalty_points} Points`;
      document.getElementById('success-final-amount').innerText = api.formatCurrency(res.booking.final_amount);

      const successModal = new bootstrap.Modal(document.getElementById('bookingSuccessModal'));
      successModal.show();

      // Refresh availability
      await checkLiveAvailability();
    }
  } catch (err) {
    api.showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Complete Simulated Payment & Book';
  }
}

function renderReviewsSection(reviews, stats) {
  const container = document.getElementById('hotel-reviews-container');
  if (!container) return;

  const total = stats.total_reviews || reviews.length || 0;
  const avg = stats.avg_rating ? parseFloat(stats.avg_rating).toFixed(1) : '4.8';

  document.getElementById('reviews-overall-score').innerText = avg;
  document.getElementById('reviews-count-header').innerText = `Based on ${total} verified guest experiences`;

  if (reviews.length === 0) {
    container.innerHTML = '<div class="text-muted small">No reviews written yet. Be the first to share your experience!</div>';
    return;
  }

  container.innerHTML = reviews.map(r => `
    <div class="border-bottom py-3">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div class="d-flex align-items-center gap-2">
          <img src="${r.reviewer_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}" class="rounded-circle" style="width: 36px; height: 36px; object-fit: cover;">
          <div>
            <div class="fw-bold small text-forest">${r.reviewer_name || 'Verified Guest'}</div>
            <div class="text-muted" style="font-size: 0.72rem;">${api.formatDate(r.created_at)} • Verified Stay</div>
          </div>
        </div>
        <span class="rating-pill"><i class="bi bi-star-fill text-warning"></i> ${r.rating}</span>
      </div>
      <h6 class="fw-bold mb-1">${r.title}</h6>
      <p class="text-muted small mb-0">${r.comment}</p>
    </div>
  `).join('');
}

