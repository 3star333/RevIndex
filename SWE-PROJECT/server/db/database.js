const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "carlog.db");

const db = new Database(DB_PATH);
console.log("Connected to SQLite database at", DB_PATH);

// Enable foreign key support
db.pragma("foreign_keys = ON");

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS vehicles (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    make      TEXT    NOT NULL,
    model     TEXT    NOT NULL,
    year      INTEGER NOT NULL,
    nickname  TEXT,
    image     TEXT
  );

  CREATE TABLE IF NOT EXISTS logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id  INTEGER NOT NULL,
    type        TEXT    NOT NULL,
    cost        REAL    NOT NULL,
    mileage     INTEGER NOT NULL,
    notes       TEXT,
    date        TEXT    NOT NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );

  CREATE TABLE IF NOT EXISTS listings (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    make           TEXT    NOT NULL,
    model          TEXT    NOT NULL,
    year           INTEGER NOT NULL,
    price          REAL    NOT NULL,
    mileage        INTEGER NOT NULL,
    condition      TEXT    NOT NULL DEFAULT 'good',
    mod_adjustment REAL    NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS vehicle_photos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id  INTEGER NOT NULL,
    path        TEXT    NOT NULL,
    caption     TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );

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
  );

  CREATE TABLE IF NOT EXISTS log_photos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    log_id     INTEGER NOT NULL,
    path       TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (log_id) REFERENCES logs(id)
  );

  CREATE TABLE IF NOT EXISTS threads (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id  INTEGER NOT NULL,
    title       TEXT    NOT NULL,
    description TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id  INTEGER NOT NULL,
    author     TEXT    NOT NULL DEFAULT 'Anonymous',
    content    TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (thread_id) REFERENCES threads(id)
  );
`);

// Migrations — safe to run on existing DBs
for (const sql of [
  "ALTER TABLE vehicles ADD COLUMN image TEXT",
  "ALTER TABLE vehicles ADD COLUMN vin TEXT",
]) {
  try { db.exec(sql); } catch (e) {
    if (!e.message.includes("duplicate column")) console.error("Migration error:", e.message);
  }
}

console.log("Database tables verified/created.");

// ── Async-compatible helpers (better-sqlite3 is sync, wrap for route compat) ──
db.allAsync = (sql, params = []) => {
  try { return Promise.resolve(db.prepare(sql).all(params)); }
  catch (e) { return Promise.reject(e); }
};
db.getAsync = (sql, params = []) => {
  try { return Promise.resolve(db.prepare(sql).get(params)); }
  catch (e) { return Promise.reject(e); }
};
db.runAsync = (sql, params = []) => {
  try { return Promise.resolve(db.prepare(sql).run(params)); }
  catch (e) { return Promise.reject(e); }
};

module.exports = db;
