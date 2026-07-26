
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public access for lesson_audio" ON storage.objects;
DROP POLICY IF EXISTS "Public access for lesson_images" ON storage.objects;

-- Create comprehensive public policies for lesson_audio bucket
CREATE POLICY "Public access for lesson_audio"
ON storage.objects FOR ALL
TO public
USING (bucket_id = 'lesson_audio')
WITH CHECK (bucket_id = 'lesson_audio');

-- Create comprehensive public policies for lesson_images bucket  
CREATE POLICY "Public access for lesson_images"
ON storage.objects FOR ALL
TO public
USING (bucket_id = 'lesson_images')
WITH CHECK (bucket_id = 'lesson_images');

-- Ensure both buckets exist and are public
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson_audio', 'lesson_audio', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson_images', 'lesson_images', true)
ON CONFLICT (id) DO UPDATE SET public = true;
