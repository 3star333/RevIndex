require("dotenv").config({ path: require("path").join(__dirname, ".env") });
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
const authRoutes     = require("./routes/auth");
const performanceRoutes = require("./routes/performance");
const fuelRoutes     = require("./routes/fuel");
const wishlistRoutes = require("./routes/wishlist");
const specsRoutes    = require("./routes/specs");
const trackdayRoutes = require("./routes/trackdays");
const adminRoutes    = require("./routes/admin");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Ensure uploads directory exists ──────────────────────────────────────────
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ── CORS ──────────────────────────────────────────────────────────────────────
const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  methods: ["GET", "POST", "DELETE", "PATCH", "PUT"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ── Static file serving for uploaded images ───────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/smilies", express.static(path.join(__dirname, "public", "smilies")));
// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/vehicles", vehicleRoutes);
app.use("/vehicles", photoRoutes);
app.use("/logs",     logRoutes);
app.use("/photos",   photoRoutes);
app.use("/listings", listingRoutes);
app.use("/mods",     modRoutes);
app.use("/threads",  forumRoutes);
app.use("/vin",      vinRoutes);
app.use("/performance", performanceRoutes);
app.use("/fuel",     fuelRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/specs",    specsRoutes);
app.use("/trackdays", trackdayRoutes);
app.use("/api/admin", adminRoutes);

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
