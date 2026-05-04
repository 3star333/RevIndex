const express = require("express");
const router  = express.Router();
const db      = require("../db/database");

const PRIORITIES = ["Low", "Medium", "High", "ASAP"];

// GET /wishlist?vehicle_id=X
router.get("/", (req, res) => {
  const vid = Number(req.query.vehicle_id);
  if (!vid) return res.status(400).json({ error: "vehicle_id required" });
  try {
    const rows = db.prepare(
      "SELECT * FROM wishlist WHERE vehicle_id = ? ORDER BY done ASC, created_at DESC"
    ).all(vid);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /wishlist
router.post("/", (req, res) => {
  const { vehicle_id, name, category, price, priority, link, notes } = req.body;
  const vid = Number(vehicle_id);
  if (!vid || !name) return res.status(400).json({ error: "vehicle_id and name required" });
  const pri = PRIORITIES.includes(priority) ? priority : "Medium";
  try {
    const r = db.prepare(
      "INSERT INTO wishlist (vehicle_id, name, category, price, priority, link, notes) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(vid, name, category||"Other", Number(price)||0, pri, link||null, notes||null);
    res.status(201).json({
      id: r.lastInsertRowid, vehicle_id: vid, name, category: category||"Other",
      price: Number(price)||0, priority: pri, link: link||null, notes: notes||null, done: 0,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /wishlist/:id/toggle
router.patch("/:id/toggle", (req, res) => {
  const id = Number(req.params.id);
  try {
    const row = db.prepare("SELECT done FROM wishlist WHERE id = ?").get(id);
    if (!row) return res.status(404).json({ error: "Not found" });
    const newDone = row.done ? 0 : 1;
    db.prepare("UPDATE wishlist SET done = ? WHERE id = ?").run(newDone, id);
    res.json({ ok: true, done: newDone });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /wishlist/:id
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  try {
    const r = db.prepare("DELETE FROM wishlist WHERE id = ?").run(id);
    if (r.changes === 0) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
