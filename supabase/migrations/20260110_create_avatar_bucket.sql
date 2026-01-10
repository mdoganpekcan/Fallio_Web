-- 1. Create Bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-avatars', 'profile-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Auth Users Insert" ON storage.objects;
DROP POLICY IF EXISTS "Auth Users Update" ON storage.objects;
DROP POLICY IF EXISTS "Auth Users Delete" ON storage.objects;

-- 3. Create RLS Policies
-- Public Read Access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profile-avatars' );

-- Authenticated Users can Upload (Insert)
CREATE POLICY "Auth Users Insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text -- Ensure users only upload to their own folder
);

-- Authenticated Users can Update their own files
CREATE POLICY "Auth Users Update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Authenticated Users can Delete their own files
CREATE POLICY "Auth Users Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
