-- Allow TOEFL items (uuid) to be tracked in content_progress by removing FK to content_items
-- This avoids 400/23503 errors when storing toefl_items ids
ALTER TABLE public.content_progress
  DROP CONSTRAINT IF EXISTS content_progress_content_item_id_fkey;

-- Ensure user_id can be null (already handled previously, but keep idempotent)
ALTER TABLE public.content_progress
  ALTER COLUMN user_id DROP NOT NULL;