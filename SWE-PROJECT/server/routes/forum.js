const express = require("express");
const router  = express.Router();
const db      = require("../db/database");
const { sanitizeString, isValidInt } = require("../models/validate");
const { optionalAuth, requireAuth } = require("../middleware/auth");

const VALID_TAGS  = ["General", "Build Log", "Question", "For Sale", "Tech", "Help", "Off Topic"];
const VALID_SORTS = {
  latest:  "t.created_at DESC",
  replies: "reply_count DESC",
  oldest:  "t.created_at ASC",
};

// ── GET /stats ────────────────────────────────────────────────────────────────
router.get("/stats", (req, res) => {
  try {
    const members  = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
    const threads  = db.prepare("SELECT COUNT(*) AS n FROM threads").get().n;
    const posts    = db.prepare("SELECT COUNT(*) AS n FROM comments").get().n;
    const vehicles = db.prepare("SELECT COUNT(*) AS n FROM vehicles").get().n;
    const latest   = db.prepare(`
      SELECT t.id, t.title, t.tag, t.created_at,
             u.username AS author_username
      FROM threads t
      LEFT JOIN users u ON u.id = t.user_id
      ORDER BY t.created_at DESC LIMIT 5
    `).all();
    res.json({ members, threads, posts, vehicles, latest });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /threads ──────────────────────────────────────────────────────────────
router.get("/", (req, res) => {
  try {
    const { sort = "latest", tag } = req.query;
    const orderBy   = VALID_SORTS[sort] || VALID_SORTS.latest;
    const tagFilter = tag && VALID_TAGS.includes(tag) ? tag : null;

    const sql = `
      SELECT t.*,
             v.make, v.model, v.year, v.nickname, v.image AS vehicle_image,
             u.username AS author_username, u.avatar_url AS author_avatar,
             COUNT(c.id) AS reply_count,
             MAX(c.created_at) AS last_reply
      FROM threads t
      JOIN vehicles v ON v.id = t.vehicle_id
      LEFT JOIN users u ON u.id = t.user_id
      LEFT JOIN comments c ON c.thread_id = t.id
      ${tagFilter ? "WHERE t.tag = ?" : ""}
      GROUP BY t.id
      ORDER BY ${orderBy}
    `;
    const rows = tagFilter
      ? db.prepare(sql).all(tagFilter)
      : db.prepare(sql).all();
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /threads/stats  (must be before /:id) ─────────────────────────────────
router.get("/stats", (req, res) => {
  try {
    const { thread_count } = db.prepare("SELECT COUNT(*) AS thread_count FROM threads").get();
    const { post_count }   = db.prepare("SELECT COUNT(*) AS post_count FROM comments").get();
    res.json({ thread_count, post_count });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /threads ─────────────────────────────────────────────────────────────
router.post("/", optionalAuth, (req, res) => {
  const vehicle_id  = Number(req.body.vehicle_id);
  const title       = sanitizeString(req.body.title);
  const description = sanitizeString(req.body.description || "");
  const tag         = VALID_TAGS.includes(req.body.tag) ? req.body.tag : "General";
  const user_id     = req.user?.id || null;

  if (!isValidInt(vehicle_id, 1)) return res.status(400).json({ error: "vehicle_id required." });
  if (!title)                     return res.status(400).json({ error: "title required." });

  try {
    const vRow = db.prepare("SELECT id FROM vehicles WHERE id = ?").get(vehicle_id);
    if (!vRow) return res.status(404).json({ error: "Vehicle not found." });
    const result = db.prepare(
      "INSERT INTO threads (vehicle_id, title, description, tag, user_id) VALUES (?, ?, ?, ?, ?)"
    ).run(vehicle_id, title, description || null, tag, user_id);
    res.status(201).json({ id: result.lastInsertRowid, vehicle_id, title, description: description || null, tag, user_id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /threads/:id ──────────────────────────────────────────────────────────
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!isValidInt(id, 1)) return res.status(400).json({ error: "Invalid thread id." });
  try {
    const thread = db.prepare(`
      SELECT t.*, v.make, v.model, v.year, v.nickname, v.image AS vehicle_image,
             u.username AS author_username, u.avatar_url AS author_avatar,
             u.profile_gif AS author_profile_gif, u.signature AS author_signature
      FROM threads t
      JOIN vehicles v ON v.id = t.vehicle_id
      LEFT JOIN users u ON u.id = t.user_id
      WHERE t.id = ?
    `).get(id);
    if (!thread) return res.status(404).json({ error: "Thread not found." });
    res.json(thread);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /threads/:id ───────────────────────────────────────────────────────
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!isValidInt(id, 1)) return res.status(400).json({ error: "Invalid thread id." });
  try {
    db.prepare("DELETE FROM comments WHERE thread_id = ?").run(id);
    const result = db.prepare("DELETE FROM threads WHERE id = ?").run(id);
    if (result.changes === 0) return res.status(404).json({ error: "Thread not found." });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /threads/:id/comments ─────────────────────────────────────────────────
router.get("/:id/comments", (req, res) => {
  const id = Number(req.params.id);
  if (!isValidInt(id, 1)) return res.status(400).json({ error: "Invalid thread id." });
  try {
    const rows = db.prepare(`
      SELECT c.*, u.username AS author_username, u.avatar_url AS author_avatar,
             u.profile_gif AS author_profile_gif, u.signature AS author_signature
      FROM comments c
      LEFT JOIN users u ON u.id = c.user_id
      WHERE c.thread_id = ?
      ORDER BY c.created_at ASC
    `).all(id);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /threads/:id/comments ────────────────────────────────────────────────
router.post("/:id/comments", optionalAuth, (req, res) => {
  const thread_id = Number(req.params.id);
  const author    = sanitizeString(req.body.author || (req.user?.username) || "Anonymous");
  const content   = sanitizeString(req.body.content);
  const user_id   = req.user?.id || null;

  if (!isValidInt(thread_id, 1)) return res.status(400).json({ error: "Invalid thread id." });
  if (!content)                  return res.status(400).json({ error: "content required." });

  try {
    const tRow = db.prepare("SELECT id FROM threads WHERE id = ?").get(thread_id);
    if (!tRow) return res.status(404).json({ error: "Thread not found." });
    const result = db.prepare(
      "INSERT INTO comments (thread_id, author, content, user_id) VALUES (?, ?, ?, ?)"
    ).run(thread_id, author, content, user_id);
    res.status(201).json({
      id: result.lastInsertRowid, thread_id,
      author, content, user_id,
      author_username:    req.user?.username    || null,
      author_avatar:      req.user?.avatar_url  || null,
      author_profile_gif: req.user?.profile_gif || null,
      author_signature:   req.user?.signature   || null,
      likes: 0,
      created_at: new Date().toISOString(),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PATCH /threads/:id/comments/:cid ─────────────────────────────────────────
router.patch("/:id/comments/:cid", (req, res) => {
  const cid     = Number(req.params.cid);
  const content = sanitizeString(req.body.content);
  if (!isValidInt(cid, 1)) return res.status(400).json({ error: "Invalid comment id." });
  if (!content)            return res.status(400).json({ error: "content required." });
  try {
    const result = db.prepare("UPDATE comments SET content = ? WHERE id = ?").run(content, cid);
    if (result.changes === 0) return res.status(404).json({ error: "Comment not found." });
    res.json({ ok: true, content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /threads/:id/comments/:cid ────────────────────────────────────────
router.delete("/:id/comments/:cid", (req, res) => {
  const cid = Number(req.params.cid);
  if (!isValidInt(cid, 1)) return res.status(400).json({ error: "Invalid comment id." });
  try {
    const result = db.prepare("DELETE FROM comments WHERE id = ?").run(cid);
    if (result.changes === 0) return res.status(404).json({ error: "Comment not found." });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /threads/:id/comments/:cid/like ─────────────────────────────────────
router.post("/:id/comments/:cid/like", (req, res) => {
  const cid = Number(req.params.cid);
  if (!isValidInt(cid, 1)) return res.status(400).json({ error: "Invalid comment id." });
  try {
    const result = db.prepare("UPDATE comments SET likes = likes + 1 WHERE id = ?").run(cid);
    if (result.changes === 0) return res.status(404).json({ error: "Comment not found." });
    const row = db.prepare("SELECT likes FROM comments WHERE id = ?").get(cid);
    res.json({ ok: true, likes: row.likes });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
