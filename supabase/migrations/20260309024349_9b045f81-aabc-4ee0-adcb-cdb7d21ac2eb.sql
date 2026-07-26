
-- Create flix_videos table
CREATE TABLE public.flix_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  difficulty TEXT NOT NULL DEFAULT 'Iniciante',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.flix_videos ENABLE ROW LEVEL SECURITY;

-- Everyone can read active videos
CREATE POLICY "Anyone can read flix_videos" ON public.flix_videos
  FOR SELECT USING (true);

-- Only admins can insert/update/delete (using existing is_admin_user function)
CREATE POLICY "Admins can insert flix_videos" ON public.flix_videos
  FOR INSERT WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can update flix_videos" ON public.flix_videos
  FOR UPDATE USING (public.is_admin_user());

CREATE POLICY "Admins can delete flix_videos" ON public.flix_videos
  FOR DELETE USING (public.is_admin_user());

-- Auto-update updated_at
CREATE TRIGGER update_flix_videos_updated_at
  BEFORE UPDATE ON public.flix_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
