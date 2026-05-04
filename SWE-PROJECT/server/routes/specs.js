const express = require("express");
const router  = express.Router();
const db      = require("../db/database");

// GET /specs/:vehicle_id
router.get("/:vehicle_id", (req, res) => {
  const vid = Number(req.params.vehicle_id);
  try {
    const row = db.prepare("SELECT * FROM specs WHERE vehicle_id = ?").get(vid);
    res.json(row || { vehicle_id: vid });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /specs/:vehicle_id  (upsert)
router.put("/:vehicle_id", (req, res) => {
  const vid = Number(req.params.vehicle_id);
  const {
    hp_stock, tq_stock, hp_current, tq_current,
    transmission, drive_type, springs,
    sway_bar_f, sway_bar_r,
    wheel_size_f, wheel_size_r,
    tire_size_f, tire_size_r,
    curb_weight, notes,
  } = req.body;
  try {
    db.prepare(`
      INSERT INTO specs
        (vehicle_id, hp_stock, tq_stock, hp_current, tq_current, transmission, drive_type,
         springs, sway_bar_f, sway_bar_r, wheel_size_f, wheel_size_r,
         tire_size_f, tire_size_r, curb_weight, notes, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(vehicle_id) DO UPDATE SET
        hp_stock=excluded.hp_stock, tq_stock=excluded.tq_stock,
        hp_current=excluded.hp_current, tq_current=excluded.tq_current,
        transmission=excluded.transmission, drive_type=excluded.drive_type,
        springs=excluded.springs, sway_bar_f=excluded.sway_bar_f, sway_bar_r=excluded.sway_bar_r,
        wheel_size_f=excluded.wheel_size_f, wheel_size_r=excluded.wheel_size_r,
        tire_size_f=excluded.tire_size_f, tire_size_r=excluded.tire_size_r,
        curb_weight=excluded.curb_weight, notes=excluded.notes,
        updated_at=datetime('now')
    `).run(
      vid, hp_stock||null, tq_stock||null, hp_current||null, tq_current||null,
      transmission||null, drive_type||null, springs||null,
      sway_bar_f||null, sway_bar_r||null,
      wheel_size_f||null, wheel_size_r||null,
      tire_size_f||null, tire_size_r||null,
      curb_weight||null, notes||null
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
