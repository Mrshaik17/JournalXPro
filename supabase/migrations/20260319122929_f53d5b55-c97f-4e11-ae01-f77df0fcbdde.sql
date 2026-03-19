
-- Create news table for admin to post daily news
CREATE TABLE public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  source text,
  category text DEFAULT 'general',
  published boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- Anyone can read published news
CREATE POLICY "Anyone can read published news" ON public.news
  FOR SELECT USING (published = true);

-- Admins can do everything
CREATE POLICY "Admins can insert news" ON public.news
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update news" ON public.news
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete news" ON public.news
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Admins can also read all news (including unpublished)
CREATE POLICY "Admins can read all news" ON public.news
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for news
ALTER PUBLICATION supabase_realtime ADD TABLE public.news;
