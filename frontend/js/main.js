// =====================================================================
// INTELLISTAY: Landing Page Interactive Controller
// =====================================================================

document.addEventListener('DOMContentLoaded', async () => {
  initSearchDefaults();
  await loadLandingCurations();
});

function initSearchDefaults() {
  const checkInInput = document.getElementById('hero-checkin');
  const checkOutInput = document.getElementById('hero-checkout');

  if (checkInInput && checkOutInput) {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 2);

    checkInInput.value = today.toISOString().split('T')[0];
    checkInInput.min = today.toISOString().split('T')[0];

    checkOutInput.value = tomorrow.toISOString().split('T')[0];
    checkOutInput.min = tomorrow.toISOString().split('T')[0];

    checkInInput.addEventListener('change', () => {
      const selected = new Date(checkInInput.value);
      selected.setDate(selected.getDate() + 1);
      checkOutInput.min = selected.toISOString().split('T')[0];
      if (new Date(checkOutInput.value) <= new Date(checkInInput.value)) {
        checkOutInput.value = selected.toISOString().split('T')[0];
      }
    });
  }

  const searchForm = document.getElementById('hero-search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const dest = document.getElementById('hero-destination').value.trim();
      const cin = checkInInput ? checkInInput.value : '';
      const cout = checkOutInput ? checkOutInput.value : '';
      const guests = document.getElementById('hero-guests') ? document.getElementById('hero-guests').value : 2;

      const params = new URLSearchParams();
      if (dest) params.append('destination', dest);
      if (cin) params.append('checkIn', cin);
      if (cout) params.append('checkOut', cout);
      if (guests) params.append('guests', guests);

      window.location.href = `/hotels.html?${params.toString()}`;
    });
  }
}

async function loadLandingCurations() {
  try {
    const res = await api.get('/hotels/curations/landing');
    if (!res.success) return;

    renderTopRated(res.topRated || []);
    renderBudgetStays(res.budgetFriendly || []);
    renderDestinations(res.destinations || []);
  } catch (err) {
    console.error('Failed to load landing curations:', err);
  }
}

function renderTopRated(stays) {
  const container = document.getElementById('top-rated-stays-container');
  if (!container) return;

  if (stays.length === 0) {
    container.innerHTML = '<div class="col-12 text-center text-muted py-4">No stays currently available.</div>';
    return;
  }

  container.innerHTML = stays.map(hotel => createStayCardHtml(hotel)).join('');
}

function renderBudgetStays(stays) {
  const container = document.getElementById('budget-stays-container');
  if (!container) return;

  if (stays.length === 0) {
    container.innerHTML = '<div class="col-12 text-center text-muted py-4">No budget stays currently available.</div>';
    return;
  }

  container.innerHTML = stays.map(hotel => createStayCardHtml(hotel)).join('');
}

function renderDestinations(dests) {
  const container = document.getElementById('featured-destinations-container');
  if (!container) return;

  container.innerHTML = dests.map(d => `
    <div class="col-lg-3 col-md-6 mb-4">
      <div class="destination-card" onclick="window.location.href='/hotels.html?destination=${encodeURIComponent(d.city)}'">
        <img src="${d.dest_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'}" class="destination-image" alt="${d.city}">
        <div class="destination-overlay">
          <h4 class="destination-name">${d.city}</h4>
          <div class="destination-count">${d.stay_count} curated stays • from ${api.formatCurrency(d.starting_price)}</div>
        </div>
      </div>
    </div>
  `).join('');
}

function createStayCardHtml(hotel) {
  const primaryImg = hotel.primary_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
  return `
    <div class="col-lg-4 col-md-6 mb-4">
      <div class="stay-card">
        <div class="stay-image-wrapper">
          <img src="${primaryImg}" class="stay-image" alt="${hotel.name}">
          <span class="stay-badge-category">${hotel.category}</span>
          <button class="stay-wishlist-btn" onclick="toggleSaveHotel(${hotel.id}, this); event.stopPropagation();" title="Save to wishlist">
            <i class="bi bi-heart"></i>
          </button>
        </div>
        <div class="stay-body">
          <div class="stay-location"><i class="bi bi-geo-alt"></i> ${hotel.city}, ${hotel.state}</div>
          <h3 class="stay-title">${hotel.name}</h3>
          <div class="stay-rating-row">
            <span class="rating-pill"><i class="bi bi-star-fill text-warning"></i> ${hotel.star_rating}</span>
            <span class="text-muted">(${hotel.review_count || 12} reviews)</span>
          </div>
          <div class="stay-footer">
            <div>
              <span class="stay-price-val">${api.formatCurrency(hotel.base_price_per_night)}</span>
              <span class="stay-price-sub"> / night</span>
            </div>
            <a href="/hotel-detail.html?id=${hotel.slug || hotel.id}" class="btn btn-outline-forest btn-sm px-3">View Details</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function toggleSaveHotel(hotelId, btnElement) {
  const user = api.getUser();
  if (!user) {
    api.showToast('Please sign in to save stays to your wishlist.', 'warning');
    setTimeout(() => { window.location.href = '/login.html?returnUrl=' + encodeURIComponent(window.location.pathname); }, 1200);
    return;
  }

  try {
    const res = await api.post('/wishlist/toggle', { hotel_id: hotelId });
    if (res.success) {
      if (res.is_saved) {
        btnElement.classList.add('active');
        btnElement.innerHTML = '<i class="bi bi-heart-fill"></i>';
        api.showToast(res.message, 'success');
      } else {
        btnElement.classList.remove('active');
        btnElement.innerHTML = '<i class="bi bi-heart"></i>';
        api.showToast(res.message, 'info');
      }
    }
  } catch (err) {
    api.showToast(err.message, 'error');
  }
}

