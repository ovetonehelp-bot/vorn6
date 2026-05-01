CREATE POLICY "Admins can delete analytics" ON public.analytics_events FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete leads" ON public.discount_leads FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));