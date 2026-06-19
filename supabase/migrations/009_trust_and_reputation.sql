-- Phase 4: Trust & Reputation
-- Adds: is_admin, listing_flags table, flag threshold trigger,
-- tightened vouch RLS, admin update policies, updated dormant sweep.

-- ── Admin field + helper ──────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- SECURITY DEFINER avoids RLS recursion when other policies call this
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = ''
as $$ select coalesce((select is_admin from public.profiles where id = auth.uid()), false) $$;

-- ── listing_flags table ───────────────────────────────────────────────────────
create table if not exists public.listing_flags (
  id           uuid primary key default uuid_generate_v4(),
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id   uuid not null references public.listings(id) on delete cascade,
  reason       text not null check (reason in (
    'inappropriate_content', 'spam', 'misleading', 'other'
  )),
  details      text,
  reviewed     boolean not null default false,
  created_at   timestamptz not null default now(),
  unique (from_user_id, listing_id)
);

alter table public.listing_flags enable row level security;

create policy "Users can see own listing flags or admin"
  on public.listing_flags for select
  using (auth.uid() = from_user_id or public.is_admin());

create policy "Authenticated users can flag listings"
  on public.listing_flags for insert
  with check (auth.uid() = from_user_id);

create policy "Admins can update listing flags"
  on public.listing_flags for update
  using (public.is_admin());

-- ── User flags: admin read + update ──────────────────────────────────────────
drop policy if exists "Users can see their own flags" on public.flags;
create policy "Users can see own flags or admin"
  on public.flags for select
  using (auth.uid() = from_user_id or public.is_admin());

drop policy if exists "Admins can update flags" on public.flags;
create policy "Admins can update flags"
  on public.flags for update
  using (public.is_admin());

-- ── Profiles: admin can update any profile ───────────────────────────────────
drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin());

-- ── Flag threshold trigger ────────────────────────────────────────────────────
-- 3+ unique flaggers from different users → suspend pending review
create or replace function public.handle_flag_inserted()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  unique_flaggers integer;
begin
  select count(distinct from_user_id) into unique_flaggers
  from public.flags
  where to_user_id = new.to_user_id;

  if unique_flaggers >= 3 then
    update public.profiles
    set account_status = 'suspended'
    where id = new.to_user_id
      and account_status not in ('suspended');
  end if;

  return new;
end;
$$;

drop trigger if exists on_flag_inserted on public.flags;
create trigger on_flag_inserted
  after insert on public.flags
  for each row execute procedure public.handle_flag_inserted();

-- ── Vouch RLS: require completed trade ───────────────────────────────────────
drop policy if exists "Authenticated can vouch" on public.vouches;
drop policy if exists "Trade parties can vouch" on public.vouches;
create policy "Trade parties can vouch"
  on public.vouches for insert
  with check (
    auth.uid() = from_user_id
    and exists (
      select 1 from public.trades t
      join public.offers o on o.id = t.offer_id
      where t.id = trade_id
        and t.completed_at is not null
        and (
          o.from_user_id = auth.uid()
          or (select l.user_id from public.listings l where l.id = t.listing_id) = auth.uid()
        )
    )
  );

-- ── Dormant sweep: also mark listings dormant ─────────────────────────────────
create or replace function public.sweep_dormant_accounts()
returns void language plpgsql security definer set search_path = '' as $$
begin
  -- Step 1: mark accounts dormant (those with no active listings and no active grace)
  update public.profiles p
  set account_status = 'dormant'
  where p.account_status in ('active', 'grace')
    and not exists (
      select 1 from public.listings l
      where l.user_id = p.id and l.status = 'active'
    )
    and not exists (
      select 1 from public.listings l
      where l.user_id = p.id
        and l.status = 'traded'
        and l.grace_ends_at > now()
    );

  -- Step 2: hide active listings of dormant accounts
  update public.listings l
  set status = 'dormant'
  from public.profiles p
  where l.user_id = p.id
    and p.account_status = 'dormant'
    and l.status = 'active';
end;
$$;

-- ── Schedule dormant sweep ────────────────────────────────────────────────────
-- If pg_cron is enabled (Supabase Pro+), uncomment:
-- select cron.schedule('sweep-dormant', '0 3 * * *', 'select public.sweep_dormant_accounts()');
-- Otherwise run manually or via Supabase Edge Function cron.
