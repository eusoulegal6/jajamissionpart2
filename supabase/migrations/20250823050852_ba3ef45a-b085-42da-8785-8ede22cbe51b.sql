-- Create preset flashcard categories table
CREATE TABLE public.preset_flashcard_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create preset flashcards table
CREATE TABLE public.preset_flashcards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid NOT NULL REFERENCES public.preset_flashcard_categories(id) ON DELETE CASCADE,
  front_text text NOT NULL,
  back_text text NOT NULL,
  audio_url text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.preset_flashcard_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preset_flashcards ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Preset categories are viewable by everyone" 
ON public.preset_flashcard_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Preset flashcards are viewable by everyone" 
ON public.preset_flashcards 
FOR SELECT 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_preset_flashcards_category_id ON public.preset_flashcards(category_id);
CREATE INDEX idx_preset_flashcard_categories_order ON public.preset_flashcard_categories(order_index);
CREATE INDEX idx_preset_flashcards_order ON public.preset_flashcards(category_id, order_index);

-- Create function to update timestamps
CREATE TRIGGER update_preset_flashcard_categories_updated_at
BEFORE UPDATE ON public.preset_flashcard_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_preset_flashcards_updated_at
BEFORE UPDATE ON public.preset_flashcards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();