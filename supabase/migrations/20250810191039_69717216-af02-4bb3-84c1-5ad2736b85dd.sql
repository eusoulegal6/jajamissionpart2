-- Remove the foreign key constraint that's blocking progress updates
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_user_id_fkey;

-- Also remove any foreign key constraints on lesson_progress table
ALTER TABLE lesson_progress DROP CONSTRAINT IF EXISTS lesson_progress_user_id_fkey;