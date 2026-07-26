
-- 1. Add RLS to existing lesson_progress table for better security
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own lesson progress"
  ON public.lesson_progress
  FOR ALL
  USING (phone_number = (auth.jwt() ->> 'phone'))
  WITH CHECK (phone_number = (auth.jwt() ->> 'phone'));


-- 2. Create content_categories table
CREATE TABLE public.content_categories (
  id TEXT PRIMARY KEY,
  language TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  "order" INTEGER
);

ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public categories are viewable by everyone."
  ON public.content_categories FOR SELECT
  USING (true);


-- 3. Create content_chapters table
CREATE TABLE public.content_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id TEXT NOT NULL REFERENCES public.content_categories(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  "order" INTEGER
);

ALTER TABLE public.content_chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public chapters are viewable by everyone."
  ON public.content_chapters FOR SELECT
  USING (true);


-- 4. Create content_items table
CREATE TABLE public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.content_chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  "order" INTEGER
);

ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public content items are viewable by everyone."
  ON public.content_items FOR SELECT
  USING (true);


-- 5. Create content_progress table
CREATE TABLE public.content_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_content_progress UNIQUE (phone_number, content_item_id)
);

ALTER TABLE public.content_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own content progress"
  ON public.content_progress
  FOR ALL
  USING (phone_number = (auth.jwt() ->> 'phone'))
  WITH CHECK (phone_number = (auth.jwt() ->> 'phone'));

-- 6. Seed data
-- Seed categories
INSERT INTO public.content_categories (id, language, name, description, "order") VALUES
('en-grammar', 'en', 'Grammar', 'Master English grammar concepts.', 1),
('en-vocabulary', 'en', 'Vocabulary', 'Expand your English vocabulary.', 2),
('en-culture', 'en', 'Culture', 'Learn about English-speaking cultures.', 3),
('es-gramatica', 'es', 'Gramática', 'Domina los conceptos de la gramática española.', 1),
('es-vocabulario', 'es', 'Vocabulario', 'Amplía tu vocabulario en español.', 2);

-- Seed chapters for English Grammar
INSERT INTO public.content_chapters (id, category_id, language, title, description, "order") VALUES
('a1b2c3d4-0001-0001-0001-567890abcdef', 'en-grammar', 'en', 'Present Tense', 'Learn how to use the present simple and continuous tenses.', 1),
('b2c3d4e5-0001-0001-0001-67890abcdef1', 'en-grammar', 'en', 'Past Tense', 'Master the past simple and perfect tenses.', 2);

-- Seed items for "Present Tense" chapter
INSERT INTO public.content_items (chapter_id, title, "content", "order") VALUES
('a1b2c3d4-0001-0001-0001-567890abcdef', 'Present Simple Explained', '{"id": "content-item-1", "title": "Present Simple", "description": "Learn the basics of the present simple tense.", "difficulty": "iniciante", "pages": [{"type": "article", "title": "What is the Present Simple?", "imageUrl": "https://images.unsplash.com/photo-1516410529446-21e7e78d46b9?w=800", "text": "The present simple tense is one of the most basic tenses in English. We use it to talk about things in general, repeated actions, or unchanging situations, emotions and wishes."}]}', 1),
('a1b2c3d4-0001-0001-0001-567890abcdef', 'Present Simple Quiz', '{"id": "content-item-2", "title": "Present Simple Quiz", "description": "Test your knowledge of the present simple.", "difficulty": "iniciante", "pages": [{"type": "trueFalse", "question": "Does he plays football?", "correctAnswer": false, "explanation": "The correct form is ''Does he play football?''."}]}', 2);
