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
// HOUSEKEEPING
// -------------------------------------------------------------
async function loadHousekeepingData() {
  const container = document.getElementById('housekeeping-tasks-tbody');
  if (!container) return;

  try {
    const res = await api.get(`/staff/hotel/${currentStaffHotelId}/housekeeping`);
    if (!res.success || !res.tasks || res.tasks.length === 0) {
      container.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">All rooms sparkling clean! No pending cleaning tasks.</td></tr>';
      return;
    }

    container.innerHTML = res.tasks.map(t => {
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
          <td class="small text-muted">${t.notes || 'Routine cleaning'}</td>
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
  } catch (err) {
    console.error('Housekeeping error:', err);
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
// MAINTENANCE
// -------------------------------------------------------------
async function loadMaintenanceData() {
  const container = document.getElementById('maintenance-tasks-tbody');
  if (!container) return;

  try {
    const res = await api.get(`/staff/hotel/${currentStaffHotelId}/maintenance`);
    if (!res.success || !res.tasks || res.tasks.length === 0) {
      container.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">All equipment & facilities operational. No open tickets.</td></tr>';
      return;
    }

    container.innerHTML = res.tasks.map(t => {
      const isResolved = t.status === 'resolved' || t.status === 'closed';

      return `
        <tr>
          <td><span class="badge bg-secondary">TKT-#${t.id}</span></td>
          <td><strong>Room ${t.room_number || 'General Facility'}</strong></td>
          <td><span class="badge bg-light text-dark border text-uppercase">${t.issue_category}</span></td>
          <td>
            <strong>${t.title}</strong><br>
            <small class="text-muted">${t.description}</small>
          </td>
          <td><span class="badge ${t.priority === 'emergency' ? 'bg-danger' : 'bg-warning text-dark'}">${t.priority.toUpperCase()}</span></td>
          <td><span class="status-pill ${isResolved ? 'status-pill-success' : 'status-pill-danger'}">${t.status.toUpperCase()}</span></td>
          <td>
            ${!isResolved ? `
              <button class="btn btn-outline-forest btn-sm px-2" onclick="promptResolveMaintenance(${t.id})">
                Resolve Issue
              </button>
            ` : `
              <span class="small text-success fw-bold"><i class="bi bi-check-circle"></i> Resolved</span>
            `}
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Maintenance error:', err);
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
      mark_room_maintenance: true
    });

    if (res.success) {
      api.showToast('Maintenance ticket logged successfully.', 'success');
      const modal = bootstrap.Modal.getInstance(document.getElementById('reportMaintenanceModal'));
      modal.hide();
      await loadMaintenanceData();
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

