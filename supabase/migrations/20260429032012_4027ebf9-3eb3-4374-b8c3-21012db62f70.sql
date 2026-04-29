-- Backfill admin role for existing ovetonehelp@gmail.com user(s)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'ovetonehelp@gmail.com'
ON CONFLICT DO NOTHING;