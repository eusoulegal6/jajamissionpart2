
-- Update the lessons table constraint to include 'Fluente' as an allowed difficulty
ALTER TABLE public.lessons 
DROP CONSTRAINT IF EXISTS lessons_difficulty_check;

ALTER TABLE public.lessons 
ADD CONSTRAINT lessons_difficulty_check 
CHECK (difficulty IN ('Fácil', 'Médio', 'Difícil', 'PNL', 'Fluente'));
