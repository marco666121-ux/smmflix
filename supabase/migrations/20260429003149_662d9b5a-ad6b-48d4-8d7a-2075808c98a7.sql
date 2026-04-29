DROP POLICY IF EXISTS "Admins update site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins insert site settings" ON public.site_settings;

CREATE POLICY "Anyone can update site settings"
  ON public.site_settings FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can insert site settings"
  ON public.site_settings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);