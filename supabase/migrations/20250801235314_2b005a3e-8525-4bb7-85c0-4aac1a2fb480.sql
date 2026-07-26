-- Add visible column to video_quiz_questions table
ALTER TABLE public.video_quiz_questions 
ADD COLUMN visible boolean NOT NULL DEFAULT true;