// =====================================================================
// INTELLISTAY: Hotel Discovery & Search Controller
// =====================================================================

let currentPage = 1;
let selectedForComparison = new Set();

document.addEventListener('DOMContentLoaded', async () => {
  initUrlParams();
  initFilterEvents();
  await loadAmenitiesFilter();
  await fetchHotels(1);
});

function initUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.get('destination')) {
    document.getElementById('filter-destination').value = urlParams.get('destination');
  }
  if (urlParams.get('checkIn')) {
    document.getElementById('filter-checkin').value = urlParams.get('checkIn');
  }
  if (urlParams.get('checkOut')) {
    document.getElementById('filter-checkout').value = urlParams.get('checkOut');
  }
  if (urlParams.get('guests')) {
    document.getElementById('filter-guests').value = urlParams.get('guests');
  }
  if (urlParams.get('category')) {
    const cat = urlParams.get('category');
    const radio = document.querySelector(`input[name="filter-category"][value="${cat}"]`);
    if (radio) radio.checked = true;
  }
  if (urlParams.get('maxPrice')) {
    document.getElementById('filter-max-price').value = urlParams.get('maxPrice');
    document.getElementById('max-price-display').innerText = '₹' + parseInt(urlParams.get('maxPrice')).toLocaleString('en-IN');
  }
  if (urlParams.get('sort')) {
    document.getElementById('sort-select').value = urlParams.get('sort');
  }
}

function initFilterEvents() {
  // Price slider listener
  const priceSlider = document.getElementById('filter-max-price');
  const priceDisplay = document.getElementById('max-price-display');
  if (priceSlider && priceDisplay) {
    priceSlider.addEventListener('input', () => {
      priceDisplay.innerText = '₹' + parseInt(priceSlider.value).toLocaleString('en-IN');
    });
    priceSlider.addEventListener('change', () => fetchHotels(1));
  }

  // Search input with debounce
  const destInput = document.getElementById('filter-destination');
  if (destInput) {
    let timeout;
    destInput.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fetchHotels(1), 400);
    });
  }

  // Sort select listener
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => fetchHotels(1));
  }

  // Guests select
  const guestsSelect = document.getElementById('filter-guests');
  if (guestsSelect) {
    guestsSelect.addEventListener('change', () => fetchHotels(1));
  }

  // Category radios
  document.querySelectorAll('input[name="filter-category"]').forEach(radio => {
    radio.addEventListener('change', () => fetchHotels(1));
  });

  // Rating radios
  document.querySelectorAll('input[name="filter-rating"]').forEach(radio => {
    radio.addEventListener('change', () => fetchHotels(1));
  });

  // Clear filters button
  const clearBtn = document.getElementById('clear-filters-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      document.getElementById('filter-destination').value = '';
      document.getElementById('filter-checkin').value = '';
      document.getElementById('filter-checkout').value = '';
      document.getElementById('filter-guests').value = '1';
      document.getElementById('filter-max-price').value = '15000';
      document.getElementById('max-price-display').innerText = '₹15,000';
      
      const allCatRadio = document.querySelector('input[name="filter-category"][value=""]');
      if (allCatRadio) allCatRadio.checked = true;

      const allRatingRadio = document.querySelector('input[name="filter-rating"][value=""]');
      if (allRatingRadio) allRatingRadio.checked = true;

      document.querySelectorAll('.filter-amenity-checkbox').forEach(cb => cb.checked = false);

      fetchHotels(1);
    });
  }
}

