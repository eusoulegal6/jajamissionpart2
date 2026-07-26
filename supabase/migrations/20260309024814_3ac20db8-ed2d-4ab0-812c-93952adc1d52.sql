
-- Rename flix_videos conceptually to "programs" by removing video_url (programs don't need a single video)
-- Actually, let's just keep the table as-is and make video_url nullable since programs don't need it
ALTER TABLE public.flix_videos ALTER COLUMN video_url DROP NOT NULL;
ALTER TABLE public.flix_videos ALTER COLUMN video_url SET DEFAULT null;

-- Create episodes table
CREATE TABLE public.flix_episodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.flix_videos(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  episode_number INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.flix_episodes ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "Anyone can read flix_episodes" ON public.flix_episodes
  FOR SELECT USING (true);

-- Only admins can manage
CREATE POLICY "Admins can insert flix_episodes" ON public.flix_episodes
  FOR INSERT WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can update flix_episodes" ON public.flix_episodes
  FOR UPDATE USING (public.is_admin_user());

CREATE POLICY "Admins can delete flix_episodes" ON public.flix_episodes
  FOR DELETE USING (public.is_admin_user());

-- Auto-update updated_at
CREATE TRIGGER update_flix_episodes_updated_at
  BEFORE UPDATE ON public.flix_episodes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast episode lookups
CREATE INDEX idx_flix_episodes_program_id ON public.flix_episodes(program_id);
