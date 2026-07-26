-- Remove the foreign key constraint that's causing issues
-- The content_progress table should use phone_number as primary identifier, not user_id
ALTER TABLE public.content_progress DROP CONSTRAINT IF EXISTS content_progress_user_id_fkey;

-- Make user_id nullable since we're using phone_number as the primary identifier
ALTER TABLE public.content_progress ALTER COLUMN user_id DROP NOT NULL;