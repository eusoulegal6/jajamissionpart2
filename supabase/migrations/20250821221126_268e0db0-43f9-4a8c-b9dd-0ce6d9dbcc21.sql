-- Create students table
CREATE TABLE public.students (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create student_lesson_progress table
CREATE TABLE public.student_lesson_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  lesson_id text NOT NULL,
  lesson_title text NOT NULL,
  current_page integer NOT NULL DEFAULT 1,
  total_pages integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Enable RLS for students table
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Students policies - teachers can manage their own students
CREATE POLICY "Teachers can view their own students"
ON public.students
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can create students"
ON public.students
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Teachers can update their own students"
ON public.students
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can delete their own students"
ON public.students
FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS for student_lesson_progress table
ALTER TABLE public.student_lesson_progress ENABLE ROW LEVEL SECURITY;

-- Student lesson progress policies
CREATE POLICY "Teachers can view their own student progress"
ON public.student_lesson_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can create student progress"
ON public.student_lesson_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Teachers can update their own student progress"
ON public.student_lesson_progress
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can delete their own student progress"
ON public.student_lesson_progress
FOR DELETE
USING (auth.uid() = user_id);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_lesson_progress_updated_at
BEFORE UPDATE ON public.student_lesson_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();