-- Drop all existing flashcard-audio policies
DROP POLICY IF EXISTS "Public read access for flashcard audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload flashcard audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own flashcard audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own flashcard audio files" ON storage.objects;

-- Create a single, very permissive policy for flashcard-audio bucket
CREATE POLICY "Full access to flashcard-audio for authenticated users"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'flashcard-audio')
WITH CHECK (bucket_id = 'flashcard-audio');