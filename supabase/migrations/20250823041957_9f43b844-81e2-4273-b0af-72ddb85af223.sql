-- Fix the flashcard-audio policies - change from public to authenticated
DROP POLICY IF EXISTS "Authenticated users can upload flashcard audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own flashcard audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own flashcard audio files" ON storage.objects;

-- Create proper authenticated user policies
CREATE POLICY "Authenticated users can upload flashcard audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'flashcard-audio');

CREATE POLICY "Users can update their own flashcard audio files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'flashcard-audio');

CREATE POLICY "Users can delete their own flashcard audio files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'flashcard-audio');