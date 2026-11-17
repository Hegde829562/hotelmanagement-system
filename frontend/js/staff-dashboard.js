// =====================================================================
// INTELLISTAY: Tailored Staff Operations Controller
// Adapts dynamically to user's assigned role (Receptionist, Housekeeping,
// Maintenance, Room Service, Kitchen, Manager, Security)
// =====================================================================

let currentStaffHotelId = 1;

document.addEventListener('DOMContentLoaded', async () => {
  const user = api.getUser();
  if (!user || user.role === 'customer') {
    window.location.href = '/login.html?returnUrl=/staff-dashboard.html';
    return;
  }

  // If user has assigned hotel from staff_info
  if (user.staff_info && user.staff_info.hotel_id) {
    currentStaffHotelId = user.staff_info.hotel_id;
    document.getElementById('staff-hotel-name-display').innerText = `${user.staff_info.hotel_name} (${user.staff_info.hotel_city})`;
  } else {
    document.getElementById('staff-hotel-name-display').innerText = 'The Glasshouse Garden Manor (Bengaluru)';
  }

  document.getElementById('staff-user-name').innerText = user.full_name;
  document.getElementById('staff-role-title').innerText = user.role.replace('_', ' ').toUpperCase();

  initStaffTabsByRole(user.role);
  await loadRoleSpecificData(user.role);
});

function initStaffTabsByRole(role) {
  // Show or hide relevant tabs based on role
  const isFrontDesk = ['receptionist', 'manager', 'admin'].includes(role);
  const isHousekeeping = ['housekeeping', 'manager', 'admin'].includes(role);
  const isMaintenance = ['maintenance', 'manager', 'admin'].includes(role);
  const isFoodService = ['room_service', 'kitchen', 'manager', 'admin'].includes(role);

  if (!isFrontDesk) document.getElementById('nav-item-frontdesk')?.remove();
  if (!isHousekeeping) document.getElementById('nav-item-housekeeping')?.remove();
  if (!isMaintenance) document.getElementById('nav-item-maintenance')?.remove();
  if (!isFoodService) document.getElementById('nav-item-service')?.remove();

  // Activate first available tab
  const firstTab = document.querySelector('#staff-tabs .nav-link');
  if (firstTab) {
    bootstrap.Tab.getOrCreateInstance(firstTab).show();
  }
}

async function loadRoleSpecificData(role) {
  if (['receptionist', 'manager', 'admin'].includes(role)) {
    await loadFrontDeskData();
  }
  if (['housekeeping', 'manager', 'admin'].includes(role)) {
    await loadHousekeepingData();
  }
  if (['maintenance', 'manager', 'admin'].includes(role)) {
    await loadMaintenanceData();
  }
  if (['room_service', 'kitchen', 'manager', 'admin'].includes(role)) {
    await loadServiceOrdersData();
  }
}

// -------------------------------------------------------------
// FRONT DESK (RECEPTIONIST)
// -------------------------------------------------------------
async function loadFrontDeskData() {
  try {
    const res = await api.get(`/staff/hotel/${currentStaffHotelId}/front-desk`);
    if (!res.success) return;

    // Arrivals
    const arrWrap = document.getElementById('frontdesk-arrivals-tbody');
    if (arrWrap) {
      if (res.arrivals.length === 0) {
        arrWrap.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">No arrivals scheduled for today.</td></tr>';
      } else {
        arrWrap.innerHTML = res.arrivals.map(b => `
          <tr>
            <td class="fw-bold">${b.booking_reference}</td>
            <td><strong>${b.guest_name}</strong><br><small class="text-muted">${b.guest_phone}</small></td>
            <td>${b.room_type_name}</td>
            <td><span class="badge bg-forest">Room ${b.room_number || 'TBD'}</span></td>
            <td>
              <button class="btn btn-forest btn-sm px-3" onclick="checkInGuest(${b.id})">Express Check-In</button>
            </td>
          </tr>
        `).join('');
      }
    }

    // Departures
    const depWrap = document.getElementById('frontdesk-departures-tbody');
    if (depWrap) {
      if (res.departures.length === 0) {
        depWrap.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">No check-outs scheduled for today.</td></tr>';
      } else {
        depWrap.innerHTML = res.departures.map(b => `
          <tr>
            <td class="fw-bold">${b.booking_reference}</td>
            <td><strong>${b.guest_name}</strong><br><small class="text-muted">${b.guest_phone}</small></td>
            <td>Room ${b.room_number}</td>
            <td><span class="status-pill status-pill-success">In-House</span></td>
            <td>
              <button class="btn btn-outline-forest btn-sm px-3" onclick="checkOutGuest(${b.id})">Check-Out & Free</button>
            </td>
          </tr>
        `).join('');
      }
    }

    // In-House Guests
    const inHouseWrap = document.getElementById('frontdesk-inhouse-tbody');
    if (inHouseWrap) {
      inHouseWrap.innerHTML = res.inHouse.map(b => `
        <tr>
          <td><span class="badge bg-light text-dark border">Room ${b.room_number}</span></td>
          <td class="fw-bold">${b.guest_name}</td>
          <td>${b.room_type_name}</td>
          <td>${api.formatDate(b.check_in_date)} to ${api.formatDate(b.check_out_date)}</td>
          <td><span class="status-pill status-pill-success">Checked In</span></td>
        </tr>
      `).join('');
    }

  } catch (err) {
    console.error('Front desk error:', err);
  }
}

