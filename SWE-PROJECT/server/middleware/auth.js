const jwt = require("jsonwebtoken");
const db  = require("../db/database");

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const user    = db.prepare("SELECT id, username, email, avatar_url, bio, profile_gif, signature, email_verified FROM users WHERE id = ?").get(payload.userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
      req.user = db.prepare("SELECT id, username, email, avatar_url, bio, profile_gif, signature FROM users WHERE id = ?").get(payload.userId);
    } catch { /* ignore */ }
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
