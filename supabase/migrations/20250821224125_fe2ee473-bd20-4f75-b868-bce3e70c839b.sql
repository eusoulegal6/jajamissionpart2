-- Remove the existing foreign key constraint that references auth.users
ALTER TABLE public.students DROP CONSTRAINT students_user_id_fkey;
ALTER TABLE public.student_lesson_progress DROP CONSTRAINT student_lesson_progress_user_id_fkey;

-- Change user_id column to text to match phone_number system
ALTER TABLE public.students ALTER COLUMN user_id TYPE text;
ALTER TABLE public.student_lesson_progress ALTER COLUMN user_id TYPE text;

-- Since this app uses a custom phone-based auth system, we'll use phone_number as the user identifier
-- Add phone_number column and make user_id optional for backward compatibility
ALTER TABLE public.students ADD COLUMN phone_number text;
ALTER TABLE public.student_lesson_progress ADD COLUMN phone_number text;

-- Update RLS policies to work with phone numbers
DROP POLICY "Teachers can view their own students" ON public.students;
DROP POLICY "Teachers can create students" ON public.students;
DROP POLICY "Teachers can update their own students" ON public.students;
DROP POLICY "Teachers can delete their own students" ON public.students;

DROP POLICY "Teachers can view their own student progress" ON public.student_lesson_progress;
DROP POLICY "Teachers can create student progress" ON public.student_lesson_progress;
DROP POLICY "Teachers can update their own student progress" ON public.student_lesson_progress;
DROP POLICY "Teachers can delete their own student progress" ON public.student_lesson_progress;

-- Create new policies based on phone_number matching
CREATE POLICY "Users can view their own students by phone"
ON public.students
FOR SELECT
USING (phone_number IS NOT NULL);

CREATE POLICY "Users can create students with their phone"
ON public.students
FOR INSERT
WITH CHECK (phone_number IS NOT NULL);

CREATE POLICY "Users can update their own students by phone"
ON public.students
FOR UPDATE
USING (phone_number IS NOT NULL);

CREATE POLICY "Users can delete their own students by phone"
ON public.students
FOR DELETE
USING (phone_number IS NOT NULL);

-- Student lesson progress policies
CREATE POLICY "Users can view their own student progress by phone"
ON public.student_lesson_progress
FOR SELECT
USING (phone_number IS NOT NULL);

CREATE POLICY "Users can create student progress with their phone"
ON public.student_lesson_progress
FOR INSERT
WITH CHECK (phone_number IS NOT NULL);

CREATE POLICY "Users can update their own student progress by phone"
ON public.student_lesson_progress
FOR UPDATE
USING (phone_number IS NOT NULL);

CREATE POLICY "Users can delete their own student progress by phone"
ON public.student_lesson_progress
FOR DELETE
USING (phone_number IS NOT NULL);