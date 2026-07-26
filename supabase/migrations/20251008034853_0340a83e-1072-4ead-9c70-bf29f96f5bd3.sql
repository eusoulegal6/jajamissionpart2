-- Move Lesson 1A from lessons table to book_lessons table with Jeffrey difficulty
INSERT INTO book_lessons (id, title, description, difficulty, content, cached_audio_urls, koe_flashcard_words)
SELECT 
  gen_random_uuid(),
  title,
  description,
  'Jeffrey' as difficulty,
  content,
  cached_audio_urls,
  COALESCE(koe_flashcard_words, '[]'::jsonb)
FROM lessons
WHERE id = 'facil_1759886580183';

-- Delete from original lessons table
DELETE FROM lessons WHERE id = 'facil_1759886580183';