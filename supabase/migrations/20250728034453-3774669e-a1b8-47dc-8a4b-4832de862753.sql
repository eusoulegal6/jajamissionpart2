-- Fix the duplicate "Médio" chapters in videos category
-- The first chapter should be "Fácil" for beginners
UPDATE content_chapters 
SET title = 'Fácil', description = 'Vídeos para iniciantes'
WHERE id = '2d1599ab-a24c-4223-ae7b-94be332e5a57' AND category_id = 'en-culture';