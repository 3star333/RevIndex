const express = require("express");
const db      = require("../db/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ── Admin guard ───────────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (!req.user?.is_admin) return res.status(403).json({ error: "Admin only" });
  next();
}

// ── GET /api/admin/analytics ──────────────────────────────────────────────────
router.get("/analytics", requireAuth, requireAdmin, (req, res) => {
  const activeToday = db.prepare(
    "SELECT COUNT(*) AS count FROM users WHERE last_seen_at >= datetime('now', '-24 hours')"
  ).get().count;

  const activeWeek = db.prepare(
    "SELECT COUNT(*) AS count FROM users WHERE last_seen_at >= datetime('now', '-7 days')"
  ).get().count;

  const totalUsers = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;

  // New registrations per day for last 14 days
  const registrations = db.prepare(`
    SELECT date(created_at) AS day, COUNT(*) AS count
    FROM users
    WHERE created_at >= datetime('now', '-14 days')
    GROUP BY day ORDER BY day ASC
  `).all();

  // Posts per day for last 14 days
  const postsByDay = db.prepare(`
    SELECT date(created_at) AS day, COUNT(*) AS count
    FROM comments
    WHERE created_at >= datetime('now', '-14 days')
    GROUP BY day ORDER BY day ASC
  `).all();

  // Top 10 most active members (by post count)
  const topPosters = db.prepare(`
    SELECT u.username, u.avatar_url, COUNT(c.id) AS post_count,
           u.last_seen_at
    FROM users u
    LEFT JOIN comments c ON c.user_id = u.id
    GROUP BY u.id ORDER BY post_count DESC LIMIT 10
  `).all();

  // Recent registrations
  const recentUsers = db.prepare(`
    SELECT username, email, created_at, last_seen_at, is_admin
    FROM users ORDER BY created_at DESC LIMIT 20
  `).all();

  // Total threads & posts
  const totalThreads = db.prepare("SELECT COUNT(*) AS count FROM threads").get().count;
  const totalPosts   = db.prepare("SELECT COUNT(*) AS count FROM comments").get().count;
  const totalVehicles = db.prepare("SELECT COUNT(*) AS count FROM vehicles").get().count;

  // Page views proxy: total requests aren't tracked, use post activity as engagement metric
  // Hourly activity (last 24h posts)
  const hourlyActivity = db.prepare(`
    SELECT strftime('%H', created_at) AS hour, COUNT(*) AS count
    FROM comments
    WHERE created_at >= datetime('now', '-24 hours')
    GROUP BY hour ORDER BY hour ASC
  `).all();

  res.json({
    activeToday,
    activeWeek,
    totalUsers,
    totalThreads,
    totalPosts,
    totalVehicles,
    registrations,
    postsByDay,
    topPosters,
    recentUsers,
    hourlyActivity,
  });
});

module.exports = router;
