-- Update the "Como DETONAR no TOEFL?" lesson to be first (order_index -1)
UPDATE toefl_items 
SET order_index = -1 
WHERE title = 'Como DETONAR no TOEFL? - Sessão Reading';

-- Update Practice lessons to have proper sequential ordering
UPDATE toefl_items 
SET order_index = 1 
WHERE title = 'Practice 1' AND category_id = 'reading';

UPDATE toefl_items 
SET order_index = 2 
WHERE title = 'Practice 2' AND category_id = 'reading';

UPDATE toefl_items 
SET order_index = 3 
WHERE title = 'Practice 3' AND category_id = 'reading';

UPDATE toefl_items 
SET order_index = 4 
WHERE title = 'Practice 4' AND category_id = 'reading';

UPDATE toefl_items 
SET order_index = 5 
WHERE title = 'Practice 5' AND category_id = 'reading';

UPDATE toefl_items 
SET order_index = 6 
WHERE title = 'Practice 6' AND category_id = 'reading';

UPDATE toefl_items 
SET order_index = 7 
WHERE title = 'Practice 7' AND category_id = 'reading';

UPDATE toefl_items 
SET order_index = 8 
WHERE title = 'Practice 8' AND category_id = 'reading';

UPDATE toefl_items 
SET order_index = 9 
WHERE title = 'Practice 9' AND category_id = 'reading';