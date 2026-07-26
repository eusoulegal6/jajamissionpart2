-- Update the lessons table to use the compressed image URL
UPDATE lessons 
SET content = REPLACE(
  content::text,
  'https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/uploads/1760304740725-srd6kbpf7yk.jpg',
  'https://mcuquzgpaeoqskesgcnx.supabase.co/storage/v1/object/public/compressed-images/lovable/1760304740725-srd6kbpf7yk-compressed.jpg'
)::jsonb
WHERE id = 'Intermediário_1760841984013';