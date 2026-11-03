// =====================================================================
// INTELLISTAY: Hotel Owner Multi-Property Dashboard Controller
// =====================================================================

let ownerHotels = [];
let currentSelectedHotelId = null;
let revenueChartInstance = null;
let roomDonutChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = api.getUser();
  if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
    window.location.href = '/login.html?returnUrl=/owner-dashboard.html';
    return;
  }

  document.getElementById('owner-name-display').innerText = user.full_name;

  await loadOwnerHotels();
  initSidebarNavigation();
});

function initSidebarNavigation() {
  document.querySelectorAll('.sidebar-link[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      const target = link.getAttribute('data-section');
      document.querySelectorAll('.dashboard-section').forEach(sec => sec.style.display = 'none');
      const targetSec = document.getElementById(`sec-${target}`);
      if (targetSec) targetSec.style.display = 'block';
    });
  });
}

async function loadOwnerHotels() {
  try {
    const res = await api.get('/hotels/owner/my-hotels');
    if (!res.success) return;

    ownerHotels = res.hotels || [];

    const switcher = document.getElementById('property-switcher-select');
    if (switcher) {
      if (ownerHotels.length === 0) {
        switcher.innerHTML = '<option value="">No properties registered</option>';
      } else {
        switcher.innerHTML = `
          <option value="all">All Managed Properties (${ownerHotels.length})</option>
          ${ownerHotels.map(h => `<option value="${h.id}">${h.name} (${h.city})</option>`).join('')}
        `;
        currentSelectedHotelId = 'all';
      }

      switcher.addEventListener('change', () => {
        currentSelectedHotelId = switcher.value;
        refreshOwnerDashboard();
      });
    }

    await refreshOwnerDashboard();
    renderHotelsListTable();
    await loadMasterAmenitiesForModal();

  } catch (err) {
    console.error('Failed to load owner properties:', err);
  }
}

async function refreshOwnerDashboard() {
  await loadOwnerAnalytics();
  await loadOwnerBookingsTable();
  await loadRoomsGrid();
  await loadStaffRoster();
}

async function loadOwnerAnalytics() {
  try {
    const params = currentSelectedHotelId && currentSelectedHotelId !== 'all' ? { hotelId: currentSelectedHotelId } : {};
    const res = await api.get('/analytics/owner', params);

    if (!res.success || !res.summary) return;
    const s = res.summary;

    document.getElementById('stat-revenue').innerText = api.formatCurrency(s.totalRevenue);
    document.getElementById('stat-occupancy').innerText = `${s.occupancyRate}%`;
    document.getElementById('stat-arrivals').innerText = s.todayArrivals;
    document.getElementById('stat-departures').innerText = s.todayDepartures;
    document.getElementById('stat-cleaning').innerText = s.cleaningRooms;
    document.getElementById('stat-maintenance').innerText = s.pendingMaintenance;

    // Render Chart.js
    renderRevenueChart(res.revenueTrend || []);
    renderRoomDonutChart(res.roomStatusBreakdown || []);

  } catch (err) {
    console.error('Failed to load analytics:', err);
  }
}

function renderRevenueChart(trend) {
  const ctx = document.getElementById('revenueChart');
  if (!ctx || typeof Chart === 'undefined') return;

  if (revenueChartInstance) {
    revenueChartInstance.destroy();
  }

  const labels = trend.length > 0 ? trend.map(t => api.formatDate(t.booking_date)) : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const data = trend.length > 0 ? trend.map(t => t.daily_revenue) : [12000, 19500, 24000, 18000, 32000, 45000, 38000];

  revenueChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Daily Revenue (₹)',
        data,
        borderColor: '#1B382B',
        backgroundColor: 'rgba(27, 56, 43, 0.08)',
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointBackgroundColor: '#C5A880',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: (val) => '₹' + val.toLocaleString('en-IN') }
        }
      }
    }
  });
}

function renderRoomDonutChart(breakdown) {
  const ctx = document.getElementById('roomDonutChart');
  if (!ctx || typeof Chart === 'undefined') return;

  if (roomDonutChartInstance) {
    roomDonutChartInstance.destroy();
  }

  roomDonutChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: breakdown.map(b => b.label),
      datasets: [{
        data: breakdown.map(b => b.value),
        backgroundColor: breakdown.map(b => b.color),
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
      },
      cutout: '70%'
    }
  });
}

