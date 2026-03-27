require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");

// Initialize DB (runs table creation on import)
require("./db/database");

const vehicleRoutes  = require("./routes/vehicles");
const logRoutes      = require("./routes/logs");
const listingRoutes  = require("./routes/listings");
const modRoutes      = require("./routes/mods");
const photoRoutes    = require("./routes/photos");
const forumRoutes    = require("./routes/forum");
const vinRoutes      = require("./routes/vin");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Ensure uploads directory exists ──────────────────────────────────────────
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ── CORS ──────────────────────────────────────────────────────────────────────
const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  methods: ["GET", "POST", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type"],
};
app.use(cors(corsOptions));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ── Static file serving for uploaded images ───────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/vehicles", vehicleRoutes);  // GET /vehicles, POST /vehicles, POST /:id/image, GET /:id/logs
app.use("/vehicles", photoRoutes);    // GET /:id/photos, POST /:id/photos, DELETE /:id/photos/:pid
app.use("/logs",     logRoutes);      // POST /logs
app.use("/photos",   photoRoutes);    // GET /logs/:logId/photos, POST /logs/:logId/photos
app.use("/listings", listingRoutes);  // GET /listings, POST /listings
app.use("/mods",     modRoutes);      // GET /mods?vehicle_id=X, POST /mods, POST /:id/image, DELETE /:id
app.use("/threads",  forumRoutes);    // GET /threads, POST /threads, GET /:id, GET /:id/comments, POST /:id/comments
app.use("/vin",      vinRoutes);      // GET /vin/decode?vin=, GET /vin/makes, GET /vin/models

app.get("/api", (req, res) => res.json({ message: "RevIndex API is running 🚗" }));

// ── Serve React build in production ──────────────────────────────────────────
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));
  // SPA fallback — send index.html for all non-API routes
  app.get("*path", (req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });// ── Global error handler ──────────────────────────────────────────────────────
// Catches any unhandled errors thrown inside route handlers
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`CORS origin: ${corsOptions.origin}`);
});
