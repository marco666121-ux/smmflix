-- Allow admin panel (gated by local password) to manage bans
DROP POLICY IF EXISTS "Admins manage bans insert" ON public.bans;
DROP POLICY IF EXISTS "Admins manage bans delete" ON public.bans;

CREATE POLICY "Anyone can insert bans"
  ON public.bans FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can delete bans"
  ON public.bans FOR DELETE
  TO anon, authenticated
  USING (true);

-- Also relax profiles SELECT so admin panel can list users without an admin role login
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
CREATE POLICY "Anyone can read profiles for admin panel"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Relax redeem_usage SELECT for admin panel
DROP POLICY IF EXISTS "Admins see all usage" ON public.redeem_usage;
CREATE POLICY "Anyone can read redeem usage for admin panel"
  ON public.redeem_usage FOR SELECT
  TO anon, authenticated
  USING (true);