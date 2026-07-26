-- Enable RLS policies for content_items table to allow editing
DROP POLICY IF EXISTS "Public content items are viewable by everyone." ON public.content_items;

-- Allow full access to content_items
CREATE POLICY "Allow all operations on content_items" 
ON public.content_items 
FOR ALL
USING (true)
WITH CHECK (true);