-- Fix RLS policies for flashcard-audio bucket

-- First, let's make sure the bucket exists and is configured correctly
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('flashcard-audio', 'flashcard-audio', true, 52428800, ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav'];

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view flashcard audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own flashcard audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own flashcard audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own flashcard audio" ON storage.objects;

-- Create proper RLS policies for flashcard-audio bucket
CREATE POLICY "Anyone can view flashcard audio files"
ON storage.objects FOR SELECT
USING (bucket_id = 'flashcard-audio');

CREATE POLICY "Users can upload their own flashcard audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'flashcard-audio' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own flashcard audio"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'flashcard-audio'
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own flashcard audio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'flashcard-audio'
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);