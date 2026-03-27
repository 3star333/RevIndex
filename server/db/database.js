const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const DB_PATH = path.join(__dirname, "carlog.db");

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Failed to connect to SQLite database:", err.message);
  } else {
    console.log("Connected to SQLite database at", DB_PATH);
  }
});

// Enable foreign key support
db.run("PRAGMA foreign_keys = ON");

// Create tables if they don't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      make      TEXT    NOT NULL,
      model     TEXT    NOT NULL,
      year      INTEGER NOT NULL,
      nickname  TEXT,
      image     TEXT
    )
  `);

  // Add image column to existing databases that don't have it
  db.run(`ALTER TABLE vehicles ADD COLUMN image TEXT`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
      console.error("Migration error:", err.message);
    }
  });

  // Add vin column to existing databases that don't have it
  db.run(`ALTER TABLE vehicles ADD COLUMN vin TEXT`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
      console.error("Migration error (vin):", err.message);
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id  INTEGER NOT NULL,
      type        TEXT    NOT NULL,
      cost        REAL    NOT NULL,
      mileage     INTEGER NOT NULL,
      notes       TEXT,
      date        TEXT    NOT NULL,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS listings (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      make           TEXT    NOT NULL,
      model          TEXT    NOT NULL,
      year           INTEGER NOT NULL,
      price          REAL    NOT NULL,
      mileage        INTEGER NOT NULL,
      condition      TEXT    NOT NULL DEFAULT 'good',
      mod_adjustment REAL    NOT NULL DEFAULT 0
    )
  `);

  // ── Vehicle photos (multiple per vehicle) ─────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS vehicle_photos (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id  INTEGER NOT NULL,
      path        TEXT    NOT NULL,
      caption     TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    )
  `);

  // ── Mods ──────────────────────────────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS mods (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id   INTEGER NOT NULL,
      name         TEXT    NOT NULL,
      category     TEXT    NOT NULL DEFAULT 'Other',
      cost         REAL    NOT NULL DEFAULT 0,
      install_date TEXT,
      notes        TEXT,
      image        TEXT,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    )
  `);

  // ── Log photos (multiple per log entry) ───────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS log_photos (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      log_id     INTEGER NOT NULL,
      path       TEXT    NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (log_id) REFERENCES logs(id)
    )
  `);

  // ── Forum threads (build threads per vehicle) ─────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS threads (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id  INTEGER NOT NULL,
      title       TEXT    NOT NULL,
      description TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    )
  `);

  // ── Forum comments ────────────────────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id  INTEGER NOT NULL,
      author     TEXT    NOT NULL DEFAULT 'Anonymous',
      content    TEXT    NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (thread_id) REFERENCES threads(id)
    )
  `);

  console.log("Database tables verified/created.");
});

module.exports = db;
