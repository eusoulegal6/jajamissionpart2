-- Add lessons to English categories that need them

-- First, let's add 20 lessons to each "Leitura" (en-vocabulary) chapter
-- Fácil chapter lessons (20 lessons)
INSERT INTO content_items (chapter_id, title, content, "order") 
SELECT 
  '2d1599ab-a24c-4223-ae7b-94be332e5a57',
  'Lesson for Leitura - Fácil ' || generate_series(1, 20),
  '{}',
  generate_series(1, 20);

-- Médio chapter lessons (20 lessons)  
INSERT INTO content_items (chapter_id, title, content, "order")
SELECT 
  'a068d2c4-6c89-4d5e-8f3b-2e1a9b7c3d5f',
  'Lesson for Leitura - Médio ' || generate_series(1, 20),
  '{}',
  generate_series(1, 20);

-- Difícil chapter lessons (20 lessons)
INSERT INTO content_items (chapter_id, title, content, "order")
SELECT 
  'b179e3d5-7d9a-4e6f-9g4c-3f2b0c8d4e6g',
  'Lesson for Leitura - Difícil ' || generate_series(1, 20),
  '{}',
  generate_series(1, 20);

-- Add 18 lessons to "Vídeo aulas - Conceituais" (en-grammar)
INSERT INTO content_items (chapter_id, title, content, "order")
SELECT 
  'c28af4e6-8e0b-5f7g-0h5d-4g3c1d9e5f7h',
  'Lesson for Vídeo aulas - Conceituais ' || generate_series(1, 18),
  '{}',
  generate_series(1, 18);

-- Add 18 more lessons to "Vídeo aulas - Gramática" to reach 20 total (currently has 2)
INSERT INTO content_items (chapter_id, title, content, "order")
SELECT 
  'd39bg5f7-9f1c-6g8h-1i6e-5h4d2e0f6g8i',
  'Lesson for Vídeo aulas - Gramática ' || generate_series(3, 20),
  '{}',
  generate_series(3, 20);