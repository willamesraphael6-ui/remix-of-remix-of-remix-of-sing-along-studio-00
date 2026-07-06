
DROP POLICY IF EXISTS "performances public read" ON public.performances;
CREATE POLICY "performances authenticated read" ON public.performances
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles public read" ON public.profiles;
CREATE POLICY "profiles authenticated read" ON public.profiles
  FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.performances FROM anon;
REVOKE SELECT ON public.profiles FROM anon;
