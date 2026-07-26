-- Create storage bucket for flashcard audio if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('flashcard-audio', 'flashcard-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for flashcard audio bucket
CREATE POLICY "Users can view flashcard audio" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'flashcard-audio');

CREATE POLICY "Users can upload their own flashcard audio" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'flashcard-audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own flashcard audio" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'flashcard-audio' AND auth.uid()::text = (storage.foldername(name))[1]);