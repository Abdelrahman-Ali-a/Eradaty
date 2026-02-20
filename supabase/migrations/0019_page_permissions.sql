-- Add allowed_pages column to store page permissions for members
ALTER TABLE brand_members ADD COLUMN IF NOT EXISTS allowed_pages TEXT[] DEFAULT NULL;

-- Note: NULL allowed_pages means default access (likely all pages for owners/admins, but configurable for viewers)
-- We will implement logic: 
-- If role = 'owner' OR role = 'admin', access is full (ignore allowed_pages or set to NULL).
-- If role = 'editor' OR role = 'viewer', check allowed_pages IF NOT NULL.
