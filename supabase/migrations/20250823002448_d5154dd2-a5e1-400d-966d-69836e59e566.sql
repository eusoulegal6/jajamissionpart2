-- Create user flashcards table
CREATE TABLE public.user_flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_flashcards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own flashcards" 
ON public.user_flashcards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own flashcards" 
ON public.user_flashcards 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcards" 
ON public.user_flashcards 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flashcards" 
ON public.user_flashcards 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_flashcards_updated_at
BEFORE UPDATE ON public.user_flashcards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();