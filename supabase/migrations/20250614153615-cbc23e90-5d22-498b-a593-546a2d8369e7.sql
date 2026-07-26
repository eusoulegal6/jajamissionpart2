
-- Create Spanish version of the lessons table
CREATE TABLE public.lessons_spanish (
  id TEXT PRIMARY KEY,
  content JSONB NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL
);

-- Create Spanish version of a table for easy questions
CREATE TABLE public.perguntas_facil_spanish (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  category TEXT NOT NULL,
  question TEXT NOT NULL
);

-- Create Spanish version of a table for medium questions
CREATE TABLE public.perguntas_medio_spanish (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  category TEXT NOT NULL,
  question TEXT NOT NULL
);

-- Create Spanish version of a table for difficult questions
CREATE TABLE public.perguntas_dificil_spanish (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  category TEXT NOT NULL,
  question TEXT NOT NULL
);
