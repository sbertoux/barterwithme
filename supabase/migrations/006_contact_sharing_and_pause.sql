-- Phase 3: Privacy-first contact sharing + listing pause on acceptance
--
-- 1. Contact sharing — either party can voluntarily share contact info
--    within an offer thread. Each party's share is independent.
--    Stored as nullable text on the offer row; null = not shared yet.
--
-- 2. Listing pause — owner can hide listing from Browse/search while
--    finalising a trade without deleting it. Reversible anytime.

-- Contact columns on offers
alter table public.offers
  add column if not exists lister_contact text,
  add column if not exists trader_contact text;

-- Pause flag on listings (is_paused = true hides from Browse; status stays 'active')
alter table public.listings
  add column if not exists is_paused boolean not null default false;
