const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "carlog.db");

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

  CREATE TABLE IF NOT EXISTS performance_runs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id  INTEGER NOT NULL,
    run_type    TEXT    NOT NULL DEFAULT 'Dyno',
    date        TEXT    NOT NULL,
    hp          REAL,
    tq          REAL,
    zero_sixty  REAL,
    quarter_et  REAL,
    quarter_mph REAL,
    boost_psi   REAL,
    notes       TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );

  CREATE TABLE IF NOT EXISTS fuel_logs (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id    INTEGER NOT NULL,
    date          TEXT    NOT NULL,
    gallons       REAL    NOT NULL,
    price_per_gal REAL    NOT NULL DEFAULT 0,
    mileage       INTEGER NOT NULL,
    notes         TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );

  CREATE TABLE IF NOT EXISTS wishlist (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id  INTEGER NOT NULL,
    name        TEXT    NOT NULL,
    category    TEXT    NOT NULL DEFAULT 'Other',
    price       REAL    NOT NULL DEFAULT 0,
    priority    TEXT    NOT NULL DEFAULT 'Medium',
    link        TEXT,
    notes       TEXT,
    done        INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );

  CREATE TABLE IF NOT EXISTS specs (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id   INTEGER NOT NULL UNIQUE,
    hp_stock     REAL,
    tq_stock     REAL,
    hp_current   REAL,
    tq_current   REAL,
    transmission TEXT,
    drive_type   TEXT,
    springs      TEXT,
    sway_bar_f   TEXT,
    sway_bar_r   TEXT,
    wheel_size_f TEXT,
    wheel_size_r TEXT,
    tire_size_f  TEXT,
    tire_size_r  TEXT,
    curb_weight  REAL,
    notes        TEXT,
    updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );

  CREATE TABLE IF NOT EXISTS track_days (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id  INTEGER NOT NULL,
    date        TEXT    NOT NULL,
    track       TEXT    NOT NULL,
    event_type  TEXT    NOT NULL DEFAULT 'Track Day',
    best_lap    TEXT,
    conditions  TEXT    NOT NULL DEFAULT 'Dry',
    notes       TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );
`);

// Users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    username           TEXT    NOT NULL UNIQUE,
    email              TEXT    NOT NULL UNIQUE,
    password_hash      TEXT    NOT NULL,
    avatar_url         TEXT,
    bio                TEXT,
    email_verified     INTEGER NOT NULL DEFAULT 0,
    verification_token TEXT,
    created_at         TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// Migrations — safe to run on existing DBs
for (const sql of [
  "ALTER TABLE vehicles ADD COLUMN image TEXT",
  "ALTER TABLE vehicles ADD COLUMN vin TEXT",
  "ALTER TABLE threads ADD COLUMN tag TEXT DEFAULT 'General'",
  "ALTER TABLE comments ADD COLUMN likes INTEGER DEFAULT 0",
  "ALTER TABLE vehicles ADD COLUMN user_id INTEGER REFERENCES users(id)",
  "ALTER TABLE vehicles ADD COLUMN is_public INTEGER NOT NULL DEFAULT 1",
  "ALTER TABLE logs ADD COLUMN is_public INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE threads ADD COLUMN user_id INTEGER REFERENCES users(id)",
  "ALTER TABLE comments ADD COLUMN user_id INTEGER REFERENCES users(id)",
  "ALTER TABLE users ADD COLUMN profile_gif TEXT",
  "ALTER TABLE users ADD COLUMN signature TEXT",
  "ALTER TABLE users ADD COLUMN last_seen_at TEXT",
  "ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0",
]) {
  try { db.exec(sql); } catch (e) {
    if (!e.message.includes("duplicate column")) console.error("Migration error:", e.message);
  }
}

console.log("Database tables verified/created.");

// Seed "dev" user and assign existing orphaned data to them
const bcrypt = require("bcryptjs");
const devUser = db.prepare("SELECT id FROM users WHERE username = 'dev'").get();
if (!devUser) {
  const hash = bcrypt.hashSync("devpassword123", 10);
  db.prepare(`INSERT INTO users (username, email, password_hash, email_verified)
              VALUES ('dev', 'dev@revindex.local', ?, 1)`).run(hash);
  console.log("Dev user created.");
}
const devId = db.prepare("SELECT id FROM users WHERE username = 'dev'").get().id;
db.prepare("UPDATE users SET is_admin = 1 WHERE username = 'dev'").run();
db.prepare("UPDATE vehicles SET user_id = ? WHERE user_id IS NULL").run(devId);
db.prepare("UPDATE threads  SET user_id = ? WHERE user_id IS NULL").run(devId);
db.prepare("UPDATE comments SET user_id = ? WHERE user_id IS NULL").run(devId);

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
