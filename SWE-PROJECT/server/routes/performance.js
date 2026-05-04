const express = require("express");
const router  = express.Router();
const db      = require("../db/database");

const VALID_TYPES = ["Dyno", "Drag", "Autocross", "Street"];

// GET /performance?vehicle_id=X
router.get("/", (req, res) => {
  const vid = Number(req.query.vehicle_id);
  if (!vid) return res.status(400).json({ error: "vehicle_id required" });
  try {
    const rows = db.prepare(
      "SELECT * FROM performance_runs WHERE vehicle_id = ? ORDER BY date DESC, created_at DESC"
    ).all(vid);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /performance
router.post("/", (req, res) => {
  const { vehicle_id, run_type, date, hp, tq, zero_sixty, quarter_et, quarter_mph, boost_psi, notes } = req.body;
  const vid = Number(vehicle_id);
  if (!vid || !date) return res.status(400).json({ error: "vehicle_id and date required" });
  const type = VALID_TYPES.includes(run_type) ? run_type : "Dyno";
  try {
    const r = db.prepare(
      `INSERT INTO performance_runs
         (vehicle_id, run_type, date, hp, tq, zero_sixty, quarter_et, quarter_mph, boost_psi, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(vid, type, date, hp||null, tq||null, zero_sixty||null, quarter_et||null, quarter_mph||null, boost_psi||null, notes||null);
    res.status(201).json({
      id: r.lastInsertRowid, vehicle_id: vid, run_type: type, date,
      hp: hp||null, tq: tq||null, zero_sixty: zero_sixty||null,
      quarter_et: quarter_et||null, quarter_mph: quarter_mph||null,
      boost_psi: boost_psi||null, notes: notes||null,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /performance/:id
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  try {
    const r = db.prepare("DELETE FROM performance_runs WHERE id = ?").run(id);
    if (r.changes === 0) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
