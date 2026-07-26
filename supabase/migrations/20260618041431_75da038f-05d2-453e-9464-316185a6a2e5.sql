CREATE POLICY "Public videos insert" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'videos');
CREATE POLICY "Public videos update" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'videos');
CREATE POLICY "Public videos delete" ON storage.objects FOR DELETE TO public USING (bucket_id = 'videos');
CREATE POLICY "Public videos select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'videos');