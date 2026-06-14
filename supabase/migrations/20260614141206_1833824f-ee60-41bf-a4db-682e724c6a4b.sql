ALTER TABLE public.product_backup
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'shopify',
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

ALTER TABLE public.product_backup
  ADD CONSTRAINT product_backup_source_check CHECK (source IN ('shopify', 'admin'));

DROP POLICY IF EXISTS "Public can read product backups" ON public.product_backup;
CREATE POLICY "Public can read published product backups"
ON public.product_backup
FOR SELECT
TO anon, authenticated
USING (is_published = true OR public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_product_backup_updated_at ON public.product_backup;
CREATE TRIGGER update_product_backup_updated_at
BEFORE UPDATE ON public.product_backup
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();