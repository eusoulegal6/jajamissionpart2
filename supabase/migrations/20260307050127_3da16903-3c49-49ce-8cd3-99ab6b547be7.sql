CREATE POLICY "Allow public upload to teachers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'teachers');

CREATE POLICY "Allow public update to teachers"
ON storage.objects FOR UPDATE
USING (bucket_id = 'teachers');

CREATE POLICY "Allow public select from teachers"
ON storage.objects FOR SELECT
USING (bucket_id = 'teachers');

CREATE POLICY "Allow public delete from teachers"
ON storage.objects FOR DELETE
USING (bucket_id = 'teachers');