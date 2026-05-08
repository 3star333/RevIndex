require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express      = require("express");
const cors         = require("cors");
const path         = require("path");
const fs           = require("fs");
const helmet       = require("helmet");
const rateLimit    = require("express-rate-limit");

// ── Startup checks ────────────────────────────────────────────────────────────
if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is not set. Refusing to start.");
  process.exit(1);
}

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

// ── One-time data fix ─────────────────────────────────────────────────────────
{ const db = require("./db/database");
  db.prepare("UPDATE vehicles SET nickname = ? WHERE id = 86 AND nickname = ?")
    .run("The Daily Driver", "Super-Semite Slayer"); }
// ── Security headers (helmet) ─────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'"],   // React needs inline scripts
      styleSrc:    ["'self'", "'unsafe-inline'"],
      imgSrc:      ["'self'", "data:", "https:", "blob:"],  // allow external avatars/gifs
      connectSrc:  ["'self'"],
      fontSrc:     ["'self'"],
      objectSrc:   ["'none'"],
      frameSrc:    ["'self'", "https://www.youtube.com", "https://player.vimeo.com"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // needed for YouTube embeds
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Strict limit on auth endpoints (login/register) — prevents brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: "Too many attempts, please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  message: { error: "Too many requests, slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/login",    authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/",              apiLimiter);

// ── CORS ──────────────────────────────────────────────────────────────────────
// In production the frontend is served from the same origin, so CORS is mainly
// for local dev. CLIENT_ORIGIN can be a comma-separated list.
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",").map(o => o.trim());

const corsOptions = {
  origin(origin, cb) {
    // Allow requests with no origin (mobile apps, curl, same-origin)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ["GET", "POST", "DELETE", "PATCH", "PUT"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ── Static file serving for uploaded images ───────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/smilies", express.static(path.join(__dirname, "smilies")));
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
  console.log(`CORS allowed origins: ${allowedOrigins.join(", ")}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || "development"}`);
});
