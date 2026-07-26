
-- Ensure lesson_audio bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson_audio', 'lesson_audio', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Ensure lesson_images bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson_images', 'lesson_images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public read access for lesson_audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated uploads for lesson_audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated updates for lesson_audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated deletes from lesson_audio" ON storage.objects;

DROP POLICY IF EXISTS "Public read access for lesson_images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated uploads for lesson_images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated updates for lesson_images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated deletes from lesson_images" ON storage.objects;

-- Create comprehensive policies for lesson_audio bucket
CREATE POLICY "Public read access for lesson_audio"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lesson_audio');

CREATE POLICY "Authenticated uploads for lesson_audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lesson_audio');

CREATE POLICY "Authenticated updates for lesson_audio"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'lesson_audio')
WITH CHECK (bucket_id = 'lesson_audio');

CREATE POLICY "Authenticated deletes from lesson_audio"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'lesson_audio');

-- Create comprehensive policies for lesson_images bucket
CREATE POLICY "Public read access for lesson_images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lesson_images');

CREATE POLICY "Authenticated uploads for lesson_images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lesson_images');

CREATE POLICY "Authenticated updates for lesson_images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'lesson_images')
WITH CHECK (bucket_id = 'lesson_images');

CREATE POLICY "Authenticated deletes from lesson_images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'lesson_images');
