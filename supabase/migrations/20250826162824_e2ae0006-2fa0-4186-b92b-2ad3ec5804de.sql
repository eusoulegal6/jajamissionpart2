-- Enable real-time updates for toefl_items and content_items tables
-- This will allow real-time notifications when lessons are updated

-- Enable replica identity for complete row data capture
ALTER TABLE public.toefl_items REPLICA IDENTITY FULL;
ALTER TABLE public.content_items REPLICA IDENTITY FULL;

-- Add tables to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.toefl_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_items;