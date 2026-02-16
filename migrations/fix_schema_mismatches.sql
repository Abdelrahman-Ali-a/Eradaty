-- Database Schema Fixes for Eradaty
-- Run these migrations in your Supabase SQL Editor

-- 1. Add is_default column to wallets table
ALTER TABLE wallets 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Set one wallet as default if none exists
UPDATE wallets 
SET is_default = true 
WHERE id = (
  SELECT id FROM wallets 
  WHERE brand_id = (SELECT id FROM brands LIMIT 1)
  ORDER BY created_at ASC 
  LIMIT 1
)
AND NOT EXISTS (
  SELECT 1 FROM wallets WHERE is_default = true
);

-- 2. Add period_year column to salary_payments
ALTER TABLE salary_payments 
ADD COLUMN IF NOT EXISTS period_year INTEGER;

-- Populate period_year from period_month if it contains year info
-- Example: "January 2026" -> 2026
UPDATE salary_payments 
SET period_year = CAST(
  SUBSTRING(period_month FROM '\d{4}') AS INTEGER
)
WHERE period_month ~ '\d{4}' AND period_year IS NULL;

-- 3. Fix costs description field type (from boolean to text)
-- This requires dropping and recreating the column
ALTER TABLE costs 
DROP COLUMN IF EXISTS description CASCADE;

ALTER TABLE costs 
ADD COLUMN description TEXT;

-- 4. Add read_at column to notifications (optional - for backward compatibility)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Sync read_at with read field
UPDATE notifications 
SET read_at = updated_at 
WHERE read = true AND read_at IS NULL;

-- 5. Create index on is_default for faster queries
CREATE INDEX IF NOT EXISTS idx_wallets_is_default 
ON wallets(brand_id, is_default) 
WHERE is_default = true;

-- 6. Create index on notifications read status
CREATE INDEX IF NOT EXISTS idx_notifications_read 
ON notifications(brand_id, read, created_at DESC);

-- Verification queries
-- Run these to verify the changes worked:

-- Check wallets structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'wallets' AND column_name IN ('is_default', 'is_basic');

-- Check salary_payments structure  
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'salary_payments' AND column_name IN ('period_month', 'period_year');

-- Check costs description type
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'costs' AND column_name = 'description';

-- Check notifications structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'notifications' AND column_name IN ('read', 'read_at');
