-- 001_init.sql
-- 1. Users
CREATE TABLE IF NOT EXISTS users (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  email          TEXT    UNIQUE NOT NULL,
  full_name      TEXT    NOT NULL,
  role           TEXT    NOT NULL,
  manager_id     INTEGER,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(manager_id) REFERENCES users(id)
);

-- 2. Leads
CREATE TABLE IF NOT EXISTS leads (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name          TEXT    NOT NULL,
  last_name           TEXT    NOT NULL,
  email               TEXT    NOT NULL,
  phone               TEXT    NOT NULL,
  address             TEXT,
  url                 TEXT,
  utm_campaign        TEXT,
  utm_source          TEXT,
  utm_medium          TEXT,
  utm_content         TEXT,
  notes               TEXT,
  stage               TEXT    NOT NULL,
  status              TEXT    NOT NULL,
  assigned_to         INTEGER,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  first_contact_at    DATETIME,
  last_contacted_at   DATETIME,
  contacts_count      INTEGER DEFAULT 0,
  FOREIGN KEY(assigned_to) REFERENCES users(id)
);

-- 3. Timeline events
CREATE TABLE IF NOT EXISTS timeline_events (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id        INTEGER NOT NULL,
  user_id        INTEGER,
  medium         TEXT    NOT NULL,
  direction      TEXT    NOT NULL,
  timestamp      DATETIME DEFAULT CURRENT_TIMESTAMP,
  duration_sec   INTEGER,
  subject        TEXT,
  body           TEXT,
  metadata       JSON,
  FOREIGN KEY(lead_id) REFERENCES leads(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);
