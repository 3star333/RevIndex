const express = require("express");
const router  = express.Router();
const db      = require("../db/database");
const path    = require("path");
const fs      = require("fs");
const multer  = require("multer");
const { sanitizeString, isValidInt } = require("../models/validate");

// ── Multer ────────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads")),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `vphoto-${req.params.vehicleId}-${Date.now()}${ext}`);
  },
});
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const upload  = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    ALLOWED.includes(file.mimetype) ? cb(null, true) : cb(new Error("Invalid image type.")),
});

// ── GET /vehicles/:vehicleId/photos ───────────────────────────────────────────
router.get("/:vehicleId/photos", async (req, res) => {
  const vid = Number(req.params.vehicleId);
  if (!isValidInt(vid, 1)) return res.status(400).json({ error: "Invalid vehicle id." });
  try {
    const rows = await dbAll("SELECT * FROM vehicle_photos WHERE vehicle_id = ? ORDER BY created_at ASC", [vid]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /vehicles/:vehicleId/photos ──────────────────────────────────────────
router.post("/:vehicleId/photos", upload.single("image"), async (req, res) => {
  const vid     = Number(req.params.vehicleId);
  const caption = sanitizeString(req.body.caption || "");
  if (!isValidInt(vid, 1)) return res.status(400).json({ error: "Invalid vehicle id." });
  if (!req.file)           return res.status(400).json({ error: "No image uploaded." });

  const imgPath = `/uploads/${req.file.filename}`;
  try {
    const vRow = await dbGet("SELECT id FROM vehicles WHERE id = ?", [vid]);
    if (!vRow) return res.status(404).json({ error: "Vehicle not found." });
    const result = await dbRun(
      "INSERT INTO vehicle_photos (vehicle_id, path, caption) VALUES (?, ?, ?)",
      [vid, imgPath, caption || null]
    );
    res.status(201).json({ id: result.lastInsertRowid, vehicle_id: vid, path: imgPath, caption: caption || null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /vehicles/:vehicleId/photos/:photoId ───────────────────────────────
router.delete("/:vehicleId/photos/:photoId", async (req, res) => {
  const pid = Number(req.params.photoId);
  if (!isValidInt(pid, 1)) return res.status(400).json({ error: "Invalid photo id." });
  try {
    const row = await dbGet("SELECT path FROM vehicle_photos WHERE id = ?", [pid]);
    if (!row) return res.status(404).json({ error: "Photo not found." });
    const old = path.join(__dirname, "..", row.path);
    if (fs.existsSync(old)) fs.unlinkSync(old);
    await dbRun("DELETE FROM vehicle_photos WHERE id = ?", [pid]);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /logs/:logId/photos ──────────────────────────────────────────────────
// Reuse this router for log photos too (mounted separately in server.js)
router.post("/logs/:logId/photos", upload.single("image"), async (req, res) => {
  const lid = Number(req.params.logId);
  if (!isValidInt(lid, 1)) return res.status(400).json({ error: "Invalid log id." });
  if (!req.file)           return res.status(400).json({ error: "No image uploaded." });

  const imgPath = `/uploads/logphoto-${lid}-${Date.now()}${path.extname(req.file.originalname).toLowerCase()}`;
  // rename file to proper name
  fs.renameSync(req.file.path, path.join(__dirname, "..", imgPath));

  try {
    const result = await dbRun(
      "INSERT INTO log_photos (log_id, path) VALUES (?, ?)",
      [lid, imgPath]
    );
    res.status(201).json({ id: result.lastInsertRowid, log_id: lid, path: imgPath });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /logs/:logId/photos ───────────────────────────────────────────────────
router.get("/logs/:logId/photos", async (req, res) => {
  const lid = Number(req.params.logId);
  if (!isValidInt(lid, 1)) return res.status(400).json({ error: "Invalid log id." });
  try {
    const rows = await dbAll("SELECT * FROM log_photos WHERE log_id = ? ORDER BY created_at ASC", [lid]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function dbAll(sql, p = []) {
  try { return Promise.resolve(db.prepare(sql).all(p)); }
  catch (e) { return Promise.reject(e); }
}
function dbGet(sql, p = []) {
  try { return Promise.resolve(db.prepare(sql).get(p)); }
  catch (e) { return Promise.reject(e); }
}
function dbRun(sql, p = []) {
  try { return Promise.resolve(db.prepare(sql).run(p)); }
  catch (e) { return Promise.reject(e); }
}

module.exports = router;
