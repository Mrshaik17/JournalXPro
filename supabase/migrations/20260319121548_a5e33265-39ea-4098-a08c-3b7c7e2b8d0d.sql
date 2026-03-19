-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-screenshots', 'payment-screenshots', true);

-- Allow authenticated users to upload to payment-screenshots
CREATE POLICY "Users can upload payment screenshots"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payment-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access
CREATE POLICY "Public can view payment screenshots"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'payment-screenshots');
