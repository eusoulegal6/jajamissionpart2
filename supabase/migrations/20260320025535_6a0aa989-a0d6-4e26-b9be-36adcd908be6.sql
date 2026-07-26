
-- Create book_mode_progress table to track user progress in book mode
CREATE TABLE public.book_mode_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  user_id uuid,
  category text NOT NULL, -- 'Iniciante', 'Intermediário', 'Avançado', 'Business'
  current_lesson_id text NOT NULL,
  current_page_index integer NOT NULL DEFAULT 0,
  lesson_sequence jsonb NOT NULL DEFAULT '[]'::jsonb, -- ordered list of lesson IDs in the book
  total_lessons integer NOT NULL DEFAULT 0,
  current_lesson_index integer NOT NULL DEFAULT 0, -- index within the sequence
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(phone_number, category)
);

-- Enable RLS
ALTER TABLE public.book_mode_progress ENABLE ROW LEVEL SECURITY;

-- Policies - similar to lesson_progress (public access via phone_number)
CREATE POLICY "Public can view book_mode_progress"
  ON public.book_mode_progress FOR SELECT
  USING (true);

CREATE POLICY "Public can insert book_mode_progress"
  ON public.book_mode_progress FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update book_mode_progress"
  ON public.book_mode_progress FOR UPDATE
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_book_mode_progress_updated_at
  BEFORE UPDATE ON public.book_mode_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
