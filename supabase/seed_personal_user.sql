-- Personal development seed for ZenFlow.
-- Run this only in the intended Supabase project.
-- Role: authenticated
-- Email: mendezrodriguezisaac4@gmail.com
-- Temporary password: ZenFlow2026!

do $$
declare
  seed_email text := 'mendezrodriguezisaac4@gmail.com';
  seed_password text := 'ZenFlow2026!';
  seed_user_id uuid;
begin
  select id into seed_user_id
  from auth.users
  where email = seed_email
  limit 1;

  if seed_user_id is null then
    seed_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      phone,
      phone_change,
      phone_change_token,
      email_change,
      email_change_token_current,
      email_change_token_new,
      email_change_confirm_status,
      reauthentication_token,
      is_sso_user,
      is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000',
      seed_user_id,
      'authenticated',
      'authenticated',
      seed_email,
      crypt(seed_password, gen_salt('bf')),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Isaac Mendez"}'::jsonb,
      false,
      now(),
      now(),
      '',
      '',
      null,
      '',
      '',
      '',
      '',
      '',
      0,
      '',
      false,
      false
    );
  else
    update auth.users
    set encrypted_password = crypt(seed_password, gen_salt('bf')),
        aud = 'authenticated',
        role = 'authenticated',
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
        raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"full_name":"Isaac Mendez"}'::jsonb,
        confirmation_token = coalesce(confirmation_token, ''),
        recovery_token = coalesce(recovery_token, ''),
        phone_change_token = coalesce(phone_change_token, ''),
        email_change_token_current = coalesce(email_change_token_current, ''),
        email_change_token_new = coalesce(email_change_token_new, ''),
        reauthentication_token = coalesce(reauthentication_token, ''),
        updated_at = now(),
        is_sso_user = false,
        is_anonymous = false
    where id = seed_user_id;
  end if;

  insert into auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    gen_random_uuid(),
    seed_user_id::text,
    seed_user_id,
    jsonb_build_object(
      'sub', seed_user_id::text,
      'email', seed_email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(),
    now(),
    now()
  )
  on conflict (provider_id, provider) do update
  set user_id = excluded.user_id,
      identity_data = excluded.identity_data,
      updated_at = now();

  insert into public.profiles (id, email, full_name)
  values (seed_user_id, seed_email, 'Isaac Mendez')
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      updated_at = now();

  insert into public.user_settings (user_id)
  values (seed_user_id)
  on conflict (user_id) do nothing;
end $$;
