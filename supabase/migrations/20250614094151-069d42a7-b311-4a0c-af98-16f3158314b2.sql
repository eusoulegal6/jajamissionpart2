
-- Table for "Fácil" difficulty questions
CREATE TABLE public.perguntas_facil (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for "Médio" difficulty questions
CREATE TABLE public.perguntas_medio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for "Difícil" difficulty questions
CREATE TABLE public.perguntas_dificil (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Optional (and recommended): Enable Row Level Security but allow public (read-only) access since questions aren't user-specific.
ALTER TABLE public.perguntas_facil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perguntas_medio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perguntas_dificil ENABLE ROW LEVEL SECURITY;

-- Allow anyone to select questions (you can restrict this later if needed)
CREATE POLICY "Public can read fácil questions"
  ON public.perguntas_facil
  FOR SELECT
  USING (true);

CREATE POLICY "Public can read médio questions"
  ON public.perguntas_medio
  FOR SELECT
  USING (true);

CREATE POLICY "Public can read difícil questions"
  ON public.perguntas_dificil
  FOR SELECT
  USING (true);
