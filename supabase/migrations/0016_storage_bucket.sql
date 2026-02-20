-- Create a public storage bucket for brand logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('brands', 'brands', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on objects is managed by Supabase, skipping explicit enable to avoid permission errors
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all files in the 'brands' bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'brands' );

-- Allow authenticated users to upload files to the 'brands' bucket
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'brands' );

-- Allow authenticated users to update files in the 'brands' bucket
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'brands' );

-- Allow authenticated users to delete files in the 'brands' bucket
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'brands' );
