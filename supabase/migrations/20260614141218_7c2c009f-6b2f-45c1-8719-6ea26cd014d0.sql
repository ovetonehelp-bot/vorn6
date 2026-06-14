DROP POLICY IF EXISTS "Public can read published product backups" ON public.product_backup;
CREATE POLICY "Public can read published product backups"
ON public.product_backup
FOR SELECT
TO anon, authenticated
USING (is_published = true);

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.handle_admin_signup() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_admin_signup() TO service_role;