async function checkInGuest(bookingId) {
  try {
    const res = await api.patch(`/bookings/${bookingId}/check-in`);
    if (res.success) {
      api.showToast(res.message, 'success');
      await loadFrontDeskData();
    }
  } catch (err) {
    api.showToast(err.message, 'error');
  }
}

async function checkOutGuest(bookingId) {
  try {
    const res = await api.patch(`/bookings/${bookingId}/check-out`);
    if (res.success) {
      api.showToast(res.message, 'success');
      await loadFrontDeskData();
      await loadHousekeepingData();
    }
  } catch (err) {
    api.showToast(err.message, 'error');
  }
}

// -------------------------------------------------------------
// HOUSEKEEPING & 24-ROOM CLEANLINESS MATRIX
// -------------------------------------------------------------
let cachedHkRooms = [];
let currentHkFilter = 'all';

async function loadHousekeepingData() {
  const matrixContainer = document.getElementById('housekeeping-room-matrix-container');
  const tasksContainer = document.getElementById('housekeeping-tasks-tbody');

  try {
    // 1. Fetch Complete 24-Room Inventory Matrix
    const matrixRes = await api.get(`/staff/hotel/${currentStaffHotelId}/room-matrix`);
    if (matrixRes.success && matrixRes.rooms) {
      cachedHkRooms = matrixRes.rooms;

      // Populate room dropdown in Report Maintenance Modal
      const mntRoomSelect = document.getElementById('mnt-room-id');
      if (mntRoomSelect) {
        mntRoomSelect.innerHTML = '<option value="">General Facility / Common Area (Lobby, Restaurant, Pool)</option>' +
          cachedHkRooms.map(r => `<option value="${r.id}">Room ${r.room_number} (Floor ${r.floor_number} - ${r.room_type_name})</option>`).join('');
      }

      // Update counters
      const totalCount = cachedHkRooms.length;
      const cleanCount = cachedHkRooms.filter(r => r.housekeeping_status === 'clean').length;
      const dirtyCount = cachedHkRooms.filter(r => r.housekeeping_status === 'dirty').length;
      const progressCount = cachedHkRooms.filter(r => r.housekeeping_status === 'in_progress').length;

      document.getElementById('hk-stat-total').innerText = totalCount;
      document.getElementById('hk-stat-clean').innerText = cleanCount;
      document.getElementById('hk-stat-dirty').innerText = dirtyCount;
      document.getElementById('hk-stat-progress').innerText = progressCount;

      renderHkRoomMatrix();
    }

    // 2. Fetch Turnover Tasks Queue
    if (tasksContainer) {
      const res = await api.get(`/staff/hotel/${currentStaffHotelId}/housekeeping`);
      if (!res.success || !res.tasks || res.tasks.length === 0) {
        tasksContainer.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">All rooms sparkling clean! No pending checkout turnover tasks.</td></tr>';
      } else {
        tasksContainer.innerHTML = res.tasks.map(t => {
          const isUrgent = t.priority === 'urgent' || t.priority === 'high';
          const isDone = t.status === 'completed';

          return `
            <tr class="${isUrgent && !isDone ? 'table-warning' : ''}">
              <td><span class="badge bg-forest fs-6">Room ${t.room_number}</span></td>
              <td>${t.floor_number}F</td>
              <td><span class="badge bg-light text-dark border text-uppercase">${t.task_type.replace('_', ' ')}</span></td>
              <td>
                <span class="badge ${isUrgent ? 'bg-danger' : 'bg-secondary'}">${t.priority.toUpperCase()}</span>
              </td>
              <td><span class="status-pill ${isDone ? 'status-pill-success' : 'status-pill-warning'}">${t.status.toUpperCase()}</span></td>
              <td class="small text-muted">${t.notes || 'Turnover sanitization'}</td>
              <td>
                ${!isDone ? `
                  <button class="btn btn-forest btn-sm px-3" onclick="completeHousekeepingTask(${t.id})">
                    <i class="bi bi-check2"></i> Mark Clean
                  </button>
                ` : `
                  <span class="text-success small fw-bold"><i class="bi bi-check-circle-fill"></i> Completed</span>
                `}
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  } catch (err) {
    console.error('Housekeeping error:', err);
  }
}

function filterHkRooms(filter) {
  currentHkFilter = filter;
  // Update button active states
  const buttons = document.querySelectorAll('#hk-filter-buttons button');
  buttons.forEach(btn => btn.classList.remove('btn-forest', 'active'));
  buttons.forEach(btn => btn.classList.add('btn-outline-secondary'));

  const activeBtn = event ? event.target : null;
  if (activeBtn) {
    activeBtn.classList.remove('btn-outline-secondary');
    activeBtn.classList.add('btn-forest', 'active');
  }

  renderHkRoomMatrix();
}

function renderHkRoomMatrix() {
  const container = document.getElementById('housekeeping-room-matrix-container');
  if (!container) return;

  let filtered = [...cachedHkRooms];
  if (currentHkFilter === 'dirty') {
    filtered = filtered.filter(r => r.housekeeping_status === 'dirty' || r.housekeeping_status === 'in_progress');
  } else if (currentHkFilter === 'floor-1') {
    filtered = filtered.filter(r => r.floor_number === 1);
  } else if (currentHkFilter === 'floor-2') {
    filtered = filtered.filter(r => r.floor_number === 2);
  } else if (currentHkFilter === 'floor-3') {
    filtered = filtered.filter(r => r.floor_number === 3);
  } else if (currentHkFilter === 'floor-4') {
    filtered = filtered.filter(r => r.floor_number === 4);
  }

  if (filtered.length === 0) {
    container.innerHTML = '<div class="col-12 text-center text-muted py-4">No rooms match the selected filter.</div>';
    return;
  }

  container.innerHTML = filtered.map(r => {
    const isClean = r.housekeeping_status === 'clean';
    const isDirty = r.housekeeping_status === 'dirty';
    const inProgress = r.housekeeping_status === 'in_progress';

    let hkBadge = '<span class="badge bg-success-subtle text-success border border-success-subtle">Clean</span>';
    if (isDirty) hkBadge = '<span class="badge bg-danger-subtle text-danger border border-danger-subtle">Dirty</span>';
    else if (inProgress) hkBadge = '<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">Cleaning</span>';

    let occBadge = `<span class="badge bg-light text-dark border text-uppercase" style="font-size: 0.65rem;">${r.status}</span>`;

    return `
      <div class="col-xl-3 col-lg-4 col-md-6">
        <div class="p-3 rounded-3 border h-100 d-flex flex-column justify-content-between" style="background-color: ${isDirty ? '#fff5f5' : (inProgress ? '#fffbf0' : '#ffffff')}; border-color: ${isDirty ? '#ffc9c9' : (inProgress ? '#ffe08a' : 'var(--border-subtle)')} !important;">
          <div>
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="fs-5 fw-bold text-forest">Room ${r.room_number}</span>
              <span class="badge bg-secondary" style="font-size: 0.68rem;">Floor ${r.floor_number}</span>
            </div>
            <div class="small text-muted text-truncate mb-2" title="${r.room_type_name}">${r.room_type_name}</div>
            <div class="d-flex gap-2 align-items-center mb-3">
              ${hkBadge}
              ${occBadge}
            </div>
          </div>
          <div class="d-flex gap-1 pt-2 border-top">
            ${!isClean ? `
              <button class="btn btn-sm btn-success flex-fill py-1 px-2" style="font-size: 0.75rem;" onclick="setRoomCleanliness(${r.id}, 'clean')">
                <i class="bi bi-check2"></i> Mark Clean
              </button>
            ` : ''}
            ${!isDirty ? `
              <button class="btn btn-sm btn-outline-danger flex-fill py-1 px-2" style="font-size: 0.75rem;" onclick="setRoomCleanliness(${r.id}, 'dirty')">
                <i class="bi bi-x-circle"></i> Mark Dirty
              </button>
            ` : ''}
            ${!inProgress ? `
              <button class="btn btn-sm btn-outline-warning text-dark flex-fill py-1 px-2" style="font-size: 0.75rem;" onclick="setRoomCleanliness(${r.id}, 'in_progress')">
                <i class="bi bi-hourglass-split"></i> In Progress
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function setRoomCleanliness(roomId, status) {
  try {
    const res = await api.patch(`/staff/room/${roomId}/housekeeping`, { housekeeping_status: status });
    if (res.success) {
      api.showToast(res.message, 'success');
      await loadHousekeepingData();
    }
  } catch (err) {
    api.showToast(err.message, 'error');
  }
}

async function completeHousekeepingTask(taskId) {
  try {
    const res = await api.patch(`/staff/housekeeping/${taskId}`, {
      status: 'completed',
      room_clean_status: 'clean'
    });
    if (res.success) {
      api.showToast('Room sanitized & marked clean in database.', 'success');
      await loadHousekeepingData();
    }
  } catch (err) {
    api.showToast(err.message, 'error');
  }
}

// -------------------------------------------------------------
// MAINTENANCE & COMPLAINTS
// -------------------------------------------------------------
let cachedMaintenanceTasks = [];
let currentMntFilter = 'all';

async function loadMaintenanceData() {
  const container = document.getElementById('maintenance-tasks-tbody');
  if (!container) return;

  try {
    const res = await api.get(`/staff/hotel/${currentStaffHotelId}/maintenance`);
    if (!res.success || !res.tasks || res.tasks.length === 0) {
      container.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">All equipment & facilities operational. No open tickets.</td></tr>';
      return;
    }

    cachedMaintenanceTasks = res.tasks;
    renderMaintenanceTable();
  } catch (err) {
    console.error('Maintenance error:', err);
  }
}

function filterMaintenanceTickets(filter) {
  currentMntFilter = filter;
  renderMaintenanceTable();
}

function renderMaintenanceTable() {
  const container = document.getElementById('maintenance-tasks-tbody');
  if (!container) return;

  let filtered = [...cachedMaintenanceTasks];
  if (currentMntFilter === 'open') {
    filtered = filtered.filter(t => t.status !== 'resolved' && t.status !== 'closed');
  } else if (currentMntFilter === 'resolved') {
    filtered = filtered.filter(t => t.status === 'resolved' || t.status === 'closed');
  }

  if (filtered.length === 0) {
    container.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No tickets match this filter.</td></tr>';
    return;
  }

  container.innerHTML = filtered.map(t => {
    const isResolved = t.status === 'resolved' || t.status === 'closed';

    return `
      <tr class="${isResolved ? 'opacity-75' : ''}">
        <td><span class="badge bg-secondary">TKT-#${t.id}</span></td>
        <td><strong>${t.room_number ? 'Room ' + t.room_number : 'General Facility'}</strong></td>
        <td><span class="badge bg-light text-dark border text-uppercase">${t.issue_category}</span></td>
        <td>
          <strong class="text-forest">${t.title}</strong><br>
          <small class="text-muted">${t.description}</small>
          ${t.resolution_notes ? `<div class="small text-success mt-1"><strong>Resolution Note:</strong> ${t.resolution_notes}</div>` : ''}
        </td>
        <td><span class="badge ${t.priority === 'emergency' ? 'bg-danger' : (t.priority === 'high' ? 'bg-warning text-dark' : 'bg-secondary')}">${t.priority.toUpperCase()}</span></td>
        <td><span class="status-pill ${isResolved ? 'status-pill-success' : 'status-pill-danger'}">${t.status.toUpperCase()}</span></td>
        <td>
          <div class="d-flex gap-1 flex-wrap">
            ${!isResolved ? `
              <button class="btn btn-outline-forest btn-sm px-2 py-1" onclick="promptResolveMaintenance(${t.id})">
                <i class="bi bi-check2-circle me-1"></i> Resolve Ticket
              </button>
              <button class="btn btn-outline-warning text-dark btn-sm px-2 py-1" onclick="markMaintenanceInProgress(${t.id})">
                <i class="bi bi-tools me-1"></i> In Progress
              </button>
            ` : `
              <span class="small text-success fw-bold d-block mb-1"><i class="bi bi-check-circle-fill"></i> Resolved</span>
              <button class="btn btn-outline-danger btn-sm px-2 py-0" style="font-size: 0.72rem;" onclick="reopenMaintenanceTicket(${t.id})">
                <i class="bi bi-arrow-counterclockwise me-1"></i> Re-open Complaint
              </button>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function markMaintenanceInProgress(taskId) {
  try {
    const res = await api.patch(`/staff/maintenance/${taskId}`, { status: 'in_progress' });
    if (res.success) {
      api.showToast('Ticket marked in progress.', 'info');
      await loadMaintenanceData();
    }
  } catch (err) {
    api.showToast(err.message, 'error');
  }
}

async function reopenMaintenanceTicket(taskId) {
  const reason = prompt('Reason for re-opening complaint (e.g. Issue recurred or guest reported unresolved defect):');
  if (!reason) return;

  try {
    const res = await api.patch(`/staff/maintenance/${taskId}/reopen`, { reason });
    if (res.success) {
      api.showToast('Complaint ticket reopened.', 'warning');
      await loadMaintenanceData();
    }
  } catch (err) {
    api.showToast(err.message, 'error');
  }
}

async function promptResolveMaintenance(taskId) {
  const notes = prompt('Enter repair and resolution notes (e.g. Replaced thermostat sensor and tested):');
  if (!notes) return;

  try {
    const res = await api.patch(`/staff/maintenance/${taskId}`, {
      status: 'resolved',
      resolution_notes: notes
    });
    if (res.success) {
      api.showToast('Maintenance ticket resolved and room returned to service.', 'success');
      await loadMaintenanceData();
    }
  } catch (err) {
    api.showToast(err.message, 'error');
  }
}

async function handleReportNewMaintenance(e) {
  e.preventDefault();
  const room_id = document.getElementById('mnt-room-id').value;
  const issue_category = document.getElementById('mnt-category').value;
  const title = document.getElementById('mnt-title').value.trim();
  const description = document.getElementById('mnt-desc').value.trim();
  const priority = document.getElementById('mnt-priority').value;

  try {
    const res = await api.post(`/staff/hotel/${currentStaffHotelId}/maintenance`, {
      room_id: room_id || null,
      issue_category,
      title,
      description,
      priority,
      mark_room_maintenance: Boolean(room_id)
    });

    if (res.success) {
      api.showToast('Maintenance ticket / complaint logged successfully.', 'success');
      e.target.reset();
      const modalEl = document.getElementById('reportMaintenanceModal');
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
      await loadMaintenanceData();
      await loadHousekeepingData();
    }
  } catch (err) {
    api.showToast(err.message, 'error');
  }
}

// -------------------------------------------------------------
// ROOM SERVICE & KITCHEN
// -------------------------------------------------------------
async function loadServiceOrdersData() {
  const container = document.getElementById('service-orders-tbody');
  if (!container) return;

  try {
    const res = await api.get(`/staff/hotel/${currentStaffHotelId}/service-orders`);
    if (!res.success || !res.orders || res.orders.length === 0) {
      container.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No active dining or room service orders.</td></tr>';
      return;
    }

    container.innerHTML = res.orders.map(o => `
      <tr>
        <td class="fw-bold">Room ${o.room_number}</td>
        <td>${o.guest_name}</td>
        <td><span class="badge bg-light text-dark border text-uppercase">${o.order_type.replace('_', ' ')}</span></td>
        <td>${o.items_description}</td>
        <td><span class="status-pill status-pill-info">${o.status.toUpperCase()}</span></td>
        <td>
          ${o.status === 'ordered' ? `
            <button class="btn btn-warning btn-sm px-2" onclick="updateOrderStatus(${o.id}, 'preparing')">Mark Preparing</button>
          ` : o.status === 'preparing' ? `
            <button class="btn btn-forest btn-sm px-2" onclick="updateOrderStatus(${o.id}, 'delivered')">Mark Delivered</button>
          ` : `
            <span class="text-success small fw-bold">Delivered</span>
          `}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Service orders error:', err);
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    const res = await api.patch(`/staff/service-orders/${orderId}`, { status });
    if (res.success) {
      api.showToast(`Order status updated to ${status}.`, 'success');
      await loadServiceOrdersData();
    }
  } catch (err) {
    api.showToast(err.message, 'error');
  }
}

