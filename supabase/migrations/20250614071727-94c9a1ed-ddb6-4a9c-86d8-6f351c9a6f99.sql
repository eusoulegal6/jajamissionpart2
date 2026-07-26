
-- 1. Table for flashcards (each flashcard belongs to a deck/difficulty)

CREATE TABLE public.flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,                -- example: "Animals"
  difficulty text NOT NULL,           -- "Fácil" | "Médio" | "Difícil" | "PNL" | "Fluente"
  cards jsonb NOT NULL,               -- List of cards ([{ front: string, back: string }])
  created_at timestamp with time zone DEFAULT now()
);

-- Index for quicker searches
CREATE INDEX flashcards_difficulty_idx ON public.flashcards (difficulty);

-- No authentication required so everyone can practice decks for any difficulty
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all read" ON public.flashcards FOR SELECT USING (true);

