-- Create dedicated teacher mode tables that are completely separate from user accounts

-- First, create a teacher_students table (separate from any user accounts)
CREATE TABLE public.teacher_students (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  teacher_phone_number text NOT NULL, -- The teacher who created this student
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create teacher_student_progress table (completely separate from user progress)
CREATE TABLE public.teacher_student_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_student_id uuid NOT NULL REFERENCES public.teacher_students(id) ON DELETE CASCADE,
  teacher_phone_number text NOT NULL, -- The teacher who owns this progress
  lesson_id text NOT NULL,
  lesson_title text NOT NULL,
  current_page integer NOT NULL DEFAULT 1,
  total_pages integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for security
ALTER TABLE public.teacher_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_student_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for teacher_students (based on phone number)
CREATE POLICY "Teachers can manage their own students" 
ON public.teacher_students 
FOR ALL 
USING (teacher_phone_number = (SELECT phone_number FROM public.user_sessions WHERE id = auth.uid()));

-- RLS policies for teacher_student_progress (based on phone number)
CREATE POLICY "Teachers can manage their own student progress" 
ON public.teacher_student_progress 
FOR ALL 
USING (teacher_phone_number = (SELECT phone_number FROM public.user_sessions WHERE id = auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_teacher_students_updated_at
BEFORE UPDATE ON public.teacher_students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teacher_student_progress_updated_at
BEFORE UPDATE ON public.teacher_student_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Drop the old tables that were causing confusion
DROP TABLE IF EXISTS public.student_lesson_progress;
DROP TABLE IF EXISTS public.students;