-- Create slideshows table
CREATE TABLE public.slideshows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  slides JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.slideshows ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Slideshows are viewable by everyone" 
ON public.slideshows 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all operations on slideshows" 
ON public.slideshows 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_slideshows_updated_at
BEFORE UPDATE ON public.slideshows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();