async function loadAmenitiesFilter() {
  const container = document.getElementById('amenities-filter-container');
  if (!container) return;

  try {
    const res = await api.get('/hotels/amenities/all');
    if (res.success && res.amenities) {
      container.innerHTML = res.amenities.map(a => `
        <div class="form-check mb-1">
          <input class="form-check-input filter-amenity-checkbox" type="checkbox" value="${a.code}" id="amenity-${a.code}" onchange="fetchHotels(1)">
          <label class="form-check-label small" for="amenity-${a.code}">
            <i class="bi ${a.icon} text-olive me-1"></i> ${a.name}
          </label>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load amenities filter:', err);
  }
}

async function fetchHotels(page = 1) {
  currentPage = page;
  const container = document.getElementById('hotels-results-container');
  const countBadge = document.getElementById('results-count-badge');
  const paginationWrap = document.getElementById('pagination-container');

  if (container) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="spinner-border text-forest" role="status"></div>
        <div class="mt-2 text-muted">Searching through authentic stays...</div>
      </div>
    `;
  }

  // Gather filter params
  const destination = document.getElementById('filter-destination') ? document.getElementById('filter-destination').value.trim() : '';
  const checkIn = document.getElementById('filter-checkin') ? document.getElementById('filter-checkin').value : '';
  const checkOut = document.getElementById('filter-checkout') ? document.getElementById('filter-checkout').value : '';
  const guests = document.getElementById('filter-guests') ? document.getElementById('filter-guests').value : '';
  const maxPrice = document.getElementById('filter-max-price') ? document.getElementById('filter-max-price').value : '';
  
  const categoryElem = document.querySelector('input[name="filter-category"]:checked');
  const category = categoryElem ? categoryElem.value : '';

  const ratingElem = document.querySelector('input[name="filter-rating"]:checked');
  const minRating = ratingElem ? ratingElem.value : '';

  const sort = document.getElementById('sort-select') ? document.getElementById('sort-select').value : 'popular';

  // Amenities
  const selectedAmenities = [];
  document.querySelectorAll('.filter-amenity-checkbox:checked').forEach(cb => {
    selectedAmenities.push(cb.value);
  });

  const queryParams = {
    page,
    limit: 9,
    destination,
    checkIn,
    checkOut,
    guests,
    maxPrice,
    categories: category,
    minRating,
    sort
  };

  if (selectedAmenities.length > 0) {
    queryParams.amenities = selectedAmenities.join(',');
  }

  try {
    const res = await api.get('/hotels', queryParams);
    
    if (!res.success || !res.data || res.data.length === 0) {
      if (countBadge) countBadge.innerText = '0 stays found';
      if (container) {
        container.innerHTML = `
          <div class="col-12 py-5 text-center">
            <div class="p-5 bg-white rounded-4 border border-1 mx-auto" style="max-width: 500px;">
              <i class="bi bi-geo-alt-fill fs-1 text-olive mb-3 d-block"></i>
              <h4 class="font-serif">No matching stays found</h4>
              <p class="text-muted small">Try broadening your destination, selecting flexible dates, or resetting filters to explore all available retreats.</p>
              <button class="btn btn-outline-forest btn-sm" onclick="document.getElementById('clear-filters-btn').click()">Reset All Filters</button>
            </div>
          </div>
        `;
      }
      if (paginationWrap) paginationWrap.innerHTML = '';
      return;
    }

    if (countBadge) {
      countBadge.innerText = `Showing ${res.data.length} of ${res.pagination.total} curated stays`;
    }

    // Render hotel cards
    container.innerHTML = res.data.map(hotel => renderHotelSearchCard(hotel)).join('');

    // Render pagination
    renderPagination(res.pagination);
  } catch (err) {
    if (container) {
      container.innerHTML = `<div class="col-12 text-center text-danger py-5">Failed to load stays: ${err.message}</div>`;
    }
  }
}

function renderHotelSearchCard(hotel) {
  const primaryImg = hotel.primary_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
  const isCompared = selectedForComparison.has(hotel.id);

  const topAmenities = (hotel.amenities || []).slice(0, 3).map(a => `
    <span class="amenity-chip"><i class="bi ${a.icon || 'bi-check2'}"></i> ${a.name}</span>
  `).join('');

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

          <div class="stay-amenities-tags">
            ${topAmenities}
          </div>

          <!-- Comparison Checkbox -->
          <div class="form-check mb-2">
            <input class="form-check-input" type="checkbox" id="compare-${hotel.id}" ${isCompared ? 'checked' : ''} onchange="toggleCompare(${hotel.id}, '${hotel.name.replace(/'/g, "\\'")}')">
            <label class="form-check-label small text-muted" for="compare-${hotel.id}">
              Add to comparison
            </label>
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

function renderPagination(pg) {
  const container = document.getElementById('pagination-container');
  if (!container || pg.totalPages <= 1) {
    if (container) container.innerHTML = '';
    return;
  }

  let html = '<ul class="pagination justify-content-center">';

  // Prev
  html += `
    <li class="page-item ${pg.page === 1 ? 'disabled' : ''}">
      <button class="page-link" onclick="fetchHotels(${pg.page - 1})"><i class="bi bi-chevron-left"></i></button>
    </li>
  `;

  // Page Numbers
  for (let i = 1; i <= pg.totalPages; i++) {
    if (i === 1 || i === pg.totalPages || (i >= pg.page - 1 && i <= pg.page + 1)) {
      html += `
        <li class="page-item ${i === pg.page ? 'active' : ''}">
          <button class="page-link ${i === pg.page ? 'bg-forest border-forest text-white' : ''}" onclick="fetchHotels(${i})">${i}</button>
        </li>
      `;
    } else if (i === pg.page - 2 || i === pg.page + 2) {
      html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
  }

  // Next
  html += `
    <li class="page-item ${pg.page === pg.totalPages ? 'disabled' : ''}">
      <button class="page-link" onclick="fetchHotels(${pg.page + 1})"><i class="bi bi-chevron-right"></i></button>
    </li>
  `;

  html += '</ul>';
  container.innerHTML = html;
}

function toggleCompare(hotelId, hotelName) {
  if (selectedForComparison.has(hotelId)) {
    selectedForComparison.delete(hotelId);
  } else {
    if (selectedForComparison.size >= 3) {
      api.showToast('You can compare a maximum of 3 stays simultaneously.', 'warning');
      const cb = document.getElementById(`compare-${hotelId}`);
      if (cb) cb.checked = false;
      return;
    }
    selectedForComparison.add(hotelId);
  }

  updateComparisonFloatingBar();
}

function updateComparisonFloatingBar() {
  let bar = document.getElementById('floating-compare-bar');
  if (selectedForComparison.size > 0) {
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'floating-compare-bar';
      bar.className = 'fixed-bottom bg-forest text-white py-3 px-4 shadow-lg d-flex justify-content-between align-items-center';
      bar.style.zIndex = '1050';
      document.body.appendChild(bar);
    }

    const ids = Array.from(selectedForComparison).join(',');
    bar.innerHTML = `
      <div class="container d-flex justify-content-between align-items-center">
        <div>
          <span class="badge bg-gold text-white me-2">${selectedForComparison.size} Stays Selected</span>
          <span>Ready to compare pricing, room types, and amenities side-by-side.</span>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-light btn-sm" onclick="selectedForComparison.clear(); updateComparisonFloatingBar(); fetchHotels(currentPage);">Clear</button>
          <a href="/compare.html?ids=${ids}" class="btn btn-gold btn-sm px-4">Compare Now <i class="bi bi-arrow-right"></i></a>
        </div>
      </div>
    `;
    bar.style.display = 'block';
  } else {
    if (bar) bar.style.display = 'none';
  }
}

