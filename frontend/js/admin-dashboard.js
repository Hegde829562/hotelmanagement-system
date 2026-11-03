// =====================================================================
// INTELLISTAY: Platform Admin Dashboard Controller
// =====================================================================

document.addEventListener('DOMContentLoaded', async () => {
  const user = api.getUser();
  if (!user || user.role !== 'admin') {
    window.location.href = '/login.html?returnUrl=/admin-dashboard.html';
    return;
  }

  document.getElementById('admin-name-display').innerText = user.full_name;

  await loadAdminAnalytics();
  await loadAllHotelsForAdmin();
});

async function loadAdminAnalytics() {
  try {
    const res = await api.get('/analytics/admin');
    if (!res.success) return;

    // Metrics
    document.getElementById('stat-admin-hotels').innerText = res.hotels.total_hotels || 0;
    document.getElementById('stat-admin-active').innerText = res.hotels.active_hotels || 0;
    document.getElementById('stat-admin-pending').innerText = res.hotels.pending_approvals || 0;
    document.getElementById('stat-admin-users').innerText = res.users.total_users || 0;
    document.getElementById('stat-admin-bookings').innerText = res.bookings.total_bookings || 0;
    document.getElementById('stat-admin-gmv').innerText = api.formatCurrency(res.bookings.platform_gmv || 0);

  } catch (err) {
    console.error('Failed to load admin metrics:', err);
  }
}

async function loadAllHotelsForAdmin() {
  const container = document.getElementById('admin-hotels-tbody');
  if (!container) return;

  try {
    const res = await api.get('/hotels/admin/all');
    if (!res.success || !res.hotels) return;

    container.innerHTML = res.hotels.map(h => {
      const isApproved = h.approval_status === 'approved';
      const isActive = h.status === 'active';

      return `
        <tr>
          <td>
            <strong>${h.name}</strong><br>
            <small class="text-muted"><i class="bi bi-geo-alt"></i> ${h.city}, ${h.state}</small>
          </td>
          <td>
            <div class="small fw-semibold">${h.owner_name}</div>
            <small class="text-muted">${h.owner_email}</small>
          </td>
          <td><span class="badge bg-gold-tint text-forest border">${h.category}</span></td>
          <td>${h.total_rooms || 0}</td>
          <td>${h.total_bookings || 0}</td>
          <td>
            <span class="badge ${isApproved ? 'bg-success' : h.approval_status === 'pending' ? 'bg-warning text-dark' : 'bg-danger'}">
              ${h.approval_status.toUpperCase()}
            </span>
          </td>
          <td>
            <span class="status-pill ${isActive ? 'status-pill-success' : 'status-pill-danger'}">
              ${h.status.toUpperCase()}
            </span>
          </td>
          <td>
            <div class="d-flex gap-1">
              ${!isApproved ? `
                <button class="btn btn-success btn-sm px-2 py-1" onclick="setApproval(${h.id}, 'approved')">Approve</button>
                <button class="btn btn-danger btn-sm px-2 py-1" onclick="setApproval(${h.id}, 'rejected')">Reject</button>
              ` : `
                <button class="btn ${isActive ? 'btn-outline-danger' : 'btn-outline-success'} btn-sm px-2 py-1" onclick="toggleActiveStatus(${h.id})">
                  ${isActive ? 'Deactivate' : 'Activate'}
                </button>
              `}
              <a href="/hotel-detail.html?id=${h.slug || h.id}" class="btn btn-outline-secondary btn-sm px-2 py-1" target="_blank">
                <i class="bi bi-eye"></i>
              </a>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load hotels for admin:', err);
  }
}

async function setApproval(hotelId, approval_status) {
  try {
    const res = await api.patch(`/hotels/admin/${hotelId}/approval`, { approval_status });
    if (res.success) {
      api.showToast(res.message, 'success');
      await loadAdminAnalytics();
      await loadAllHotelsForAdmin();
    }
  } catch (err) {
    api.showToast(err.message, 'error');
  }
}

async function toggleActiveStatus(hotelId) {
  try {
    const res = await api.patch(`/hotels/admin/${hotelId}/status`);
    if (res.success) {
      api.showToast(res.message, 'info');
      await loadAdminAnalytics();
      await loadAllHotelsForAdmin();
    }
  } catch (err) {
    api.showToast(err.message, 'error');
  }
}

