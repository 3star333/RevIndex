const express = require("express");
const router  = express.Router();
const db      = require("../db/database");
const { sanitizeString, isValidInt } = require("../models/validate");

// ── GET /threads ──────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const rows = await dbAll(`
      SELECT t.*,
             v.make, v.model, v.year, v.image AS vehicle_image,
             COUNT(c.id) AS reply_count,
             MAX(c.created_at) AS last_reply
      FROM threads t
      JOIN vehicles v ON v.id = t.vehicle_id
      LEFT JOIN comments c ON c.thread_id = t.id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /threads ─────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  const vehicle_id  = Number(req.body.vehicle_id);
  const title       = sanitizeString(req.body.title);
  const description = sanitizeString(req.body.description || "");

  if (!isValidInt(vehicle_id, 1)) return res.status(400).json({ error: "vehicle_id required." });
  if (!title)                     return res.status(400).json({ error: "title required." });

  try {
    const vRow = await dbGet("SELECT id FROM vehicles WHERE id = ?", [vehicle_id]);
    if (!vRow) return res.status(404).json({ error: "Vehicle not found." });
    const result = await dbRun(
      "INSERT INTO threads (vehicle_id, title, description) VALUES (?, ?, ?)",
      [vehicle_id, title, description || null]
    );
    res.status(201).json({ id: result.lastID, vehicle_id, title, description: description || null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /threads/:id ──────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!isValidInt(id, 1)) return res.status(400).json({ error: "Invalid thread id." });
  try {
    const thread = await dbGet(`
      SELECT t.*, v.make, v.model, v.year, v.nickname, v.image AS vehicle_image
      FROM threads t
      JOIN vehicles v ON v.id = t.vehicle_id
      WHERE t.id = ?
    `, [id]);
    if (!thread) return res.status(404).json({ error: "Thread not found." });
    res.json(thread);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /threads/:id/comments ─────────────────────────────────────────────────
router.get("/:id/comments", async (req, res) => {
  const id = Number(req.params.id);
  if (!isValidInt(id, 1)) return res.status(400).json({ error: "Invalid thread id." });
  try {
    const rows = await dbAll(
      "SELECT * FROM comments WHERE thread_id = ? ORDER BY created_at ASC",
      [id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /threads/:id/comments ────────────────────────────────────────────────
router.post("/:id/comments", async (req, res) => {
  const thread_id = Number(req.params.id);
  const author    = sanitizeString(req.body.author || "Anonymous");
  const content   = sanitizeString(req.body.content);

  if (!isValidInt(thread_id, 1)) return res.status(400).json({ error: "Invalid thread id." });
  if (!content)                  return res.status(400).json({ error: "content required." });

  try {
    const tRow = await dbGet("SELECT id FROM threads WHERE id = ?", [thread_id]);
    if (!tRow) return res.status(404).json({ error: "Thread not found." });
    const result = await dbRun(
      "INSERT INTO comments (thread_id, author, content) VALUES (?, ?, ?)",
      [thread_id, author || "Anonymous", content]
    );
    res.status(201).json({ id: result.lastID, thread_id, author: author || "Anonymous", content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function dbAll(sql, p = []) { return new Promise((res, rej) => db.all(sql, p, (e, r) => e ? rej(e) : res(r))); }
function dbGet(sql, p = []) { return new Promise((res, rej) => db.get(sql, p, (e, r) => e ? rej(e) : res(r))); }
function dbRun(sql, p = []) { return new Promise((res, rej) => db.run(sql, p, function(e) { e ? rej(e) : res(this); })); }

module.exports = router;
