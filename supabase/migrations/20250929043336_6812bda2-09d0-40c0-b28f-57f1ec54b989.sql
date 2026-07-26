-- First drop the constraint if it exists
ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_difficulty_check;

-- Add new constraint that includes all existing and new difficulty levels
ALTER TABLE public.lessons ADD CONSTRAINT lessons_difficulty_check 
CHECK (difficulty IN ('Easy', 'Medium', 'Hard', 'Fácil', 'Médio', 'Difícil', 'Iniciante', 'Intermediário', 'Business', 'PNL', 'Fluente'));