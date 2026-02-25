export const CREATE_LISTINGS = `
CREATE TABLE IF NOT EXISTS hm_listings (
  id TEXT PRIMARY KEY,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  bedrooms REAL NOT NULL DEFAULT 0,
  bathrooms REAL NOT NULL DEFAULT 0,
  sqft INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  is_saved INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_TOURS = `
CREATE TABLE IF NOT EXISTS hm_tours (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES hm_listings(id) ON DELETE CASCADE,
  tour_at TEXT NOT NULL,
  agent_name TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`;

export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS hm_listings_status_idx ON hm_listings(status)`,
  `CREATE INDEX IF NOT EXISTS hm_listings_saved_idx ON hm_listings(is_saved)`,
  `CREATE INDEX IF NOT EXISTS hm_listings_price_idx ON hm_listings(price_cents)`,
  `CREATE INDEX IF NOT EXISTS hm_tours_listing_idx ON hm_tours(listing_id)`,
  `CREATE INDEX IF NOT EXISTS hm_tours_time_idx ON hm_tours(tour_at DESC)`,
];

export const ALL_TABLES = [CREATE_LISTINGS, CREATE_TOURS];
