document.addEventListener("DOMContentLoaded", () => {
  const packagesGrid = document.getElementById("packagesGrid");
  const packageDetailsSection = document.getElementById("packageDetailsSection");

  // Fetch packages from backend
  async function loadPackages() {
    try {
      const res = await fetch("/api/packages");
      if (!res.ok) throw new Error("Failed to fetch packages");
      const packages = await res.json();
      displayPackages(packages);
    } catch (err) {
      packagesGrid.innerHTML = `<p class="error">Error loading packages: ${err.message}</p>`;
    }
  }

  // Render packages in grid
  function displayPackages(packages) {
    packagesGrid.innerHTML = "";
    packages.forEach(pkg => {
      const div = document.createElement("div");
      div.className = "package-card";
      div.innerHTML = `
        <img src="${pkg.image_url || "images/default.jpg"}" alt="${escapeHtml(pkg.name)}" />
        <h3>${escapeHtml(pkg.name)}</h3>
        <p class="price">₹${pkg.price || "N/A"}</p>
        <button class="view-btn" data-id="${pkg.id}">View Details</button>
      `;
      packagesGrid.appendChild(div);
    });

    // Attach click handlers
    document.querySelectorAll(".view-btn").forEach(btn => {
      btn.addEventListener("click", () => showPackageDetails(btn.dataset.id));
    });
  }

  // Show package details
  async function showPackageDetails(id) {
    try {
      const res = await fetch(`/api/packages/${id}`);
      if (!res.ok) throw new Error("Package not found");
      const pkg = await res.json();

      packageDetailsSection.style.display = "block";
      packageDetailsSection.innerHTML = `
        <div class="package-detail-card">
          <img src="${pkg.image_url || "images/default.jpg"}" alt="${escapeHtml(pkg.name)}" />
          <h2>${escapeHtml(pkg.name)}</h2>
          <p><strong>Price:</strong> ₹${pkg.price}</p>
          <p><strong>Season:</strong> ${escapeHtml(pkg.season || "N/A")}</p>
          <p><strong>Base Village:</strong> ${escapeHtml(pkg.base_village || "N/A")}</p>
          <p><strong>Difficulty:</strong> ${escapeHtml(pkg.difficulty || "N/A")}</p>
          <p><strong>Itinerary:</strong></p>
          <pre>${escapeHtml(pkg.itinerary || "No details available")}</pre>

          <h3>Book this trek</h3>
          <form id="bookingForm" method="post">
            <input type="hidden" name="package_id" value="${pkg.id}" />
            <input type="text" name="fullname" placeholder="Full Name" required />
            <input type="email" name="email" placeholder="Email"  />
            <input type="text" name="phone" placeholder="Phone"  />
            <input type="number" name="participants" placeholder="Participants" min="1" required />
            <textarea name="message" placeholder="Message (optional)"></textarea>
            <button type="submit">Confirm Booking</button>
          </form>
        </div>
      `;

      document.getElementById("bookingForm").addEventListener("submit", submitBooking);
      packageDetailsSection.scrollIntoView({ behavior: "smooth" });

    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  // Submit booking
  async function submitBooking(e) {
    e.preventDefault();

    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries()); // convert FormData to object

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        alert("Booking request submitted successfully!");
        e.target.reset();
      } else {
        const errMsg = await res.text();
        alert("Failed to submit booking: " + errMsg);
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  }


  // Escape HTML helper
  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, m => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[m]));
  }

  // Initialize
  loadPackages();
});
