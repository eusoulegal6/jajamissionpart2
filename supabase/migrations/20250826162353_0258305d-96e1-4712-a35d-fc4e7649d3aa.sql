-- Add RLS policies to allow updates to toefl_items
-- This will allow authorized users to update TOEFL lessons

-- Allow all operations on toefl_items (since these are educational content)
CREATE POLICY "Allow all operations on toefl_items" 
ON public.toefl_items 
FOR ALL 
USING (true) 
WITH CHECK (true);