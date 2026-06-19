-- Split listing_type into 4 distinct values:
--   item            — one-time physical trade (unchanged)
--   service_onetime — a single service job/session (was: service)
--   service_recurring — an ongoing/repeatable service (new)
--   recurring_goods — regularly available goods (was: recurring)
--
-- Pause-on-acceptance logic (in app) applies only to item + service_onetime.
-- Grace period logic (DB trigger) already checks `= 'item'` — no change needed.

-- 1. Drop the old check constraint
alter table public.listings
  drop constraint if exists listings_listing_type_check;

-- 2. Rename existing values
update public.listings set listing_type = 'service_onetime'  where listing_type = 'service';
update public.listings set listing_type = 'recurring_goods'  where listing_type = 'recurring';

-- 3. Apply new constraint
alter table public.listings
  add constraint listings_listing_type_check
  check (listing_type in ('item', 'service_onetime', 'service_recurring', 'recurring_goods'));

-- 4. Fix the test listing
update public.listings
  set listing_type = 'service_onetime'
  where title = 'Drives to Doctors appt';
