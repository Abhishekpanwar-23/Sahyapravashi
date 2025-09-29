// login.js
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      try {
        const res = await fetch("/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          credentials: "include"
        });

        if (res.ok) {
          // Check if the response is a redirect (status 302)
          if (res.redirected) {
            // Store basic login info
            localStorage.setItem('userToken', 'logged_in');
            
            // Check redirect URL to determine role
            if (res.url.includes('admin.html')) {
              localStorage.setItem('userRole', 'admin');
              window.location.href = "/admin.html";
            } else {
              localStorage.setItem('userRole', 'user');
              window.location.href = "/index.html";
            }
          } else {
            // Try to parse JSON response
            try {
              const data = await res.json();
              if (data.message) alert(data.message);
              
              // Store user data in localStorage for session management
              localStorage.setItem('userToken', 'logged_in');
              localStorage.setItem('userRole', data.role || 'user');
              
              // Check if user is admin and redirect accordingly
              if (data.role === 'admin') {
                window.location.href = "/admin.html";
              } else {
                window.location.href = "/index.html";
              }
            } catch (jsonError) {
              // If JSON parsing fails, assume successful login
              localStorage.setItem('userToken', 'logged_in');
              localStorage.setItem('userRole', 'user');
              window.location.href = "/index.html";
            }
          }
        } else {
          const data = await res.json();
          alert(data.message || "Login failed!");
        }
      } catch (err) {
        console.error("Login error:", err);
        alert("An error occurred during login. Please try again.");
      }
    });
  }

  // Logout button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await fetch("/auth/logout", {
        credentials: "include"
      });
      alert("Logged out!");
      window.location.href = "/login.html";
    });
  }
});
