-- Disable slide mode for all article pages, then re-enable only for Curso completo
DO $$
DECLARE
  lesson_record RECORD;
  page_index INT;
  page_element jsonb;
  pages_array jsonb;
  is_curso_completo BOOLEAN;
BEGIN
  -- Loop through all lessons
  FOR lesson_record IN SELECT id, content, difficulty FROM lessons WHERE content->'pages' IS NOT NULL LOOP
    pages_array := lesson_record.content->'pages';
    
    -- Check if this is a Curso completo lesson
    is_curso_completo := lesson_record.difficulty IN ('Iniciante', 'Intermediário', 'Avançado', 'Business');
    
    -- Loop through each page index
    FOR page_index IN 0..(jsonb_array_length(pages_array) - 1) LOOP
      page_element := pages_array->page_index;
      
      -- If the page type is 'article'
      IF page_element->>'type' = 'article' THEN
        IF is_curso_completo THEN
          -- Enable slide mode for Curso completo
          page_element := page_element || '{"slideMode": true}'::jsonb;
        ELSE
          -- Disable slide mode for other lessons (or remove the property)
          page_element := page_element - 'slideMode';
        END IF;
        
        -- Update the page in the pages array
        pages_array := jsonb_set(pages_array, ARRAY[page_index::text], page_element);
      END IF;
    END LOOP;
    
    -- Update the lesson with the modified pages array
    UPDATE lessons 
    SET content = jsonb_set(content, '{pages}', pages_array)
    WHERE id = lesson_record.id;
  END LOOP;
  
  RAISE NOTICE 'Updated slide mode: enabled for Curso completo, disabled for others';
END $$;
