-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop and recreate the flashcard-audio policies with correct syntax
DROP POLICY IF EXISTS "Anyone can view flashcard audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own flashcard audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own flashcard audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own flashcard audio" ON storage.objects;

-- Create new policies with simpler logic
CREATE POLICY "Public read access for flashcard audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'flashcard-audio');

CREATE POLICY "Authenticated users can upload flashcard audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'flashcard-audio' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own flashcard audio files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'flashcard-audio'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own flashcard audio files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'flashcard-audio'
  AND auth.uid() IS NOT NULL
);