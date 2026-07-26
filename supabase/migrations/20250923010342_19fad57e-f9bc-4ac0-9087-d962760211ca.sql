-- Update slideshows table to add type field to slides
-- Since slides is JSONB, we don't need to modify the table structure
-- The type field will be stored within each slide object in the JSONB array

-- Add a comment to document the new slide structure
COMMENT ON COLUMN slideshows.slides IS 'JSONB array of slide objects. Each slide should have: id (string), imageUrl (string), audioUrl (string), order (number), type (''normal'' | ''comparison'')';