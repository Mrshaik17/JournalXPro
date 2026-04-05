
-- Create payouts table
CREATE TABLE public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_name text NOT NULL,
  payout_amount numeric NOT NULL DEFAULT 0,
  screenshot_url text,
  received_date date NOT NULL DEFAULT CURRENT_DATE,
  share_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payouts" ON public.payouts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payouts" ON public.payouts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own payouts" ON public.payouts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Public can view shared payouts" ON public.payouts FOR SELECT USING (share_token IS NOT NULL);

-- Add share_token to accounts
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS share_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');
