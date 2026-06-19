-- Track when users accepted the Terms of Service.
-- Populated from auth metadata passed during signup.

alter table public.profiles
  add column if not exists terms_accepted_at timestamptz;

-- Update the new-user trigger to capture the acceptance timestamp.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username, region, terms_accepted_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'region', 'Unknown Region'),
    (new.raw_user_meta_data->>'terms_accepted_at')::timestamptz
  );
  return new;
end;
$$;