async function loadOwnerBookingsTable() {
  const container = document.getElementById('owner-bookings-tbody');
  if (!container) return;

  const targetId = (currentSelectedHotelId && currentSelectedHotelId !== 'all') 
    ? currentSelectedHotelId 
    : (ownerHotels.length > 0 ? ownerHotels[0].id : null);

  if (!targetId) {
    container.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No hotel selected.</td></tr>';
    return;
  }

  try {
    const res = await api.get(`/bookings/hotel/${targetId}`);
    if (!res.success || !res.bookings || res.bookings.length === 0) {
      container.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No reservations on file for this property.</td></tr>';
      return;
    }

    container.innerHTML = res.bookings.map(b => `
      <tr>
        <td class="fw-bold text-forest">${b.booking_reference}</td>
        <td>
          <div class="fw-semibold">${b.guest_name}</div>
          <small class="text-muted">${b.guest_phone || b.guest_email}</small>
        </td>
        <td>${b.room_type_name || 'Deluxe'}</td>
        <td><span class="badge bg-light text-dark border">Room ${b.assigned_room_number || 'TBD'}</span></td>
        <td>
          <small class="d-block">${api.formatDate(b.check_in_date)}</small>
          <small class="text-muted">to ${api.formatDate(b.check_out_date)}</small>
        </td>
        <td class="fw-bold text-forest">${api.formatCurrency(b.final_amount)}</td>
        <td>
          ${b.booking_status === 'confirmed' ? `
            <button class="btn btn-forest btn-sm px-2 py-1" onclick="handleFrontDeskCheckIn(${b.id})">
              Check-In
            </button>
          ` : b.booking_status === 'checked_in' ? `
            <button class="btn btn-outline-forest btn-sm px-2 py-1" onclick="handleFrontDeskCheckOut(${b.id})">
              Check-Out
            </button>
          ` : `
            <span class="status-pill status-pill-info">${b.booking_status.toUpperCase()}</span>
          `}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load bookings:', err);
  }
}

async function loadRoomsGrid() {
  const container = document.getElementById('rooms-status-grid-container');
  if (!container) return;

  const targetId = (currentSelectedHotelId && currentSelectedHotelId !== 'all') 
    ? currentSelectedHotelId 
    : (ownerHotels.length > 0 ? ownerHotels[0].id : null);

  if (!targetId) {
    container.innerHTML = '<div class="col-12 text-muted text-center py-4">Please select a specific hotel to view room status grid.</div>';
    return;
  }

  try {
    const res = await api.get(`/rooms/hotel/${targetId}`);
    if (!res.success || !res.rooms || res.rooms.length === 0) {
      container.innerHTML = '<div class="col-12 text-muted text-center py-4">No physical rooms found.</div>';
      return;
    }

    container.innerHTML = res.rooms.map(r => `
      <div class="room-tile ${r.status}" onclick="openUpdateRoomModal(${r.id}, '${r.room_number}', '${r.status}', '${r.housekeeping_status}', '${r.room_type_name.replace(/'/g, "\\'")}', ${r.floor_number})">
        <div class="room-tile-num">${r.room_number}</div>
        <div class="room-tile-type">${r.room_type_name}</div>
        <span class="room-status-badge">${r.status}</span>
        <div class="small text-muted mt-1" style="font-size: 0.68rem;">HK: ${r.housekeeping_status}</div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load rooms:', err);
  }
}

function openUpdateRoomModal(roomId, roomNumber, curStatus, curHk, roomTypeName, floorNumber) {
  document.getElementById('edit-room-id').value = roomId;
  document.getElementById('edit-room-number-display').innerText = `Room ${roomNumber}`;
  document.getElementById('edit-room-type-display').innerText = `${roomTypeName} • Floor ${floorNumber}`;
  document.getElementById('edit-room-status').value = curStatus;
  document.getElementById('edit-room-hk').value = curHk;

  const badge = document.getElementById('edit-room-current-badge');
  badge.innerText = curStatus.toUpperCase();

  const modal = new bootstrap.Modal(document.getElementById('updateRoomModal'));
  modal.show();
}

async function handleSaveRoomStatus(e) {
  e.preventDefault();
  const roomId = document.getElementById('edit-room-id').value;
  const status = document.getElementById('edit-room-status').value;
  const housekeeping_status = document.getElementById('edit-room-hk').value;

  try {
    const res = await api.patch(`/rooms/room/${roomId}/status`, {
      status,
      housekeeping_status
    });

    if (res.success) {
      api.showToast(res.message, 'success');
      const modal = bootstrap.Modal.getInstance(document.getElementById('updateRoomModal'));
      modal.hide();
      await loadRoomsGrid();
      await loadOwnerAnalytics();
    }
  } catch (err) {
    api.showToast(err.message, 'error');
  }
}

