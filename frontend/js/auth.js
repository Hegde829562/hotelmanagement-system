// =====================================================================
// INTELLISTAY: Auth State & Dynamic Navbar Controller
// =====================================================================

document.addEventListener('DOMContentLoaded', () => {
  renderNavbarAuth();
});

function renderNavbarAuth() {
  const authContainer = document.getElementById('navbar-auth-container');
  if (!authContainer) return;

  const user = api.getUser();
  const token = api.getToken();

  if (user && token) {
    let dashboardUrl = '/customer-dashboard.html';
    let roleBadge = '';

    if (user.role === 'owner') {
      dashboardUrl = '/owner-dashboard.html';
      roleBadge = '<span class="badge bg-warning text-dark me-2">Owner</span>';
    } else if (user.role === 'admin') {
      dashboardUrl = '/admin-dashboard.html';
      roleBadge = '<span class="badge bg-danger me-2">Admin</span>';
    } else if (['manager', 'receptionist', 'housekeeping', 'maintenance', 'room_service', 'security', 'kitchen'].includes(user.role)) {
      dashboardUrl = '/staff-dashboard.html';
      const roleCapitalized = user.role.replace('_', ' ').toUpperCase();
      roleBadge = `<span class="badge bg-info text-dark me-2">${roleCapitalized}</span>`;
    } else {
      roleBadge = `<span class="badge bg-light text-dark border me-2"><i class="bi bi-gem text-warning me-1"></i>${user.loyalty_points || 0} pts</span>`;
    }

    const avatarUrl = user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80';

    authContainer.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        ${roleBadge}
        <div class="dropdown">
          <button class="btn btn-outline-forest dropdown-toggle d-flex align-items-center gap-2 py-1 px-3" type="button" data-bs-toggle="dropdown">
            <img src="${avatarUrl}" class="rounded-circle" style="width: 28px; height: 28px; object-fit: cover;">
            <span class="d-none d-md-inline font-weight-600">${user.full_name.split(' ')[0]}</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 py-2" style="border-radius: 12px; min-width: 200px;">
            <li class="px-3 py-2 border-bottom">
              <div class="fw-bold text-forest">${user.full_name}</div>
              <small class="text-muted">${user.email}</small>
            </li>
            <li><a class="dropdown-item py-2" href="${dashboardUrl}"><i class="bi bi-speedometer2 me-2 text-olive"></i>Dashboard</a></li>
            ${user.role === 'customer' ? '<li><a class="dropdown-item py-2" href="/customer-dashboard.html?tab=wishlist"><i class="bi bi-heart me-2 text-danger"></i>Saved Stays</a></li>' : ''}
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item py-2 text-danger" href="javascript:void(0)" onclick="handleLogout()"><i class="bi bi-box-arrow-right me-2"></i>Sign Out</a></li>
          </ul>
        </div>
      </div>
    `;
  } else {
    authContainer.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        <a href="/login.html" class="btn btn-outline-forest btn-sm px-3">Sign In</a>
        <a href="/register.html" class="btn btn-forest btn-sm px-3">Register</a>
      </div>
    `;
  }
}

async function handleLogout() {
  try {
    await api.post('/auth/logout');
  } catch (e) {}
  api.clearAuth();
  api.showToast('You have been signed out.', 'info');
  setTimeout(() => {
    window.location.href = '/index.html';
  }, 500);
}

// Redirect based on role
function redirectUserByRole(role) {
  if (role === 'owner') {
    window.location.href = '/owner-dashboard.html';
  } else if (role === 'admin') {
    window.location.href = '/admin-dashboard.html';
  } else if (['manager', 'receptionist', 'housekeeping', 'maintenance', 'room_service', 'security', 'kitchen'].includes(role)) {
    window.location.href = '/staff-dashboard.html';
  } else {
    // Check if there was a return url
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get('returnUrl');
    window.location.href = returnUrl || '/customer-dashboard.html';
  }
}

