
-- Add audio URLs column to store cached audio for listening exercises
ALTER TABLE lessons 
ADD COLUMN cached_audio_urls JSONB DEFAULT '{}';

-- Add index for better performance when querying cached audio
CREATE INDEX idx_lessons_cached_audio_urls ON lessons USING GIN (cached_audio_urls);

-- Add comment to document the column purpose
COMMENT ON COLUMN lessons.cached_audio_urls IS 'Stores cached audio URLs for listening exercises, keyed by question index and difficulty level';
