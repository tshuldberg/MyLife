export const CREATE_PETS = `
CREATE TABLE IF NOT EXISTS pt_pets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  birth_date TEXT,
  adoption_date TEXT,
  sex TEXT NOT NULL DEFAULT 'unknown',
  is_sterilized INTEGER NOT NULL DEFAULT 0,
  microchip_id TEXT,
  current_weight_grams INTEGER,
  image_uri TEXT,
  notes TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_VET_VISITS = `
CREATE TABLE IF NOT EXISTS pt_vet_visits (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL REFERENCES pt_pets(id) ON DELETE CASCADE,
  visit_date TEXT NOT NULL,
  visit_type TEXT NOT NULL DEFAULT 'other',
  reason TEXT NOT NULL,
  clinic_name TEXT,
  veterinarian TEXT,
  diagnosis TEXT,
  treatment TEXT,
  weight_grams INTEGER,
  cost_cents INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_VACCINATIONS = `
CREATE TABLE IF NOT EXISTS pt_vaccinations (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL REFERENCES pt_pets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date_given TEXT NOT NULL,
  next_due_date TEXT,
  veterinarian TEXT,
  lot_number TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_MEDICATIONS = `
CREATE TABLE IF NOT EXISTS pt_medications (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL REFERENCES pt_pets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT NOT NULL,
  interval_days INTEGER,
  starts_on TEXT NOT NULL,
  ends_on TEXT,
  next_due_at TEXT,
  last_given_at TEXT,
  prescribed_by TEXT,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_MEDICATION_LOGS = `
CREATE TABLE IF NOT EXISTS pt_medication_logs (
  id TEXT PRIMARY KEY,
  medication_id TEXT NOT NULL REFERENCES pt_medications(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'given',
  logged_at TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_WEIGHT_ENTRIES = `
CREATE TABLE IF NOT EXISTS pt_weight_entries (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL REFERENCES pt_pets(id) ON DELETE CASCADE,
  weight_grams INTEGER NOT NULL,
  body_condition_score INTEGER,
  logged_at TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_FEEDING_SCHEDULES = `
CREATE TABLE IF NOT EXISTS pt_feeding_schedules (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL REFERENCES pt_pets(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  food_name TEXT,
  amount TEXT,
  feed_at TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_EXPENSES = `
CREATE TABLE IF NOT EXISTS pt_expenses (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL REFERENCES pt_pets(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  spent_on TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS pt_pets_archived_idx ON pt_pets(is_archived, name)`,
  `CREATE INDEX IF NOT EXISTS pt_vet_visits_pet_idx ON pt_vet_visits(pet_id, visit_date DESC)`,
  `CREATE INDEX IF NOT EXISTS pt_vaccinations_pet_idx ON pt_vaccinations(pet_id, next_due_date)`,
  `CREATE INDEX IF NOT EXISTS pt_vaccinations_due_idx ON pt_vaccinations(next_due_date)`,
  `CREATE INDEX IF NOT EXISTS pt_medications_pet_idx ON pt_medications(pet_id, next_due_at)`,
  `CREATE INDEX IF NOT EXISTS pt_medications_due_idx ON pt_medications(next_due_at, is_active)`,
  `CREATE INDEX IF NOT EXISTS pt_medication_logs_med_idx ON pt_medication_logs(medication_id, logged_at DESC)`,
  `CREATE INDEX IF NOT EXISTS pt_weight_entries_pet_idx ON pt_weight_entries(pet_id, logged_at DESC)`,
  `CREATE INDEX IF NOT EXISTS pt_feeding_schedules_pet_idx ON pt_feeding_schedules(pet_id, feed_at)`,
  `CREATE INDEX IF NOT EXISTS pt_expenses_pet_idx ON pt_expenses(pet_id, spent_on DESC)`,
];

export const ALL_TABLES = [
  CREATE_PETS,
  CREATE_VET_VISITS,
  CREATE_VACCINATIONS,
  CREATE_MEDICATIONS,
  CREATE_MEDICATION_LOGS,
  CREATE_WEIGHT_ENTRIES,
  CREATE_FEEDING_SCHEDULES,
  CREATE_EXPENSES,
];
