// ======== Dependencies ========
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const mysql = require("mysql2");

// Load configuration
const config = require('./config.js');

const app = express();
const PORT = 3000;

// ======== Database Connection ========
const db = mysql.createPool(config.db);

// ======== Middleware ========
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set Content Security Policy to allow localhost connections
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:*; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
    "img-src 'self' data: blob: http://localhost:* https:; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self' http://localhost:*; " +
    "frame-ancestors 'none'"
  );
  next();
});

// CORS so frontend can access backend
// app.use(cors({
//   origin: "http://localhost:5500", // frontend origin
//   credentials: true
// }));

// Session config
app.use(session({
  secret: "swayam",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true }
}));

// Static for uploads, public files, and images
app.use("/uploads", express.static("uploads"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static("images"));

// ======== Admin Middleware ========
function adminOnly(req, res, next) {
  if (!req.session.user) return res.status(401).json({ message: "Login required" });
  if (req.session.user.role !== "admin") return res.status(403).json({ message: "Admins only" });
  next();
}

// ======== Multer Config (for file uploads) ========
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "uploads")),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// ======== AUTH ROUTES ========

// Signup
app.post("/auth/signup", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ message: "All fields required" });

  const hashedPassword = await bcrypt.hash(password, 10);
  db.query(
    "INSERT INTO user_info_table (username, email, password, role) VALUES (?, ?, ?, 'user')",
    [username, email, hashedPassword],
    (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ message: "Username or email already exists" });
        return res.status(500).json({ message: err.message });
      }
      res.json({ message: "User registered successfully" });
    }
  );
});

// Login
app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;
  db.query("SELECT * FROM user_info_table WHERE email=?", [email], async (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    if (results.length === 0) return res.status(401).json({ message: "User not found" });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    // Save session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    // Redirect based on user role
    if (user.role === 'admin') {
      res.redirect('/admin.html');
    } else {
      res.redirect('/index.html');
    }
  });
});

// Check session status
app.get("/auth/check-session", (req, res) => {
  if (req.session.user) {
    res.json({ 
      loggedIn: true, 
      user: req.session.user,
      role: req.session.user.role 
    });
  } else {
    res.json({ loggedIn: false });
  }
});

// Logout
app.get("/auth/logout", (req, res) => {
  req.session.destroy(() => res.json({ message: "Logged out" }));
});

// ======== FORTS ROUTES ========

// Add a fort (admin only, with image)
app.post("/api/forts", adminOnly, upload.single("image"), (req, res) => {
  const { name, description, location, difficulty } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  db.query(
    "INSERT INTO forts (name, description, location, difficulty, image_url) VALUES (?, ?, ?, ?, ?)",
    [name, description, location, difficulty, imageUrl],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Fort added successfully" });
    }
  );
});

// Get all forts
app.get("/api/forts", (req, res) => {
  db.query("SELECT * FROM forts", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get single fort by ID
app.get("/api/forts/:id", (req, res) => {
  const fortId = req.params.id;
  db.query("SELECT * FROM forts WHERE id = ?", [fortId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ error: "Fort not found" });
    res.json(rows[0]);
  });
});

// Update fort
app.put("/api/forts/:id", adminOnly, upload.single("image"), (req, res) => {
  const { name, description, location, difficulty } = req.body;
  const fortId = req.params.id;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : req.body.existing_image_url;

  db.query(
    "UPDATE forts SET name=?, description=?, location=?, difficulty=?, image_url=? WHERE id=?",
    [name, description, location, difficulty, imageUrl, fortId],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Fort updated successfully" });
    }
  );
});

// Delete fort
app.delete("/api/forts/:id", adminOnly, (req, res) => {
  const fortId = req.params.id;
  db.query("DELETE FROM forts WHERE id = ?", [fortId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Fort deleted successfully" });
  });
});

// ======== PACKAGES ROUTES ========

// Add package (admin, multiple images)
app.post("/api/packages", adminOnly, upload.single("image"), (req, res) => {
  const { name, price, itinerary, season, base_village, difficulty } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  db.query(
    "INSERT INTO packages (name, price, itinerary, season, base_village, difficulty, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [name, price, itinerary, season, base_village, difficulty, imageUrl],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Package added successfully" });
    }
  );
});
// Get all packages
app.get("/api/packages", (req, res) => {
  db.query("SELECT * FROM packages", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get single package by ID
app.get("/api/packages/:id", (req, res) => {
  const packageId = req.params.id;
  db.query("SELECT * FROM packages WHERE id = ?", [packageId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ error: "Package not found" });
    res.json(rows[0]);
  });
});

// Update package
app.put("/api/packages/:id", adminOnly, upload.single("image"), (req, res) => {
  const { name, price, itinerary, season, base_village, difficulty } = req.body;
  const packageId = req.params.id;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : req.body.existing_image_url;

  db.query(
    "UPDATE packages SET name=?, price=?, itinerary=?, season=?, base_village=?, difficulty=?, image_url=? WHERE id=?",
    [name, price, itinerary, season, base_village, difficulty, imageUrl, packageId],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Package updated successfully" });
    }
  );
});

// Delete package
app.delete("/api/packages/:id", adminOnly, (req, res) => {
  const packageId = req.params.id;
  db.query("DELETE FROM packages WHERE id = ?", [packageId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Package deleted successfully" });
  });
});

// ======== BOOKINGS ROUTES ========

// User creates booking
app.post("/api/bookings", (req, res) => {
  const { fullname, email, phone, participants, message, package_id } = req.body;
  if(!fullname || !email || !phone || !participants || !package_id) {
    return res.status(400).json({ message: "All required fields must be filled" });
  }
  db.query(
    "INSERT INTO bookings (fullname, email, phone, participants, message, package_id, status) VALUES (?, ?, ?, ?, ?, ?, 'Pending')",
    [fullname, email, phone, participants, message, package_id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Booking request submitted" });
    }
  );
});

// Admin: view bookings
app.get("/api/bookings", adminOnly, (req, res) => {
  db.query(`
    SELECT b.*, p.name as package_name 
    FROM bookings b 
    LEFT JOIN packages p ON b.package_id = p.id
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});


// Admin: update booking status
app.put("/api/bookings/:id", adminOnly, (req, res) => {
  const { status } = req.body;
  db.query("UPDATE bookings SET status=? WHERE id=?", [status, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: `Booking ${status}` });
  });
});

// Admin: delete booking
app.delete("/api/bookings/:id", adminOnly, (req, res) => {
  db.query("DELETE FROM bookings WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Booking deleted" });
  });
});

// ======== CONTACT ROUTES ========

// Contact form submission
app.post("/api/contact", (req, res) => {
  const { name, email, phone, message } = req.body;
  
  // Simple validation
  if (!name || !email || !message) {
    return res.status(400).json({ message: "Name, email, and message are required" });
  }
  
  // In a real application, you would save this to a database
  // For now, just return a success message
  console.log("Contact form submission:", { name, email, phone, message });
  res.json({ message: "Thank you for your message! We'll get back to you soon." });
});

// ======== Admin Panel ========
app.get("/admin.html", adminOnly, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// ======== Start Server ========
app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});
