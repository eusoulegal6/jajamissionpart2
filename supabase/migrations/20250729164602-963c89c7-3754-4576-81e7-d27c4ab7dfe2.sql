-- Create video quiz questions table
CREATE TABLE public.video_quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id TEXT NOT NULL,
  timestamp_seconds INTEGER NOT NULL,
  question TEXT NOT NULL,
  correct_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_quiz_questions ENABLE ROW LEVEL SECURITY;

-- Create policies for video quiz questions
CREATE POLICY "Video quiz questions are viewable by everyone" 
ON public.video_quiz_questions 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_video_quiz_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_video_quiz_questions_updated_at
BEFORE UPDATE ON public.video_quiz_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_video_quiz_questions_updated_at();