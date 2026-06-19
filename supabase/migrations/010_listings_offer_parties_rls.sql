-- Allow any user who has made an offer on a listing to read that listing
-- regardless of its current status (active, traded, dormant).
-- Without this, PostgREST JOINs silently drop non-active listings for traders,
-- and separate SELECT queries return null for non-owners once a listing is traded.

create policy "Offer parties can read associated listing"
  on public.listings for select
  using (
    exists (
      select 1 from public.offers
      where listing_id = id
        and from_user_id = auth.uid()
    )
  );
