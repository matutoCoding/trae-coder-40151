import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db

  const dbPath = path.join(__dirname, '..', 'clinic.db')
  db = new Database(dbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'normal' CHECK(type IN ('normal', 'vip', 'emergency')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS dental_chairs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'occupied', 'maintenance')),
      location TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS queue_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL REFERENCES patients(id),
      queue_number TEXT NOT NULL UNIQUE,
      priority INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'waiting' CHECK(status IN ('waiting', 'serving', 'completed', 'cancelled')),
      chair_id INTEGER REFERENCES dental_chairs(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      called_at TEXT,
      completed_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_queue_status ON queue_entries(status);
    CREATE INDEX IF NOT EXISTS idx_queue_priority ON queue_entries(priority DESC, created_at ASC);

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chair_id INTEGER NOT NULL REFERENCES dental_chairs(id),
      patient_id INTEGER NOT NULL REFERENCES patients(id),
      queue_id INTEGER REFERENCES queue_entries(id),
      appointment_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'normal' CHECK(type IN ('normal', 'vip', 'emergency', 'followup')),
      status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
      reminder_status TEXT NOT NULL DEFAULT 'pending' CHECK(reminder_status IN ('pending', 'reminded', 'no_show', 'rescheduled')),
      reminder_time TEXT,
      no_show_reason TEXT,
      reminder_result TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_appointments_chair_date ON appointments(chair_id, appointment_date);
    CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

    CREATE TABLE IF NOT EXISTS appointment_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER NOT NULL REFERENCES appointments(id),
      action TEXT NOT NULL,
      remark TEXT,
      operator TEXT DEFAULT '前台',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_app_logs_appt ON appointment_logs(appointment_id);
  `)

  try {
    db.exec(`
      ALTER TABLE appointments ADD COLUMN reminder_status TEXT DEFAULT 'pending' CHECK(reminder_status IN ('pending', 'reminded', 'no_show', 'rescheduled'));
    `)
  } catch {}

  try {
    db.exec(`
      ALTER TABLE appointments ADD COLUMN reminder_time TEXT;
    `)
  } catch {}

  try {
    db.exec(`
      ALTER TABLE appointments ADD COLUMN no_show_reason TEXT;
    `)
  } catch {}

  try {
    db.exec(`
      ALTER TABLE appointments ADD COLUMN reminder_result TEXT;
    `)
  } catch {}

  const chairCount = db.prepare('SELECT COUNT(*) as count FROM dental_chairs').get() as { count: number }
  if (chairCount.count === 0) {
    db.exec(`
      INSERT INTO dental_chairs (name, status, location) VALUES
        ('1号椅', 'available', 'A区'),
        ('2号椅', 'available', 'A区'),
        ('3号椅', 'available', 'B区'),
        ('4号椅', 'available', 'B区'),
        ('5号椅', 'available', 'C区');
    `)
  }

  return db
}
