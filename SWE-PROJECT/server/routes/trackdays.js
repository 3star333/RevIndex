const express = require("express");
const router  = express.Router();
const db      = require("../db/database");

const VALID_TYPES      = ["Track Day", "Autocross", "Drag", "Road Course", "Hill Climb", "Drift"];
const VALID_CONDITIONS = ["Dry", "Wet", "Mixed", "Hot", "Cold"];

// GET /trackdays?vehicle_id=X
router.get("/", (req, res) => {
  const vid = Number(req.query.vehicle_id);
  if (!vid) return res.status(400).json({ error: "vehicle_id required" });
  try {
    const rows = db.prepare(
      "SELECT * FROM track_days WHERE vehicle_id = ? ORDER BY date DESC"
    ).all(vid);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /trackdays
router.post("/", (req, res) => {
  const { vehicle_id, date, track, event_type, best_lap, conditions, notes } = req.body;
  const vid = Number(vehicle_id);
  if (!vid || !date || !track) return res.status(400).json({ error: "vehicle_id, date, track required" });
  const type = VALID_TYPES.includes(event_type) ? event_type : "Track Day";
  const cond = VALID_CONDITIONS.includes(conditions) ? conditions : "Dry";
  try {
    const r = db.prepare(
      "INSERT INTO track_days (vehicle_id, date, track, event_type, best_lap, conditions, notes) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(vid, date, track, type, best_lap||null, cond, notes||null);
    res.status(201).json({
      id: r.lastInsertRowid, vehicle_id: vid, date, track,
      event_type: type, best_lap: best_lap||null, conditions: cond, notes: notes||null,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /trackdays/:id
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  try {
    const r = db.prepare("DELETE FROM track_days WHERE id = ?").run(id);
    if (r.changes === 0) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
