-- Copy the lesson "Como DETONAR no TOEFL - Speaking & Writing" to the writing category
INSERT INTO toefl_items (title, category_id, content, order_index) 
SELECT 'Como DETONAR no TOEFL - Speaking & Writing', 'writing', content, 1 
FROM toefl_items 
WHERE title = 'Como DETONAR no TOEFL - Speaking & Writing' AND category_id = 'speaking';