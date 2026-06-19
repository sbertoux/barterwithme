-- Fix offers RLS: listing owner is blocked from reading incoming offers
--
-- Root cause: the SELECT policy uses a correlated subquery on public.listings,
-- which is itself subject to listings RLS. If the inner SELECT returns no rows
-- (e.g. listing is 'traded', or an edge case in policy evaluation order),
-- the comparison evaluates to NULL instead of TRUE, silently excluding the offer.
--
-- Fix: wrap the lookup in a SECURITY DEFINER function that bypasses listings RLS.
-- The function only returns the owner UUID — no sensitive data is exposed.

create or replace function public.get_listing_owner(lid uuid)
returns uuid
language sql
security definer
stable
set search_path = ''
as $$
  select user_id from public.listings where id = lid
$$;

-- ── OFFERS SELECT ─────────────────────────────────────────────────────────────
drop policy if exists "Offer parties can read" on public.offers;

create policy "Offer parties can read"
  on public.offers for select
  using (
    auth.uid() = from_user_id
    or auth.uid() = public.get_listing_owner(listing_id)
  );

-- ── OFFERS UPDATE ─────────────────────────────────────────────────────────────
-- Apply the same fix to the update policy (same subquery pattern).
drop policy if exists "Listing owner can update offer status" on public.offers;

create policy "Listing owner can update offer status"
  on public.offers for update
  using (
    auth.uid() = public.get_listing_owner(listing_id)
    or auth.uid() = from_user_id
  );
