
-- Add new columns to trades table for extended journal fields
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS pair text;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS direction text; -- buy/sell
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS went text; -- where price actually went
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS lot_size numeric;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS bias_1d text; -- 1D bias
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS pips numeric;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS start_balance numeric;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS end_balance numeric;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS entry_time timestamptz;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS exit_time timestamptz;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}';

-- Create admin site_settings table for payment settings, social links, pricing etc
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read site settings (for displaying on frontend)
CREATE POLICY "Anyone can read site settings" ON public.site_settings FOR SELECT USING (true);

-- Only admins can modify site settings
CREATE POLICY "Admins can insert site settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update site settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete site settings" ON public.site_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admins need to view all profiles and payments
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

-- Drop existing restrictive policies on profiles first
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Admins can view all payments
CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update payments" ON public.payments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;

-- Update the add_trade_and_update_balance function with new fields
CREATE OR REPLACE FUNCTION public.add_trade_and_update_balance(
  p_user_id uuid,
  p_account_id uuid,
  p_entry_price numeric DEFAULT NULL,
  p_stop_loss numeric DEFAULT NULL,
  p_take_profit numeric DEFAULT NULL,
  p_result text DEFAULT NULL,
  p_pnl_amount numeric DEFAULT 0,
  p_follow_plan boolean DEFAULT true,
  p_tags text[] DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_pair text DEFAULT NULL,
  p_direction text DEFAULT NULL,
  p_went text DEFAULT NULL,
  p_lot_size numeric DEFAULT NULL,
  p_bias_1d text DEFAULT NULL,
  p_pips numeric DEFAULT NULL,
  p_start_balance numeric DEFAULT NULL,
  p_end_balance numeric DEFAULT NULL,
  p_entry_time timestamptz DEFAULT NULL,
  p_exit_time timestamptz DEFAULT NULL,
  p_custom_fields jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_trade_id UUID;
BEGIN
  INSERT INTO public.trades (user_id, account_id, entry_price, stop_loss, take_profit, result, pnl_amount, follow_plan, tags, notes, pair, direction, went, lot_size, bias_1d, pips, start_balance, end_balance, entry_time, exit_time, custom_fields)
  VALUES (p_user_id, p_account_id, p_entry_price, p_stop_loss, p_take_profit, p_result, p_pnl_amount, p_follow_plan, p_tags, p_notes, p_pair, p_direction, p_went, p_lot_size, p_bias_1d, p_pips, p_start_balance, p_end_balance, p_entry_time, p_exit_time, p_custom_fields)
  RETURNING id INTO new_trade_id;

  UPDATE public.accounts
  SET current_balance = current_balance + p_pnl_amount
  WHERE id = p_account_id AND user_id = p_user_id;

  RETURN new_trade_id;
END;
$$;

-- Enable realtime for site_settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
