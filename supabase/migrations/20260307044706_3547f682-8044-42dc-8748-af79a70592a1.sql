
ALTER TABLE public.group_classes ADD COLUMN image_url TEXT NOT NULL DEFAULT '';
ALTER TABLE public.group_classes ADD COLUMN is_american BOOLEAN NOT NULL DEFAULT false;

-- Set existing seed data
UPDATE public.group_classes SET is_american = true WHERE badge = '100% Inglês';
