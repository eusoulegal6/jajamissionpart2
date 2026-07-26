-- Add mobileMode column to slideshows table
ALTER TABLE public.slideshows 
ADD COLUMN IF NOT EXISTS mobile_mode BOOLEAN DEFAULT false;