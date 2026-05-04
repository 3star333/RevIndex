const express   = require("express");
const bcrypt    = require("bcryptjs");
const jwt       = require("jsonwebtoken");
const crypto    = require("crypto");
const nodemailer = require("nodemailer");
const db        = require("../db/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ── Mailer setup ─────────────────────────────────────────────────────────────
function getMailer() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendVerificationEmail(email, token) {
  const url = `${process.env.APP_URL}/api/auth/verify-email?token=${token}`;
  const mailer = getMailer();
  await mailer.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      email,
    subject: "RevIndex — Verify your email",
    html: `
      <div style="font-family:monospace;background:#C0C0C0;padding:16px;border:3px outset #fff">
        <div style="background:#000080;color:#fff;padding:4px 8px;font-weight:bold">RevIndex — Email Verification</div>
        <div style="padding:12px">
          <p>Click the link below to verify your email address:</p>
          <a href="${url}" style="background:#000080;color:#fff;padding:4px 12px;text-decoration:none;font-weight:bold">[VERIFY EMAIL]</a>
          <p style="color:#808080;font-size:11px;margin-top:12px">Link expires in 24 hours.</p>
        </div>
      </div>
    `,
  });
}

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

  const password_hash      = await bcrypt.hash(password, 12);
  const verification_token = crypto.randomBytes(32).toString("hex");

  const { lastInsertRowid } = db.prepare(
    "INSERT INTO users (username, email, password_hash, verification_token) VALUES (?, ?, ?, ?)"
  ).run(username, email.toLowerCase(), password_hash, verification_token);

  try {
    await sendVerificationEmail(email, verification_token);
  } catch (err) {
    console.error("Email send failed:", err.message);
    // Don't block registration if email fails — just log it
  }

  res.status(201).json({
    message: "Account created! Check your email to verify your account.",
    userId: lastInsertRowid,
  });
});

// ── GET /auth/verify-email?token=xxx ────────────────────────────────────────
router.get("/verify-email", (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send("Missing token.");

  const user = db.prepare("SELECT id FROM users WHERE verification_token = ?").get(token);
  if (!user) return res.status(400).send("Invalid or expired verification link.");

  db.prepare("UPDATE users SET email_verified = 1, verification_token = NULL WHERE id = ?").run(user.id);

  // Redirect to frontend with success flag
  res.redirect(`${process.env.APP_URL}/?verified=1`);
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

  if (!user.email_verified)
    return res.status(403).json({ error: "Please verify your email before logging in." });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
  // No expiry = lasts until localStorage cleared or logout

  res.json({
    token,
    user: {
      id:         user.id,
      username:   user.username,
      email:      user.email,
      avatar_url: user.avatar_url,
      bio:        user.bio,
    },
  });
});

// ── GET /auth/me ─────────────────────────────────────────────────────────────
router.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});

// ── PUT /auth/profile ─────────────────────────────────────────────────────────
router.put("/profile", requireAuth, async (req, res) => {
  const { bio, avatar_url } = req.body;
  db.prepare("UPDATE users SET bio = ?, avatar_url = ? WHERE id = ?")
    .run(bio || null, avatar_url || null, req.user.id);
  const updated = db.prepare("SELECT id, username, email, avatar_url, bio FROM users WHERE id = ?").get(req.user.id);
  res.json(updated);
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
