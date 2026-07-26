-- Fix lesson content structure for video quiz lessons
-- Remove extra array wrapper and extract the pages directly

UPDATE lessons 
SET content = (content->'content'->0)
WHERE title = 'teste' 
  AND jsonb_typeof(content->'content') = 'array'
  AND jsonb_array_length(content->'content') = 1
  AND content->'content'->0 ? 'pages';