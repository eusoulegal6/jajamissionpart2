-- Create table for persistent image optimizer runs
CREATE TABLE IF NOT EXISTS public.image_optimizer_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'idle', -- idle, running, paused, completed, error
  mode text NOT NULL DEFAULT 'compress', -- compress or probe
  scope text NOT NULL DEFAULT 'slideshows_first', -- slideshows_first or all
  threshold_bytes integer NOT NULL DEFAULT 921600, -- default 900KB
  batch_size integer NOT NULL DEFAULT 10,

  processed_count integer NOT NULL DEFAULT 0,
  done_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,

  current_original_url text,
  last_message text,

  stop_requested boolean NOT NULL DEFAULT false,
  started_at timestamptz,
  finished_at timestamptz,
  heartbeat_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Add index for efficient lookup of latest run
CREATE INDEX IF NOT EXISTS idx_image_optimizer_runs_created_at ON public.image_optimizer_runs(created_at DESC);

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_image_optimizer_runs_status ON public.image_optimizer_runs(status);