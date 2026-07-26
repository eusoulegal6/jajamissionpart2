
-- Fix 2% progress increment by allowing public access (phone-number based app)
-- IMPORTANT: This aligns with other public tables already present in this project.

-- user_progress: allow read/write without Supabase Auth
CREATE POLICY "Public can view user_progress"
  ON public.user_progress
  FOR SELECT
  USING (true);

CREATE POLICY "Public can insert user_progress"
  ON public.user_progress
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update user_progress"
  ON public.user_progress
  FOR UPDATE
  USING (true);

-- lesson_progress: allow read/write without Supabase Auth
CREATE POLICY "Public can view lesson_progress"
  ON public.lesson_progress
  FOR SELECT
  USING (true);

CREATE POLICY "Public can insert lesson_progress"
  ON public.lesson_progress
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update lesson_progress"
  ON public.lesson_progress
  FOR UPDATE
  USING (true);
