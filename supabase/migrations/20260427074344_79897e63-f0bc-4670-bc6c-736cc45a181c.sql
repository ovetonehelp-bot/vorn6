CREATE TABLE public.discount_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  interest TEXT NOT NULL,
  code TEXT NOT NULL DEFAULT 'WELCOME20',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.discount_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert a discount lead"
ON public.discount_leads
FOR INSERT
WITH CHECK (true);

CREATE INDEX idx_discount_leads_email ON public.discount_leads(email);