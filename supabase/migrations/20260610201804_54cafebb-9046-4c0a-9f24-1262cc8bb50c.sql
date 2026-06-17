
CREATE POLICY "anyone can upload voice" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'voice');
CREATE POLICY "anyone can read voice" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'voice');
