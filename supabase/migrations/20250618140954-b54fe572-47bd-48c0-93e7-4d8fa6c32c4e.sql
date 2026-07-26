
-- Add cached_audio_urls column to content_items table
ALTER TABLE content_items 
ADD COLUMN cached_audio_urls jsonb DEFAULT '{}'::jsonb;
