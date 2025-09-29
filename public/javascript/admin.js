// admin.js - Enhanced Admin Panel JavaScript
document.addEventListener("DOMContentLoaded", () => {
  // Initialize the admin panel
  init();
});

// ======== Helpers & UI ========
function showSection(id, element) {
  document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
  document.getElementById(id).style.display = 'block';

  document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
  element.classList.add('active');
}

function showAlert(message) {
  alert(message);
}

function showConfirm(message, callback) {
  if (confirm(message)) {
    callback();
  }
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

// ======== FORTS ========
async function loadForts() {
  try {
    const res = await fetch('/api/forts');
    if (!res.ok) throw new Error('Failed to fetch forts');
    const forts = await res.json();
    const tbody = document.querySelector('#fortsTable tbody');
    if (tbody) {
      tbody.innerHTML = '';
      forts.forEach(f => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
        <td>${f.image_url ? `<img src="${f.image_url}" alt="${escapeHtml(f.name)}" style="width: 50px; height: 50px; object-fit: cover;" />` : 'No Image'}</td>
        <td>${escapeHtml(f.name)}</td>
        <td>${escapeHtml(f.location || '')}</td>
        <td>${escapeHtml(f.difficulty || '')}</td>
        <td>
            <button onclick="showEditFort(${f.id})">Edit</button>
            <button onclick="deleteFort(${f.id})" class="btn-delete">Delete</button>
        </td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (error) {
    console.error('Error loading forts:', error);
    showAlert('Error: ' + error.message);
  }
}

// Add Fort Form
document.addEventListener('DOMContentLoaded', () => {
  const addFortForm = document.getElementById('addFortForm');
  if (addFortForm) {
    addFortForm.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const res = await fetch('/api/forts', { method: 'POST', body: fd });
        if (res.ok) { 
          showAlert('Fort added successfully'); 
          e.target.reset(); 
          loadForts(); 
        } else { 
          showAlert('Error adding fort'); 
        }
      } catch (error) {
        console.error('Error adding fort:', error);
        showAlert('Error adding fort');
      }
    });
  }
});

async function showEditFort(id) {
  try {
    const res = await fetch('/api/forts/' + id);
    if (!res.ok) { showAlert('Fort not found'); return; }
    const f = await res.json();
    const card = document.getElementById('editFortCard');
    const form = document.getElementById('editFortForm');
    if (card && form) {
      card.style.display = 'block';
      form.id.value = f.id;
      form.name.value = f.name;
      form.description.value = f.description || '';
      form.location.value = f.location || '';
      form.difficulty.value = f.difficulty || '';
      const preview = document.getElementById('editFortImagePreview');
      if (preview) preview.src = f.image_url || '';
      form.existing_image_url = f.image_url || '';
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } catch (error) {
    console.error('Error loading fort for edit:', error);
    showAlert('Error loading fort');
  }
}

function hideEditFort() {
  const card = document.getElementById('editFortCard');
  const form = document.getElementById('editFortForm');
  if (card) card.style.display = 'none';
  if (form) form.reset();
}

function deleteFort(id) {
  showConfirm('Are you sure you want to delete this fort?', async () => {
    try {
      const res = await fetch('/api/forts/' + id, { method: 'DELETE' });
      if (res.ok) { 
        showAlert('Fort deleted'); 
        loadForts(); 
      } else { 
        showAlert('Error deleting fort'); 
      }
    } catch (error) {
      console.error('Error deleting fort:', error);
      showAlert('Error deleting fort');
    }
  });
}

// ======== PACKAGES ========
async function loadPackages() {
  try {
    const res = await fetch('/api/packages');
    if (!res.ok) throw new Error('Failed to fetch packages');
    const packs = await res.json();
    const tbody = document.querySelector('#packagesTable tbody');
    if (tbody) {
      tbody.innerHTML = '';
      packs.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
        <td>${p.image_url ? `<img src="${p.image_url}" alt="${escapeHtml(p.name)}" style="width: 50px; height: 50px; object-fit: cover;" />` : 'No Image'}</td>
        <td>${escapeHtml(p.name)}</td>
        <td>₹${escapeHtml(p.price || '')}</td>
        <td>${escapeHtml(p.season || '')}</td>
        <td>${escapeHtml(p.base_village || '')}</td>
        <td>${escapeHtml(p.difficulty || '')}</td>
        <td>
            <button onclick="showEditPackage(${p.id})">Edit</button>
            <button onclick="deletePackage(${p.id})" class="btn-delete">Delete</button>
        </td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (error) {
    console.error('Error loading packages:', error);
    showAlert('Error: ' + error.message);
  }
}

// Add Package Form
document.addEventListener('DOMContentLoaded', () => {
  const addPackageForm = document.getElementById('addPackageForm');
  if (addPackageForm) {
    addPackageForm.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const res = await fetch('/api/packages', { method: 'POST', body: fd,credentials: 'include' });
        if (res.ok) { 
          showAlert('Package added successfully'); 
          e.target.reset(); 
          loadPackages(); 
        } else { 
          showAlert('Error adding package'); 
        }
      } catch (error) {
        console.error('Error adding package:', error);
        showAlert('Error adding package');
      }
    });
  }

  // Edit Fort Form
  const editFortForm = document.getElementById('editFortForm');
  if (editFortForm) {
    editFortForm.addEventListener('submit', async e => {
      e.preventDefault();
      const form = e.target;
      const id = form.id.value;
      const fd = new FormData(form);
      if (!fd.get('image') || fd.get('image').size === 0) {
        fd.append('existing_image_url', form.existing_image_url || '');
      }
      try {
        const res = await fetch('/api/forts/' + id, { method: 'PUT', body: fd });
        if (res.ok) { 
          showAlert('Fort updated successfully'); 
          hideEditFort(); 
          loadForts(); 
        } else { 
          showAlert('Error updating fort'); 
        }
      } catch (error) {
        console.error('Error updating fort:', error);
        showAlert('Error updating fort');
      }
    });
  }

  // Edit Package Form
  const editPackageForm = document.getElementById('editPackageForm');
  if (editPackageForm) {
    editPackageForm.addEventListener('submit', async e => {
      e.preventDefault();
      const form = e.target;
      const id = form.id.value;
      const fd = new FormData(form);
      if (!fd.get('image') || fd.get('image').size === 0) {
        fd.append('existing_image_url', form.existing_image_url || '');
      }
      try {
        const res = await fetch('/api/packages/' + id, { method: 'PUT', body: fd });
        if (res.ok) { 
          showAlert('Package updated successfully'); 
          hideEditPackage(); 
          loadPackages(); 
        } else { 
          showAlert('Error updating package'); 
        }
      } catch (error) {
        console.error('Error updating package:', error);
        showAlert('Error updating package');
      }
    });
  }
});

async function showEditPackage(id) {
  try {
    const res = await fetch('/api/packages/' + id);
    if (!res.ok) { showAlert('Package not found'); return; }
    const p = await res.json();
    const card = document.getElementById('editPackageCard');
    const form = document.getElementById('editPackageForm');
    if (card && form) {
      card.style.display = 'block';
      form.id.value = p.id;
      form.name.value = p.name;
      form.price.value = p.price || '';
      form.itinerary.value = p.itinerary || '';
      form.season.value = p.season || '';
      form.base_village.value = p.base_village || '';
      form.difficulty.value = p.difficulty || '';
      const preview = document.getElementById('editPackageImagePreview');
      if (preview) preview.src = p.image_url || '';
      form.existing_image_url = p.image_url || '';
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } catch (error) {
    console.error('Error loading package for edit:', error);
    showAlert('Error loading package');
  }
}

function hideEditPackage() {
  const card = document.getElementById('editPackageCard');
  const form = document.getElementById('editPackageForm');
  if (card) card.style.display = 'none';
  if (form) form.reset();
}

function deletePackage(id) {
  showConfirm('Are you sure you want to delete this package?', async () => {
    try {
      const res = await fetch('/api/packages/' + id, { method: 'DELETE' });
      if (res.ok) { 
        showAlert('Package deleted'); 
        loadPackages(); 
      } else { 
        showAlert('Error deleting package'); 
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      showAlert('Error deleting package');
    }
  });
}

// ======== BOOKINGS ========
async function loadBookings() {
  try {
    const res = await fetch('/api/bookings', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch bookings');
    const bookings = await res.json();
    const tbody = document.querySelector('#bookingsTable tbody');
    if (tbody) {
      tbody.innerHTML = '';
      bookings.forEach(b => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
        <td>${escapeHtml(b.package_name || 'Package ' + b.package_id || 'N/A')}</td>
        <td>${escapeHtml(b.fullname || '')}</td>
        <td>${escapeHtml(b.email || '')}</td>
        <td>${escapeHtml(b.phone || '')}</td>
        <td>${escapeHtml(b.participants || '')}</td>
        <td>${escapeHtml(b.message || '')}</td>
        <td><span class="status status-${(b.status || 'pending').toLowerCase()}">${escapeHtml(b.status || 'Pending')}</span></td>
        <td>
            <button onclick="updateBooking(${b.id}, 'Confirmed')" class="btn-approve">Confirm</button>
            <button onclick="updateBooking(${b.id}, 'Cancelled')" class="btn-reject">Cancel</button>
            <button onclick="deleteBooking(${b.id})" class="btn-delete">Delete</button>
        </td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (error) {
    console.error('Error loading bookings:', error);
    showAlert('Error: ' + error.message);
  }
}

// Update Booking Status
async function updateBooking(id, status) {
  try {
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials:'include',
      body: JSON.stringify({ status:"Approved" })
    });
    if (res.ok) {
      showAlert(`Booking ${status}`);
      loadBookings();
    } else {
      showAlert('Error updating booking');
    }
  } catch (error) {
    console.error('Error updating booking:', error);
    showAlert('Error updating booking');
  }
}

// Delete Booking
async function deleteBooking(id) {
  showConfirm('Are you sure you want to delete this booking?', async () => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "DELETE",
        credentials:'include'
      });
      if (res.ok) {
        showAlert('Booking deleted');
        loadBookings();
      } else {
        showAlert('Error deleting booking');
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      showAlert('Error deleting booking');
    }
  });
}

// ======== LOGOUT FUNCTIONALITY ========
async function handleLogout() {
  try {
    // Call logout endpoint
    const response = await fetch('/auth/logout', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      // Clear any stored data
      localStorage.removeItem('userToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('hasPurchasedPackage');
      
      // Show success message
      alert('Logged out successfully!');
      
      // Redirect to home page
      window.location.href = '/index.html';
    } else {
      // Even if server logout fails, clear local data
      localStorage.removeItem('userToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('hasPurchasedPackage');
      
      alert('Logged out locally. Please refresh the page.');
      window.location.href = '/index.html';
    }
  } catch (error) {
    console.error('Logout error:', error);
    
    // Clear local data even if server call fails
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('hasPurchasedPackage');
    
    alert('Logged out locally. Please refresh the page.');
    window.location.href = '/index.html';
  }
}

// Make handleLogout globally available
window.handleLogout = handleLogout;

// ======== INITIALIZATION ========
async function init() {
  try {
    // Set default section on page load
    const activeButton = document.querySelector('nav button.active');
    if (activeButton) {
      activeButton.click();
    }
    
    // Load initial data
    await loadForts();
    await loadPackages();
    await loadBookings();
    
    console.log('Admin panel initialized successfully');
  } catch (error) {
    console.error('Error initializing admin panel:', error);
  }
}
