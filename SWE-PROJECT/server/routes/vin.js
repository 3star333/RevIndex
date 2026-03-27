const express = require("express");
const https   = require("https");
const db      = require("../db/database");

const router = express.Router();

const NHTSA_BASE = "https://vpic.nhtsa.dot.gov/api/vehicles";

// ── helpers ───────────────────────────────────────────────────────────────────

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let raw = "";
      res.on("data", (chunk) => { raw += chunk; });
      res.on("end", () => {
        try { resolve(JSON.parse(raw)); }
        catch { reject(new Error("Invalid JSON from NHTSA")); }
      });
    }).on("error", reject);
  });
}

function extractField(results, variable) {
  const hit = results.find((r) => r.Variable === variable);
  return hit?.Value && hit.Value !== "Not Applicable" ? hit.Value : null;
}

// ── ensure vin_cache table ─────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS vin_cache (
    vin        TEXT PRIMARY KEY,
    year       INTEGER,
    make       TEXT,
    model      TEXT,
    trim       TEXT,
    engine     TEXT,
    body_style TEXT,
    drive_type TEXT,
    fuel_type  TEXT,
    raw        TEXT,
    decoded_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// ── GET /vin/decode?vin=XXXXX ──────────────────────────────────────────────────
router.get("/decode", async (req, res) => {
  const vin = (req.query.vin || "").trim().toUpperCase();

  if (!vin || vin.length !== 17) {
    return res.status(400).json({ error: "VIN must be exactly 17 characters." });
  }
  if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) {
    return res.status(400).json({ error: "VIN contains invalid characters." });
  }

  try {
    // 1. Cache check
    const row = db.prepare("SELECT * FROM vin_cache WHERE vin = ?").get(vin);

    if (row) {
      return res.json({
        vin,
        year:       row.year,
        make:       row.make,
        model:      row.model,
        trim:       row.trim,
        engine:     row.engine,
        body_style: row.body_style,
        drive_type: row.drive_type,
        fuel_type:  row.fuel_type,
        cached:     true,
      });
    }

    // 2. Fetch from NHTSA
    const url  = `${NHTSA_BASE}/DecodeVin/${vin}?format=json`;
    const data = await httpsGet(url);
    const results = data.Results || [];

    const errorCode = extractField(results, "Error Code");
    if (errorCode && errorCode !== "0") {
      const errorText = extractField(results, "Error Text") || "Unknown VIN error";
      return res.status(422).json({ error: `NHTSA: ${errorText}` });
    }

    const decoded = {
      vin,
      year:       parseInt(extractField(results, "Model Year"), 10) || null,
      make:       extractField(results, "Make"),
      model:      extractField(results, "Model"),
      trim:       extractField(results, "Trim"),
      engine:     buildEngineString(results),
      body_style: extractField(results, "Body Class"),
      drive_type: extractField(results, "Drive Type"),
      fuel_type:  extractField(results, "Fuel Type - Primary"),
    };

    // 3. Store in cache
    db.prepare(
      `INSERT OR REPLACE INTO vin_cache
         (vin, year, make, model, trim, engine, body_style, drive_type, fuel_type, raw)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      decoded.vin, decoded.year, decoded.make, decoded.model,
      decoded.trim, decoded.engine, decoded.body_style,
      decoded.drive_type, decoded.fuel_type,
      JSON.stringify(results)
    );

    return res.json({ ...decoded, cached: false });
  } catch (fetchErr) {
    console.error("VIN decode error:", fetchErr.message);
    return res.status(502).json({ error: "Failed to reach NHTSA API. Try again later." });
  }
});

// ── GET /vin/makes ─────────────────────────────────────────────────────────────
router.get("/makes", async (req, res) => {
  try {
    const data = await httpsGet(`${NHTSA_BASE}/GetAllMakes?format=json`);
    const makes = (data.Results || [])
      .map((m) => ({ id: m.Make_ID, name: m.Make_Name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    res.json(makes);
  } catch {
    res.status(502).json({ error: "Failed to fetch makes from NHTSA." });
  }
});

// ── GET /vin/models?make=Toyota&year=2020 ─────────────────────────────────────
router.get("/models", async (req, res) => {
  const { make, year } = req.query;
  if (!make) return res.status(400).json({ error: "make is required." });

  try {
    const url = year
      ? `${NHTSA_BASE}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`
      : `${NHTSA_BASE}/GetModelsForMake/${encodeURIComponent(make)}?format=json`;
    const data = await httpsGet(url);
    const models = [...new Set((data.Results || []).map((m) => m.Model_Name))].sort();
    res.json(models);
  } catch {
    res.status(502).json({ error: "Failed to fetch models from NHTSA." });
  }
});

// ── helpers ───────────────────────────────────────────────────────────────────

function buildEngineString(results) {
  const displacement = extractField(results, "Displacement (L)");
  const cylinders    = extractField(results, "Engine Number of Cylinders");
  const config       = extractField(results, "Engine Configuration");
  const hp           = extractField(results, "Engine Brake (hp) From");

  const parts = [];
  if (displacement) parts.push(`${parseFloat(displacement).toFixed(1)}L`);
  if (config && cylinders) parts.push(`${config}${cylinders}`);
  else if (cylinders) parts.push(`${cylinders}-cyl`);
  if (hp) parts.push(`${hp}hp`);

  return parts.length ? parts.join(" ") : null;
}

module.exports = router;
