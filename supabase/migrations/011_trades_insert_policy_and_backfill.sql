-- Fix: trades table was missing an INSERT policy.
-- The accept-offer route inserts via the authenticated client (respects RLS),
-- so without this policy every insert silently failed, leaving trade = null
-- and hiding the "Confirm trade complete" UI in the offer thread.

create policy "Listing owner can create trade"
  on public.trades for insert
  with check (
    auth.uid() = (select user_id from public.listings where id = listing_id)
  );

-- Backfill trade records for accepted offers that have no trade row.
-- Both confirmed flags start false so both parties still need to confirm,
-- which correctly increments trade_count via the on_trade_confirmed trigger.
insert into public.trades (listing_id, offer_id)
select o.listing_id, o.id
from public.offers o
where o.status = 'accepted'
  and not exists (
    select 1 from public.trades t where t.offer_id = o.id
  );
