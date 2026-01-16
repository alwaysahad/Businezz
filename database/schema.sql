-- ============================================
-- INVOICEFLOW DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- BUSINESS PROFILE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS business_profile (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  phone TEXT,
  email TEXT,
  tax_id TEXT,
  logo TEXT,
  currency TEXT DEFAULT '₹',
  tax_rate DECIMAL(5,2) DEFAULT 18,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  currency TEXT DEFAULT '₹',
  tax_rate DECIMAL(5,2) DEFAULT 18,
  tax_label TEXT DEFAULT 'Tax',
  invoice_prefix TEXT DEFAULT 'INV',
  default_payment_terms TEXT DEFAULT 'Due on receipt',
  show_logo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CUSTOMERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'piece',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- ============================================
-- INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  tax_rate DECIMAL(5,2) DEFAULT 0,
  discount DECIMAL(5,2) DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_name);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE business_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to business_profile" ON business_profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to settings" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- AUTO UPDATE TIMESTAMP
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_profile_updated_at BEFORE UPDATE ON business_profile FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DEFAULT DATA
-- ============================================

INSERT INTO business_profile (id, name, currency, tax_rate) VALUES ('default', '', '₹', 18) ON CONFLICT (id) DO NOTHING;
INSERT INTO settings (id, currency, tax_rate, invoice_prefix, default_payment_terms, show_logo, tax_label) VALUES ('default', '₹', 18, 'INV', 'Due on receipt', true, 'Tax') ON CONFLICT (id) DO NOTHING;
