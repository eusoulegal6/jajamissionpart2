-- Ensure flashcard-audio bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public)
VALUES ('flashcard-audio', 'flashcard-audio', true)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  name = 'flashcard-audio';

-- Drop ALL existing policies on storage.objects for flashcard-audio
DROP POLICY IF EXISTS "Full access to flashcard-audio for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for flashcard audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload flashcard audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own flashcard audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own flashcard audio files" ON storage.objects;

-- Create simple public policies for flashcard-audio bucket
CREATE POLICY "Public can view flashcard audio files"
ON storage.objects FOR SELECT
USING (bucket_id = 'flashcard-audio');

CREATE POLICY "Anyone can upload to flashcard-audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'flashcard-audio');

CREATE POLICY "Anyone can update flashcard audio files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'flashcard-audio');

CREATE POLICY "Anyone can delete flashcard audio files"
ON storage.objects FOR DELETE
USING (bucket_id = 'flashcard-audio');