async function handleFrontDeskCheckIn(bookingId) {
  try {
    const res = await api.patch(`/bookings/${bookingId}/check-in`);
    if (res.success) {
      api.showToast(res.message, 'success');
      await refreshOwnerDashboard();
    }
  } catch (err) {
    api.showToast(err.message, 'error');
  }
}

async function handleFrontDeskCheckOut(bookingId) {
  try {
    const res = await api.patch(`/bookings/${bookingId}/check-out`);
    if (res.success) {
      api.showToast(res.message, 'success');
      await refreshOwnerDashboard();
    }
  } catch (err) {
    api.showToast(err.message, 'error');
  }
}

function renderHotelsListTable() {
  const container = document.getElementById('owner-hotels-tbody');
  if (!container) return;

  container.innerHTML = ownerHotels.map(h => `
    <tr>
      <td class="fw-bold text-forest">
        <img src="${h.primary_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=120&q=80'}" class="rounded-2 me-2" style="width: 44px; height: 32px; object-fit: cover;">
        ${h.name}
      </td>
      <td><span class="badge bg-gold-tint text-forest border">${h.category}</span></td>
      <td>${h.city}, ${h.state}</td>
      <td class="fw-bold text-forest">${api.formatCurrency(h.base_price_per_night)}</td>
      <td>${h.total_rooms || 0} Rooms</td>
      <td><span class="badge bg-success-subtle text-success">${h.status.toUpperCase()}</span></td>
      <td>
        <a href="/hotel-detail.html?id=${h.slug || h.id}" class="btn btn-outline-forest btn-sm px-2 py-1" target="_blank">View Live</a>
      </td>
    </tr>
  `).join('');
}

