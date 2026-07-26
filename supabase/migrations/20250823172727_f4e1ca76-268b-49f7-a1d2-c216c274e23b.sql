-- Create TOEFL categories table
CREATE TABLE public.toefl_categories (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  description text,
  language text NOT NULL DEFAULT 'en',
  order_index integer DEFAULT 0
);

-- Create TOEFL chapters table  
CREATE TABLE public.toefl_chapters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  category_id text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  order_index integer DEFAULT 0
);

-- Create TOEFL items table
CREATE TABLE public.toefl_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content jsonb NOT NULL,
  chapter_id uuid NOT NULL,
  order_index integer DEFAULT 0,
  cached_audio_urls jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS on all tables
ALTER TABLE public.toefl_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toefl_chapters ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.toefl_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "TOEFL categories are viewable by everyone" 
ON public.toefl_categories 
FOR SELECT 
USING (true);

CREATE POLICY "TOEFL chapters are viewable by everyone" 
ON public.toefl_chapters 
FOR SELECT 
USING (true);

CREATE POLICY "TOEFL items are viewable by everyone" 
ON public.toefl_items 
FOR SELECT 
USING (true);

-- Insert the four TOEFL categories
INSERT INTO public.toefl_categories (id, name, description, language, order_index) VALUES
('reading', 'Reading', 'TOEFL Reading Comprehension', 'en', 1),
('listening', 'Listening', 'TOEFL Listening Comprehension', 'en', 2),
('speaking', 'Speaking', 'TOEFL Speaking Tasks', 'en', 3),
('writing', 'Writing', 'TOEFL Writing Tasks', 'en', 4);