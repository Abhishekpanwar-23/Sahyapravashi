// session.js - Session management and logout functionality
document.addEventListener("DOMContentLoaded", () => {
  checkLoginStatus();
  setupLogoutButton();
});

// Check if user is logged in and update UI accordingly
async function checkLoginStatus() {
  try {
    // First check if we have stored login info
    const hasUserToken = localStorage.getItem('userToken');
    const hasUserRole = localStorage.getItem('userRole');
    
    // If we have stored info, show logout button
    if (hasUserToken && hasUserRole) {
      updateLoginUI(true);
      return;
    }
    
    // Otherwise, check with server to verify session
    const response = await fetch('/auth/check-session', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.loggedIn) {
        // Store user info in localStorage
        localStorage.setItem('userToken', 'logged_in');
        localStorage.setItem('userRole', data.role || 'user');
        updateLoginUI(true);
      } else {
        updateLoginUI(false);
      }
    } else {
      updateLoginUI(false);
    }
  } catch (error) {
    console.error('Error checking login status:', error);
    updateLoginUI(false);
  }
}

// Update the login/logout UI
function updateLoginUI(isLoggedIn) {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  
  if (loginBtn && logoutBtn) {
    if (isLoggedIn) {
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'inline-block';
      console.log('User is logged in, showing logout button');
    } else {
      loginBtn.style.display = 'inline-block';
      logoutBtn.style.display = 'none';
      console.log('User is not logged in, showing login button');
    }
  } else {
    console.log('Login/logout buttons not found on this page');
  }
}

// Setup logout button functionality
function setupLogoutButton() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

// Handle logout
async function handleLogout(e) {
  e.preventDefault();
  
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
      
      // Update UI immediately
      updateLoginUI(false);
      
      // Show success message
      alert('Logged out successfully!');
      
      // Redirect to home page
      window.location.href = '/index.html';
    } else {
      // Even if server logout fails, clear local data
      localStorage.removeItem('userToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('hasPurchasedPackage');
      updateLoginUI(false);
      
      alert('Logged out locally. Please refresh the page.');
      window.location.href = '/index.html';
    }
  } catch (error) {
    console.error('Logout error:', error);
    
    // Clear local data even if server call fails
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('hasPurchasedPackage');
    updateLoginUI(false);
    
    alert('Logged out locally. Please refresh the page.');
    window.location.href = '/index.html';
  }
}

// Make functions globally available
window.checkLoginStatus = checkLoginStatus;
window.handleLogout = handleLogout;
