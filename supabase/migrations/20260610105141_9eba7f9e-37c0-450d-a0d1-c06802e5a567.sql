
CREATE TABLE public.product_backup (
  handle TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  position INT NOT NULL DEFAULT 0,
  backed_up_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_backup TO anon, authenticated;
GRANT ALL ON public.product_backup TO service_role;

ALTER TABLE public.product_backup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read product backups"
  ON public.product_backup FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage product backups"
  ON public.product_backup FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow public read on the product-images bucket
CREATE POLICY "Public read product-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');
