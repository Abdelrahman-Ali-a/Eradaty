-- Helper function to check membership (Security Definer to bypass RLS and avoid recursion)
CREATE OR REPLACE FUNCTION is_brand_member(_brand_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM brands WHERE id = _brand_id AND owner_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM brand_members WHERE brand_id = _brand_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create brand members table
CREATE TABLE IF NOT EXISTS brand_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(brand_id, user_id)
);

-- Enable RLS
ALTER TABLE brand_members ENABLE ROW LEVEL SECURITY;

-- Owner can manage members
DROP POLICY IF EXISTS "Brand owners can manage members" ON brand_members;
CREATE POLICY "Brand owners can manage members" ON brand_members
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM brands
            WHERE brands.id = brand_members.brand_id
            AND brands.owner_user_id = auth.uid()
        )
    );

-- Members can view other members (to see team)
DROP POLICY IF EXISTS "Members can view members" ON brand_members;
CREATE POLICY "Members can view members" ON brand_members
    FOR SELECT
    USING ( is_brand_member(brand_id) );
