
-- Add asset_name to news
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS asset_name text;

-- Add screenshot_url to trades
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS screenshot_url text;

-- Create prop_firms table
CREATE TABLE IF NOT EXISTS public.prop_firms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prop_firms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read prop firms" ON public.prop_firms FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert prop firms" ON public.prop_firms FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update prop firms" ON public.prop_firms FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete prop firms" ON public.prop_firms FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket for trade screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('trade-screenshots', 'trade-screenshots', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Users can upload trade screenshots" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'trade-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Anyone can view trade screenshots" ON storage.objects FOR SELECT TO public USING (bucket_id = 'trade-screenshots');
CREATE POLICY "Users can delete own trade screenshots" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'trade-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Enable realtime for prop_firms
ALTER PUBLICATION supabase_realtime ADD TABLE public.prop_firms;
