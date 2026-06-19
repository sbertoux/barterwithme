-- Ensure offer/trade parties can always read the associated listing regardless
-- of its current status (active → traded).
--
-- Root cause: migration 010 grants trader read access via a correlated subquery
-- on public.offers, which is itself subject to offers RLS. In certain PostgreSQL
-- evaluation orders this creates a circular RLS dependency that silently returns
-- 0 rows — the same root cause documented in migration 004.
--
-- Fix: SECURITY DEFINER function that bypasses offers RLS when checking party
-- membership, identical to the pattern used by get_listing_owner() in migration 004.

create or replace function public.is_offer_or_trade_party(lid uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.offers
    where listing_id = lid
      and from_user_id = auth.uid()
  )
$$;

-- Replace the offers-subquery policy from migration 010 with the SECURITY DEFINER
-- equivalent so no RLS circularity can block the read.
drop policy if exists "Offer parties can read associated listing" on public.listings;

create policy "Offer parties can read associated listing"
  on public.listings for select
  using (
    public.is_offer_or_trade_party(id)
  );
