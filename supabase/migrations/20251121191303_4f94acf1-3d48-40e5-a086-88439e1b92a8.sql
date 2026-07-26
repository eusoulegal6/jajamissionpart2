-- Update all article pages in lessons table to enable slide mode
DO $$
DECLARE
  lesson_record RECORD;
  page_index INT;
  page_element jsonb;
  pages_array jsonb;
BEGIN
  -- Loop through all lessons
  FOR lesson_record IN SELECT id, content FROM lessons WHERE content->'pages' IS NOT NULL LOOP
    pages_array := lesson_record.content->'pages';
    
    -- Loop through each page index
    FOR page_index IN 0..(jsonb_array_length(pages_array) - 1) LOOP
      page_element := pages_array->page_index;
      
      -- If the page type is 'article', add slideMode: true
      IF page_element->>'type' = 'article' THEN
        -- Update the page element with slideMode
        page_element := page_element || '{"slideMode": true}'::jsonb;
        
        -- Update the page in the pages array
        pages_array := jsonb_set(pages_array, ARRAY[page_index::text], page_element);
      END IF;
    END LOOP;
    
    -- Update the lesson with the modified pages array
    UPDATE lessons 
    SET content = jsonb_set(content, '{pages}', pages_array)
    WHERE id = lesson_record.id;
  END LOOP;
  
  RAISE NOTICE 'Updated article pages with slide mode';
END $$;
