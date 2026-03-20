ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS requested_plan text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS amount_inr numeric;

CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sender text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_support_messages_user_created_at
  ON public.support_messages (user_id, created_at DESC);

DROP POLICY IF EXISTS "Users and admins can view support messages" ON public.support_messages;
CREATE POLICY "Users and admins can view support messages"
ON public.support_messages
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can send own support messages" ON public.support_messages;
CREATE POLICY "Users can send own support messages"
ON public.support_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND sender = 'user');

DROP POLICY IF EXISTS "Admins can send support replies" ON public.support_messages;
CREATE POLICY "Admins can send support replies"
ON public.support_messages
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND sender = 'admin');

DROP POLICY IF EXISTS "Admins can update support messages" ON public.support_messages;
CREATE POLICY "Admins can update support messages"
ON public.support_messages
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert referrals" ON public.referrals;
CREATE POLICY "Admins can insert referrals"
ON public.referrals
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update referrals" ON public.referrals;
CREATE POLICY "Admins can update referrals"
ON public.referrals
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete referrals" ON public.referrals;
CREATE POLICY "Admins can delete referrals"
ON public.referrals
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));