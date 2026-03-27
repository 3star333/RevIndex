const express  = require("express");
const router   = express.Router();
const db       = require("../db/database");
const { sanitizeString, isValidInt, isValidNumber, isValidDate } = require("../models/validate");

// ── POST /logs ────────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  const vehicle_id = Number(req.body.vehicle_id);
  const type       = sanitizeString(req.body.type);
  const cost       = Number(req.body.cost);
  const mileage    = Number(req.body.mileage);
  const notes      = sanitizeString(req.body.notes || "");
  const date       = req.body.date;

  if (!isValidInt(vehicle_id, 1))        return res.status(400).json({ error: "vehicle_id must be a positive integer." });
  if (!type)                             return res.status(400).json({ error: "type is required." });
  if (!isValidNumber(cost, 0))           return res.status(400).json({ error: "cost must be a non-negative number." });
  if (!isValidInt(mileage, 0))           return res.status(400).json({ error: "mileage must be a non-negative integer." });
  if (!isValidDate(date))                return res.status(400).json({ error: "date must be in YYYY-MM-DD format." });

  try {
    const result = await dbRun(
      "INSERT INTO logs (vehicle_id, type, cost, mileage, notes, date) VALUES (?, ?, ?, ?, ?, ?)",
      [vehicle_id, type, cost, mileage, notes || null, date]
    );
    res.status(201).json({ id: result.lastInsertRowid, vehicle_id, type, cost, mileage, notes: notes || null, date });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function dbRun(sql, params = []) {
  try { return Promise.resolve(db.prepare(sql).run(params)); }
  catch (e) { return Promise.reject(e); }
}

function dbAll(sql, params = []) {
  try { return Promise.resolve(db.prepare(sql).all(params)); }
  catch (e) { return Promise.reject(e); }
}

// ── DELETE /logs/:id ──────────────────────────────────────────────────────────
const path = require("path");
const fs   = require("fs");

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id || id < 1) return res.status(400).json({ error: "Invalid log id." });

  try {
    // Delete log photo files
    const photos = await dbAll("SELECT path FROM log_photos WHERE log_id = ?", [id]);
    for (const p of photos) {
      const f = path.join(__dirname, "..", p.path);
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    await dbRun("DELETE FROM log_photos WHERE log_id = ?", [id]);
    await dbRun("DELETE FROM logs WHERE id = ?", [id]);
    res.json({ deleted: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;


