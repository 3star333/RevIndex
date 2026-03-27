const express  = require("express");
const router   = express.Router();
const db       = require("../db/database");
const path     = require("path");
const fs       = require("fs");
const multer   = require("multer");
const { sanitizeString, isValidInt, isValidNumber } = require("../models/validate");

// ── Multer config ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads")),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `mod-${req.params.id}-${Date.now()}${ext}`);
  },
});
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const upload  = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    ALLOWED.includes(file.mimetype) ? cb(null, true) : cb(new Error("Invalid image type.")),
});

// ── GET /mods?vehicle_id=X ────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  const vid = Number(req.query.vehicle_id);
  if (!isValidInt(vid, 1)) return res.status(400).json({ error: "vehicle_id required." });
  try {
    const rows = await dbAll("SELECT * FROM mods WHERE vehicle_id = ? ORDER BY created_at DESC", [vid]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /mods ────────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  const vehicle_id   = Number(req.body.vehicle_id);
  const name         = sanitizeString(req.body.name);
  const category     = sanitizeString(req.body.category || "Other");
  const cost         = Number(req.body.cost) || 0;
  const install_date = req.body.install_date || null;
  const notes        = sanitizeString(req.body.notes || "");

  if (!isValidInt(vehicle_id, 1)) return res.status(400).json({ error: "vehicle_id required." });
  if (!name)                      return res.status(400).json({ error: "name required." });
  if (!isValidNumber(cost, 0))    return res.status(400).json({ error: "cost must be >= 0." });

  try {
    const result = await dbRun(
      "INSERT INTO mods (vehicle_id, name, category, cost, install_date, notes) VALUES (?, ?, ?, ?, ?, ?)",
      [vehicle_id, name, category, cost, install_date || null, notes || null]
    );
    res.status(201).json({ id: result.lastInsertRowid, vehicle_id, name, category, cost, install_date, notes: notes || null, image: null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /mods/:id/image ──────────────────────────────────────────────────────
router.post("/:id/image", upload.single("image"), async (req, res) => {
  const id = Number(req.params.id);
  if (!isValidInt(id, 1)) return res.status(400).json({ error: "Invalid mod id." });
  if (!req.file)          return res.status(400).json({ error: "No image uploaded." });

  const imagePath = `/uploads/${req.file.filename}`;
  try {
    const row = await dbGet("SELECT image FROM mods WHERE id = ?", [id]);
    if (!row) return res.status(404).json({ error: "Mod not found." });
    if (row.image) {
      const old = path.join(__dirname, "..", row.image);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    await dbRun("UPDATE mods SET image = ? WHERE id = ?", [imagePath, id]);
    res.json({ image: imagePath });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /mods/:id ──────────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!isValidInt(id, 1)) return res.status(400).json({ error: "Invalid mod id." });
  try {
    const row = await dbGet("SELECT image FROM mods WHERE id = ?", [id]);
    if (!row) return res.status(404).json({ error: "Mod not found." });
    if (row.image) {
      const old = path.join(__dirname, "..", row.image);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    await dbRun("DELETE FROM mods WHERE id = ?", [id]);
    res.json({ deleted: true });
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
