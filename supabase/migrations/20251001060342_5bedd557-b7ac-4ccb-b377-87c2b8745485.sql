-- Remove the problematic foreign key constraint on user_flashcards
-- The RLS policies already ensure users can only access their own flashcards
ALTER TABLE public.user_flashcards 
DROP CONSTRAINT IF EXISTS user_flashcards_user_id_fkey;