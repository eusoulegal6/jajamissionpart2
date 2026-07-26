
-- Rename existing PNL deck to Chapter 1 and update the title
UPDATE public.flashcards
SET title = 'Chapter 1 - Food and drinks'
WHERE difficulty = 'PNL' AND title = 'PNL Essenciais';

-- Insert row for Chapter 2 - initially empty cards array
INSERT INTO public.flashcards (title, difficulty, cards)
VALUES (
  'Chapter 2 - Languages and countries',
  'PNL',
  '[]'
);

-- Insert row for Chapter 3 - initially empty cards array
INSERT INTO public.flashcards (title, difficulty, cards)
VALUES (
  'Chapter 3 - Person information and routine',
  'PNL',
  '[]'
);

-- (No changes for other difficulties/chapters)
