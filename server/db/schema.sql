CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin'))
);

CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  model TEXT NOT NULL CHECK (model IN ('management_fee', 'revenue_share')),
  fee_percent NUMERIC(5,2) DEFAULT 0,
  revenue_share_percent NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id),
  guest_name TEXT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  revenue NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id),
  description TEXT NOT NULL,
  amount NUMERIC(12,2) DEFAULT 0,
  category TEXT NOT NULL,
  incurred_on DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id),
  amount NUMERIC(12,2) DEFAULT 0,
  paid_on DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
