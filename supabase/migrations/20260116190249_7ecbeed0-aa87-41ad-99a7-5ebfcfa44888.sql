-- Add run_type column to image_optimizer_runs if it doesn't exist
ALTER TABLE public.image_optimizer_runs
ADD COLUMN IF NOT EXISTS run_type text NOT NULL DEFAULT 'everything';