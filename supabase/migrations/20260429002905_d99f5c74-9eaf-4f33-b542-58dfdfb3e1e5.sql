CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_payment_enabled boolean NOT NULL DEFAULT true,
  upi_id text NOT NULL DEFAULT 'yourname@upi',
  payee_name text NOT NULL DEFAULT 'SMMFLIX',
  support_whatsapp text NOT NULL DEFAULT '918848490476',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings"
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins update site settings"
  ON public.site_settings FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert site settings"
  ON public.site_settings FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.site_settings (qr_payment_enabled, upi_id, payee_name, support_whatsapp)
SELECT true, 'yourname@upi', 'SMMFLIX', '918848490476'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);

ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;