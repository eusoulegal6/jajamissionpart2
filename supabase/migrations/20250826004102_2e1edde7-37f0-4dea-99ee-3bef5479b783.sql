-- Add category_id column to toefl_items table to reference categories directly
ALTER TABLE toefl_items ADD COLUMN category_id TEXT;

-- Make chapter_id nullable for TOEFL items that reference categories directly
ALTER TABLE toefl_items ALTER COLUMN chapter_id DROP NOT NULL;

-- Add a check constraint to ensure either chapter_id or category_id is provided
ALTER TABLE toefl_items ADD CONSTRAINT toefl_items_reference_check 
CHECK ((chapter_id IS NOT NULL AND category_id IS NULL) OR (chapter_id IS NULL AND category_id IS NOT NULL));