async function loadStaffRoster() {
  const container = document.getElementById('owner-staff-tbody');
  if (!container) return;

  const targetId = (currentSelectedHotelId && currentSelectedHotelId !== 'all') 
    ? currentSelectedHotelId 
    : (ownerHotels.length > 0 ? ownerHotels[0].id : null);

  if (!targetId) {
    container.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">Select a hotel to view staff roster.</td></tr>';
    return;
  }

  try {
    const res = await api.get(`/staff/hotel/${targetId}`);
    if (!res.success || !res.staff || res.staff.length === 0) {
      container.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No staff members currently registered for this property.</td></tr>';
      return;
    }

    container.innerHTML = res.staff.map(s => {
      const isActive = s.is_active === 1 || s.is_active === true;
      return `
        <tr>
          <td class="fw-bold text-forest">${s.employee_code}</td>
          <td>
            <div class="fw-semibold">${s.full_name}</div>
            <small class="text-muted">${s.email}</small>
          </td>
          <td><span class="badge bg-forest text-uppercase">${s.role.replace('_', ' ')}</span></td>
          <td>${s.department}</td>
          <td>${s.shift} Shift</td>
          <td>
            <span class="status-pill ${isActive ? 'status-pill-success' : 'status-pill-danger'}">
              ${isActive ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td>
            <div class="d-flex gap-1">
              <button class="btn btn-outline-forest btn-sm py-1 px-2" onclick="openEditStaffModal(${s.id}, '${s.full_name.replace(/'/g, "\\'")}', '${s.role}', '${s.department}', '${s.shift}', ${s.salary || 25000}, ${isActive ? 1 : 0})">
                <i class="bi bi-pencil me-1"></i>Edit
              </button>
              <button class="btn ${isActive ? 'btn-outline-warning' : 'btn-outline-success'} btn-sm py-1 px-2" onclick="handleToggleStaffStatus(${s.id})">
                ${isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load staff roster:', err);
  }
}

function openEditStaffModal(staffId, fullName, role, department, shift, salary, isActive) {
  document.getElementById('edit-staff-id').value = staffId;
  document.getElementById('edit-staff-name').value = fullName;
  document.getElementById('edit-staff-role').value = role;
  document.getElementById('edit-staff-dept').value = department;
  document.getElementById('edit-staff-shift').value = shift;
  document.getElementById('edit-staff-salary').value = salary;
  document.getElementById('edit-staff-status').value = isActive ? '1' : '0';

  const modal = new bootstrap.Modal(document.getElementById('editStaffModal'));
  modal.show();
}

async function handleSaveStaffChanges(e) {
  e.preventDefault();
  const staffId = document.getElementById('edit-staff-id').value;
  const full_name = document.getElementById('edit-staff-name').value.trim();
  const role = document.getElementById('edit-staff-role').value;
  const department = document.getElementById('edit-staff-dept').value;
  const shift = document.getElementById('edit-staff-shift').value;
  const salary = parseFloat(document.getElementById('edit-staff-salary').value);
  const is_active = parseInt(document.getElementById('edit-staff-status').value, 10);

  try {
    const res = await api.put(`/staff/member/${staffId}`, {
      full_name,
      role,
      department,
      shift,
      salary,
      is_active
    });

    if (res.success) {
      api.showToast(res.message, 'success');
      const modal = bootstrap.Modal.getInstance(document.getElementById('editStaffModal'));
      modal.hide();
      await loadStaffRoster();
    }
  } catch (err) {
    api.showToast(err.message, 'error');
  }
}

async function handleToggleStaffStatus(staffId) {
  try {
    const res = await api.patch(`/staff/member/${staffId}/status`);
    if (res.success) {
      api.showToast(res.message, 'info');
      await loadStaffRoster();
    }
  } catch (err) {
    api.showToast(err.message, 'error');
  }
}

async function loadMasterAmenitiesForModal() {
  const container = document.getElementById('new-hotel-amenities-container');
  if (!container) return;

  try {
    const res = await api.get('/hotels/amenities/all');
    if (res.success && res.amenities) {
      container.innerHTML = res.amenities.map(a => `
        <div class="col-md-4 col-6">
          <div class="form-check">
            <input class="form-check-input new-hotel-amen-check" type="checkbox" value="${a.id}" id="amen-modal-${a.id}">
            <label class="form-check-label small" for="amen-modal-${a.id}">${a.name}</label>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {}
}

async function handleCreateNewHotel(e) {
  e.preventDefault();

  const name = document.getElementById('new-hotel-name').value.trim();
  const category = document.getElementById('new-hotel-category').value;
  const base_price_per_night = document.getElementById('new-hotel-price').value;
  const city = document.getElementById('new-hotel-city').value.trim();
  const state = document.getElementById('new-hotel-state').value.trim();
  const address = document.getElementById('new-hotel-address').value.trim();
  const pincode = document.getElementById('new-hotel-pincode').value.trim();
  const description = document.getElementById('new-hotel-description').value.trim();
  const primary_image_url = document.getElementById('new-hotel-image').value.trim();

  const selectedAmenities = [];
  document.querySelectorAll('.new-hotel-amen-check:checked').forEach(cb => {
    selectedAmenities.push(parseInt(cb.value, 10));
  });

  try {
    const res = await api.post('/hotels/owner/create', {
      name,
      category,
      base_price_per_night,
      city,
      state,
      address,
      pincode,
      description,
      primary_image_url,
      amenities: selectedAmenities
    });

    if (res.success) {
      api.showToast('Hotel created successfully with initialized room inventory!', 'success');
      const modal = bootstrap.Modal.getInstance(document.getElementById('addHotelModal'));
      modal.hide();
      await loadOwnerHotels();
    }
  } catch (err) {
    api.showToast(err.message, 'error');
  }
}

async function handleRegisterNewStaff(e) {
  e.preventDefault();

  const targetId = (currentSelectedHotelId && currentSelectedHotelId !== 'all') 
    ? currentSelectedHotelId 
    : (ownerHotels.length > 0 ? ownerHotels[0].id : null);

  if (!targetId) {
    api.showToast('Please select a specific hotel to assign this employee to.', 'warning');
    return;
  }

  const full_name = document.getElementById('staff-full-name').value.trim();
  const email = document.getElementById('staff-email').value.trim();
  const phone = document.getElementById('staff-phone').value.trim();
  const role = document.getElementById('staff-role').value;
  const department = document.getElementById('staff-dept').value;
  const shift = document.getElementById('staff-shift').value;
  const salary = document.getElementById('staff-salary').value;

  try {
    const res = await api.post(`/staff/hotel/${targetId}/add`, {
      full_name,
      email,
      phone,
      role,
      department,
      shift,
      salary
    });

    if (res.success) {
      api.showToast(res.message, 'success');
      const modal = bootstrap.Modal.getInstance(document.getElementById('addStaffModal'));
      modal.hide();
      await loadStaffRoster();
    }
  } catch (err) {
    api.showToast(err.message, 'error');
  }
}

