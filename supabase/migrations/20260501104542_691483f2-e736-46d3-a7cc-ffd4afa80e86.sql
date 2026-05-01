update auth.users
set encrypted_password = crypt('@1Ovetone', gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    updated_at = now()
where email = 'ovetonehelp@gmail.com';

insert into public.user_roles (user_id, role)
select id, 'admin'::app_role from auth.users where email = 'ovetonehelp@gmail.com'
on conflict do nothing;