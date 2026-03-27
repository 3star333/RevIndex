const express  = require("express");
const router   = express.Router();
const db       = require("../db/database");
const path     = require("path");
const fs       = require("fs");
const multer   = require("multer");
const { sanitizeString, isValidInt } = require("../models/validate");

// ── Multer config: store in /uploads with original extension ──────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `vehicle-${req.params.id}-${Date.now()}${ext}`);
  },
});
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WEBP, and GIF images are allowed."));
    }
  },
});

// ── GET /vehicles ─────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM vehicles ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /vehicles ────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  const make     = sanitizeString(req.body.make);
  const model    = sanitizeString(req.body.model);
  const year     = Number(req.body.year);
  const nickname = sanitizeString(req.body.nickname || "");
  const vin      = sanitizeString((req.body.vin || "").toUpperCase());

  if (!make || !model) {
    return res.status(400).json({ error: "make and model are required." });
  }
  if (!isValidInt(year, 1886, new Date().getFullYear() + 2)) {
    return res.status(400).json({ error: "year must be a valid 4-digit year." });
  }
  if (vin && vin.length !== 17) {
    return res.status(400).json({ error: "VIN must be exactly 17 characters." });
  }

  try {
    const result = await dbRun(
      "INSERT INTO vehicles (make, model, year, nickname, vin) VALUES (?, ?, ?, ?, ?)",
      [make, model, year, nickname || null, vin || null]
    );
    res.status(201).json({ id: result.lastID, make, model, year, nickname: nickname || null, vin: vin || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /vehicles/:id ──────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!isValidInt(id, 1)) return res.status(400).json({ error: "Invalid vehicle id." });

  try {
    const row = await dbGet("SELECT * FROM vehicles WHERE id = ?", [id]);
    if (!row) return res.status(404).json({ error: "Vehicle not found." });

    // Delete main vehicle image file
    if (row.image) {
      const imgPath = path.join(__dirname, "..", row.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    // Delete vehicle_photos files
    const vPhotos = await dbAll("SELECT path FROM vehicle_photos WHERE vehicle_id = ?", [id]);
    for (const p of vPhotos) {
      const f = path.join(__dirname, "..", p.path);
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }

    // Delete mod image files
    const mods = await dbAll("SELECT image FROM mods WHERE vehicle_id = ?", [id]);
    for (const m of mods) {
      if (m.image) {
        const f = path.join(__dirname, "..", m.image);
        if (fs.existsSync(f)) fs.unlinkSync(f);
      }
    }

    // Delete log photos for all logs of this vehicle
    const logs = await dbAll("SELECT id FROM logs WHERE vehicle_id = ?", [id]);
    for (const l of logs) {
      const lPhotos = await dbAll("SELECT path FROM log_photos WHERE log_id = ?", [l.id]);
      for (const p of lPhotos) {
        const f = path.join(__dirname, "..", p.path);
        if (fs.existsSync(f)) fs.unlinkSync(f);
      }
      await dbRun("DELETE FROM log_photos WHERE log_id = ?", [l.id]);
    }

    // Cascade delete all related DB rows
    await dbRun("DELETE FROM vehicle_photos WHERE vehicle_id = ?", [id]);
    await dbRun("DELETE FROM mods WHERE vehicle_id = ?", [id]);
    await dbRun("DELETE FROM logs WHERE vehicle_id = ?", [id]);
    await dbRun("DELETE FROM comments WHERE thread_id IN (SELECT id FROM threads WHERE vehicle_id = ?)", [id]);
    await dbRun("DELETE FROM threads WHERE vehicle_id = ?", [id]);
    await dbRun("DELETE FROM vehicles WHERE id = ?", [id]);

    res.json({ deleted: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /vehicles/:id/image ──────────────────────────────────────────────────
router.post("/:id/image", upload.single("image"), async (req, res) => {
  const id = Number(req.params.id);
  if (!isValidInt(id, 1)) {
    return res.status(400).json({ error: "Invalid vehicle id." });
  }
  if (!req.file) {
    return res.status(400).json({ error: "No image file uploaded." });
  }

  const imagePath = `/uploads/${req.file.filename}`;

  try {
    // Delete old image file if it exists
    const row = await dbGet("SELECT image FROM vehicles WHERE id = ?", [id]);
    if (!row) return res.status(404).json({ error: "Vehicle not found." });
    if (row.image) {
      const oldPath = path.join(__dirname, "..", row.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await dbRun("UPDATE vehicles SET image = ? WHERE id = ?", [imagePath, id]);
    res.json({ image: imagePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /vehicles/:id/logs ────────────────────────────────────────────────────
router.get("/:id/logs", async (req, res) => {
  const id = Number(req.params.id);
  if (!isValidInt(id, 1)) {
    return res.status(400).json({ error: "Invalid vehicle id." });
  }
  try {
    const rows = await dbAll(
      "SELECT * FROM logs WHERE vehicle_id = ? ORDER BY date DESC",
      [id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /vehicles/:id ─────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!isValidInt(id, 1)) {
    return res.status(400).json({ error: "Invalid vehicle id." });
  }
  try {
    const row = await dbGet("SELECT * FROM vehicles WHERE id = ?", [id]);
    if (!row) return res.status(404).json({ error: "Vehicle not found." });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Helpers: promisify sqlite3 callbacks ──────────────────────────────────────
function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      err ? reject(err) : resolve(this);
    });
  });
}

module.exports = router;
