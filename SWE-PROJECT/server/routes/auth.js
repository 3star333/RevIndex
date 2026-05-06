const express   = require("express");
const bcrypt    = require("bcryptjs");
const jwt       = require("jsonwebtoken");
const multer    = require("multer");
const path      = require("path");
const fs        = require("fs");
const db        = require("../db/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ── Avatar upload storage ─────────────────────────────────────────────────────
const avatarStorage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(__dirname, "../uploads/avatars");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `avatar_${req.user.id}_${Date.now()}${ext}`);
  },
});
const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Images only"));
    cb(null, true);
  },
});

// ── POST /auth/register ──────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: "username, email and password are required" });
  if (password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username))
    return res.status(400).json({ error: "Username must be 3–20 chars, letters/numbers/underscores only" });

  const existing = db.prepare("SELECT id FROM users WHERE username = ? OR email = ?").get(username, email);
  if (existing) return res.status(409).json({ error: "Username or email already taken" });

  const password_hash = await bcrypt.hash(password, 12);

  db.prepare(
    "INSERT INTO users (username, email, password_hash, email_verified) VALUES (?, ?, ?, 1)"
  ).run(username, email.toLowerCase(), password_hash);

  res.status(201).json({ message: "Account created! You can log in now.", verified: true });
});

// ── POST /auth/login ─────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { login, password } = req.body; // login = username OR email
  if (!login || !password)
    return res.status(400).json({ error: "Username/email and password are required" });

  const user = db.prepare(
    "SELECT * FROM users WHERE username = ? OR email = ?"
  ).get(login, login.toLowerCase());

  if (!user) return res.status(401).json({ error: "Invalid username or password" });

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ error: "Invalid username or password" });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
  // No expiry = lasts until localStorage cleared or logout

  res.json({
    token,
    user: {
      id:          user.id,
      username:    user.username,
      avatar_url:  user.avatar_url,
      bio:         user.bio,
      profile_gif: user.profile_gif,
      signature:   user.signature,
      is_admin:    user.is_admin,
    },
  });
});

// ── GET /auth/me ─────────────────────────────────────────────────────────────
router.get("/me", requireAuth, (req, res) => {
  const { email, ...publicUser } = req.user; // eslint-disable-line no-unused-vars
  res.json(publicUser);
});

// ── PUT /auth/profile ─────────────────────────────────────────────────────────
router.put("/profile", requireAuth, async (req, res) => {
  const { bio, avatar_url, profile_gif, signature } = req.body;
  db.prepare("UPDATE users SET bio = ?, avatar_url = ?, profile_gif = ?, signature = ? WHERE id = ?")
    .run(bio || null, avatar_url || null, profile_gif || null, signature || null, req.user.id);
  const updated = db.prepare("SELECT id, username, avatar_url, bio, profile_gif, signature, is_admin FROM users WHERE id = ?").get(req.user.id);
  res.json(updated);
});

// ── POST /auth/avatar ─────────────────────────────────────────────────────────
router.post("/avatar", requireAuth, (req, res, next) => {
  avatarUpload.single("avatar")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const url = `/uploads/avatars/${req.file.filename}`;
    db.prepare("UPDATE users SET avatar_url = ? WHERE id = ?").run(url, req.user.id);
    res.json({ avatar_url: url });
  });
});

// ── GET /auth/active-count ────────────────────────────────────────────────────
router.get("/active-count", (req, res) => {
  const row = db.prepare(
    "SELECT COUNT(*) AS count FROM users WHERE last_seen_at >= datetime('now', '-24 hours')"
  ).get();
  res.json({ active: row.count });
});

// ── PUT /auth/change-password ─────────────────────────────────────────────────
router.put("/change-password", requireAuth, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password)
    return res.status(400).json({ error: "Both current and new password are required" });
  if (new_password.length < 6)
    return res.status(400).json({ error: "New password must be at least 6 characters" });

  const user  = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(req.user.id);
  const match = await bcrypt.compare(current_password, user.password_hash);
  if (!match) return res.status(401).json({ error: "Current password is incorrect" });

  const hash = await bcrypt.hash(new_password, 12);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, req.user.id);
  res.json({ message: "Password changed successfully" });
});

module.exports = router;
