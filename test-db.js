import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ziwgdblrdpwhponnlyrk.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppd2dkYmxyZHB3aHBvbm5seXJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYzNDg2NSwiZXhwIjoyMDg3MjEwODY1fQ.qExMCvTtLlNekMFkMvCGC1PO9St37WeBkVHECYu76p8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const SQL = `
-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT,
  category TEXT
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year_range TEXT,
  engine TEXT,
  internal_code TEXT UNIQUE,
  manufacturer_code TEXT,
  measurements TEXT,
  condition TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 2,
  location TEXT,
  notes TEXT,
  photo_url TEXT,
  acquisition_cost REAL DEFAULT 0,
  trade_in_value REAL DEFAULT 0,
  logistics_cost REAL DEFAULT 0,
  rectification_cost REAL DEFAULT 0,
  total_cost REAL DEFAULT 0,
  sale_price REAL DEFAULT 0,
  min_price REAL DEFAULT 0,
  markup REAL DEFAULT 0,
  suggested_price REAL DEFAULT 0,
  warranty_days INTEGER DEFAULT 90,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Movements
CREATE TABLE IF NOT EXISTS movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  user_id INTEGER,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  document TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  type TEXT DEFAULT 'PF',
  preferences TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  customer_name TEXT,
  customer_document TEXT,
  total_value REAL NOT NULL,
  total_cost REAL NOT NULL,
  margin REAL NOT NULL,
  origin TEXT DEFAULT 'DIRECT',
  fiscal_status TEXT DEFAULT 'PENDING',
  warranty_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER NOT NULL,
  product_id INTEGER,
  service_name TEXT,
  quantity INTEGER,
  unit_price REAL NOT NULL,
  unit_cost REAL NOT NULL,
  type TEXT NOT NULL
);

-- Trade Ins
CREATE TABLE IF NOT EXISTS trade_ins (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER,
  description TEXT NOT NULL,
  estimated_value REAL NOT NULL,
  condition TEXT,
  status TEXT DEFAULT 'RECEIVED',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sale Returns
CREATE TABLE IF NOT EXISTS sale_returns (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  condition TEXT NOT NULL,
  refund_amount REAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial Transactions
CREATE TABLE IF NOT EXISTS financial_transactions (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  sale_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  module TEXT NOT NULL,
  config TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module)
);
`;

async function setup() {
    console.log("Creating tables via Supabase SQL...");
    const { error } = await supabase.rpc('exec_sql', { query: SQL });
    if (error) {
        // Try via pg-meta endpoint
        console.log("RPC error:", error.message, "- Trying direct query...");
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'apikey': SUPABASE_SERVICE_KEY
            },
            body: JSON.stringify({ query: SQL })
        });
        const body = await res.json();
        console.log("Direct result:", res.status, JSON.stringify(body).substring(0, 200));
    } else {
        console.log("Tables created successfully!");
    }
    process.exit(0);
}

setup();
