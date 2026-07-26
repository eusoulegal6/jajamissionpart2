-- Bring the copied lesson to the top of the Writing list
UPDATE toefl_items
SET order_index = -1
WHERE title = 'Como DETONAR no TOEFL - Speaking & Writing' AND category_id = 'writing';