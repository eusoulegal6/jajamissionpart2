-- Add lessons to English categories that need them using correct chapter IDs

-- Add 20 lessons to "Leitura - Fácil" (currently 0 lessons)
INSERT INTO content_items (chapter_id, title, content, "order") 
SELECT 
  'd596f9fe-028f-48f0-8a1f-174650acd861',
  'Lesson for Leitura - Fácil ' || generate_series(1, 20),
  '{}',
  generate_series(1, 20);

-- Add 20 lessons to "Leitura - Médio" (currently 0 lessons)  
INSERT INTO content_items (chapter_id, title, content, "order")
SELECT 
  '361b770a-8792-4af4-82ce-8a69348dbf20',
  'Lesson for Leitura - Médio ' || generate_series(1, 20),
  '{}',
  generate_series(1, 20);

-- Add 20 lessons to "Leitura - Difícil" (currently 0 lessons)
INSERT INTO content_items (chapter_id, title, content, "order")
SELECT 
  'b0b13f71-ee00-439b-8a09-bc0505c6b38a',
  'Lesson for Leitura - Difícil ' || generate_series(1, 20),
  '{}',
  generate_series(1, 20);

-- Add 18 lessons to "Vídeo aulas - Conceituais" (currently 0 lessons)
INSERT INTO content_items (chapter_id, title, content, "order")
SELECT 
  'b2c3d4e5-0001-0001-0001-67890abcdef1',
  'Lesson for Vídeo aulas - Conceituais ' || generate_series(1, 18),
  '{}',
  generate_series(1, 18);

-- Add 18 more lessons to "Vídeo aulas - Gramática" to reach 20 total (currently has 2)
INSERT INTO content_items (chapter_id, title, content, "order")
SELECT 
  'a1b2c3d4-0001-0001-0001-567890abcdef',
  'Lesson for Vídeo aulas - Gramática ' || generate_series(3, 20),
  '{}',
  generate_series(3, 20);