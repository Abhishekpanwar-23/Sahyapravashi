// signup.js
document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  const messageElement = document.getElementById("message");

  if (signupForm && messageElement) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      // Simple client-side validation
      if (!username || !email || !password) {
        messageElement.innerHTML = "All fields are required.";
        messageElement.style.color = "red";
        return;
      }

      if (password.length < 6) {
        messageElement.innerHTML = "Password must be at least 6 characters long.";
        messageElement.style.color = "red";
        return;
      }

      try {
        const res = await fetch('/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password }),
          credentials: "include"
        });

        // Handle both JSON and plain text responses
        let data;
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await res.json();
        } else {
          const text = await res.text();
          data = { message: text };
        }

        messageElement.innerHTML = data.message || "Registration attempt completed.";
        
        if (res.ok) {
          messageElement.style.color = "green";
          // Clear form on success
          signupForm.reset();
          
          // Redirect to login page after successful registration
          setTimeout(() => {
            window.location.href = '/Login.html';
          }, 2000);
        } else {
          messageElement.style.color = "red";
        }
      } catch (err) {
        console.error("Signup error:", err);
        messageElement.innerHTML = "An error occurred during registration. Please try again.";
        messageElement.style.color = "red";
      }
    });
  }
});