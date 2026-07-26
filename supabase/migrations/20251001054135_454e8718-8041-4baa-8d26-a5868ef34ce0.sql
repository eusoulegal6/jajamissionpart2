-- Update lessons table check constraint
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_difficulty_check;

ALTER TABLE lessons ADD CONSTRAINT lessons_difficulty_check 
CHECK (difficulty IN (
  'facil', 'medio', 'dificil', 'fluente', 'pnl',
  'Fácil', 'Médio', 'Difícil', 'Fluente', 'PNL',
  'Iniciante', 'Intermediário', 'Avançado', 'Business'
));

-- Update book_lessons table check constraint with its existing values
ALTER TABLE book_lessons DROP CONSTRAINT IF EXISTS book_lessons_difficulty_check;

ALTER TABLE book_lessons ADD CONSTRAINT book_lessons_difficulty_check 
CHECK (difficulty IN (
  'beginner', 'Business', 'Jeffrey', 'Legal', 'Phillip',
  'facil', 'medio', 'dificil', 'fluente', 'pnl',
  'Fácil', 'Médio', 'Difícil', 'Fluente', 'PNL',
  'Iniciante', 'Intermediário', 'Avançado'
));