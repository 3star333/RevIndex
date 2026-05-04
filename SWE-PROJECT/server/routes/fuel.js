const express = require("express");
const router  = express.Router();
const db      = require("../db/database");

// GET /fuel?vehicle_id=X  (ordered ASC for MPG calculation)
router.get("/", (req, res) => {
  const vid = Number(req.query.vehicle_id);
  if (!vid) return res.status(400).json({ error: "vehicle_id required" });
  try {
    const rows = db.prepare(
      "SELECT * FROM fuel_logs WHERE vehicle_id = ? ORDER BY mileage ASC"
    ).all(vid);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /fuel
router.post("/", (req, res) => {
  const { vehicle_id, date, gallons, price_per_gal, mileage, notes } = req.body;
  const vid = Number(vehicle_id);
  if (!vid || !date || !gallons || !mileage)
    return res.status(400).json({ error: "vehicle_id, date, gallons, mileage required" });
  try {
    const r = db.prepare(
      "INSERT INTO fuel_logs (vehicle_id, date, gallons, price_per_gal, mileage, notes) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(vid, date, Number(gallons), Number(price_per_gal)||0, Number(mileage), notes||null);
    res.status(201).json({
      id: r.lastInsertRowid, vehicle_id: vid, date,
      gallons: Number(gallons), price_per_gal: Number(price_per_gal)||0,
      mileage: Number(mileage), notes: notes||null,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /fuel/:id
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  try {
    const r = db.prepare("DELETE FROM fuel_logs WHERE id = ?").run(id);
    if (r.changes === 0) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
