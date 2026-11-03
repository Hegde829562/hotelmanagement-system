// =====================================================================
// INTELLISTAY: Hotel Comparison Controller
// =====================================================================

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const ids = urlParams.get('ids') || '1,4,6'; // default comparison if none passed

  await loadComparison(ids);
});

async function loadComparison(ids) {
  const container = document.getElementById('comparison-table-container');
  if (!container) return;

  try {
    const res = await api.get('/hotels/compare', { ids });

    if (!res.success || !res.hotels || res.hotels.length === 0) {
      container.innerHTML = `
        <div class="p-5 text-center bg-white rounded-4 border">
          <i class="bi bi-layout-split text-olive fs-1 mb-2"></i>
          <h4 class="font-serif">No Stays Selected for Comparison</h4>
          <p class="text-muted small">Please select up to 3 hotels from the Explore Stays page to compare their pricing, room categories, and amenities.</p>
          <a href="/hotels.html" class="btn btn-forest btn-sm px-4">Browse Stays</a>
        </div>
      `;
      return;
    }

    renderComparisonTable(res.hotels);
  } catch (err) {
    container.innerHTML = `<div class="text-danger text-center py-5">Failed to load comparison: ${err.message}</div>`;
  }
}

function renderComparisonTable(hotels) {
  const container = document.getElementById('comparison-table-container');
  if (!container) return;

  const colWidth = Math.floor(75 / hotels.length);

  let html = `
    <div class="table-responsive bg-white rounded-4 border shadow-sm p-4">
      <table class="table table-bordered align-middle mb-0">
        <thead>
          <tr class="bg-cream">
            <th style="width: 25%; font-family: var(--font-serif); font-size: 1.1rem; color: var(--primary-forest);">Hotel Attributes</th>
            ${hotels.map(h => `
              <th style="width: ${colWidth}%;" class="text-center">
                <img src="${h.primary_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80'}" class="rounded-3 mb-2 w-100" style="height: 140px; object-fit: cover;">
                <h5 class="fw-bold text-forest mb-1">${h.name}</h5>
                <div class="small text-muted mb-2"><i class="bi bi-geo-alt"></i> ${h.city}, ${h.state}</div>
                <a href="/hotel-detail.html?id=${h.slug || h.id}" class="btn btn-forest btn-sm px-3">View Stay</a>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          <!-- Category -->
          <tr>
            <td class="fw-bold text-muted text-uppercase small">Category</td>
            ${hotels.map(h => `<td class="text-center"><span class="badge bg-gold-tint text-forest border">${h.category}</span></td>`).join('')}
          </tr>

          <!-- Base Price per Night -->
          <tr>
            <td class="fw-bold text-muted text-uppercase small">Starting Rate / Night</td>
            ${hotels.map(h => `<td class="text-center fs-5 fw-bold text-forest">${api.formatCurrency(h.base_price_per_night)}</td>`).join('')}
          </tr>

          <!-- Star Rating -->
          <tr>
            <td class="fw-bold text-muted text-uppercase small">Guest Rating</td>
            ${hotels.map(h => `
              <td class="text-center">
                <span class="rating-pill"><i class="bi bi-star-fill text-warning"></i> ${h.star_rating}</span>
                <span class="text-muted small ms-1">(${h.review_count || 12} reviews)</span>
              </td>
            `).join('')}
          </tr>

          <!-- Room Categories Available -->
          <tr>
            <td class="fw-bold text-muted text-uppercase small">Room Categories & Bedding</td>
            ${hotels.map(h => `
              <td>
                <ul class="list-unstyled mb-0 small">
                  ${(h.roomTypes || []).map(rt => `
                    <li class="mb-1 pb-1 border-bottom border-light">
                      <strong>${rt.name}</strong> • ${rt.bed_type} (${rt.capacity_adults} adults)
                    </li>
                  `).join('')}
                </ul>
              </td>
            `).join('')}
          </tr>

          <!-- Key Amenities -->
          <tr>
            <td class="fw-bold text-muted text-uppercase small">Top Amenities</td>
            ${hotels.map(h => `
              <td>
                <div class="d-flex flex-wrap gap-1">
                  ${(h.amenities || []).map(a => `
                    <span class="amenity-chip"><i class="bi ${a.icon || 'bi-check'}"></i> ${a.name}</span>
                  `).join('')}
                </div>
              </td>
            `).join('')}
          </tr>

          <!-- Policies -->
          <tr>
            <td class="fw-bold text-muted text-uppercase small">Cancellation Policy</td>
            ${hotels.map(h => `<td class="small text-muted text-center">${h.cancellation_policy || 'Free cancellation up to 48 hours'}</td>`).join('')}
          </tr>

          <!-- Check-In / Check-Out -->
          <tr>
            <td class="fw-bold text-muted text-uppercase small">Check-in / Check-out</td>
            ${hotels.map(h => `<td class="text-center small">${h.check_in_time} / ${h.check_out_time}</td>`).join('')}
          </tr>
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
}

