
INSERT INTO storage.buckets (id, name, public) VALUES ('payout-screenshots', 'payout-screenshots', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload payout screenshots" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payout-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Anyone can view payout screenshots" ON storage.objects FOR SELECT USING (bucket_id = 'payout-screenshots');
CREATE POLICY "Users can delete own payout screenshots" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'payout-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);
