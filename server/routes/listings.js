const express                            = require("express");
const router                             = express.Router();
const db                                 = require("../db/database");
const { rankListings, VALID_CONDITIONS } = require("../models/scorer");
const { sanitizeString, isValidInt, isValidNumber } = require("../models/validate");

// ── GET /listings ─────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const rows   = await dbAll("SELECT * FROM listings");
    const ranked = rankListings(rows);
    res.json(ranked);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /listings ────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  const make           = sanitizeString(req.body.make);
  const model          = sanitizeString(req.body.model);
  const year           = Number(req.body.year);
  const price          = Number(req.body.price);
  const mileage        = Number(req.body.mileage);
  const condition      = sanitizeString(req.body.condition || "good");
  const mod_adjustment = Number(req.body.mod_adjustment) || 0;

  if (!make || !model)                                    return res.status(400).json({ error: "make and model are required." });
  if (!isValidInt(year, 1886, new Date().getFullYear() + 2)) return res.status(400).json({ error: "year must be a valid 4-digit year." });
  if (!isValidNumber(price, 0))                          return res.status(400).json({ error: "price must be a non-negative number." });
  if (!isValidInt(mileage, 0))                           return res.status(400).json({ error: "mileage must be a non-negative integer." });
  if (!VALID_CONDITIONS.includes(condition.toLowerCase())) return res.status(400).json({ error: `condition must be one of: ${VALID_CONDITIONS.join(", ")}` });
  if (!isValidNumber(mod_adjustment))                    return res.status(400).json({ error: "mod_adjustment must be a number." });

  try {
    const result = await dbRun(
      `INSERT INTO listings (make, model, year, price, mileage, condition, mod_adjustment)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [make, model, year, price, mileage, condition.toLowerCase(), mod_adjustment]
    );
    res.status(201).json({ id: result.lastID, make, model, year, price, mileage, condition: condition.toLowerCase(), mod_adjustment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
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


