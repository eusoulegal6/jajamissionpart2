-- Add difficulty column to teacher_student_progress table
ALTER TABLE public.teacher_student_progress ADD COLUMN difficulty text NOT NULL DEFAULT 'Medium';