-- Add is_verified flag to profiles for admin-granted identity verification.
-- Defaults false; set true by admins once phone/ID verification is confirmed.
-- Displayed as a "Verified" badge on public profile pages.

alter table public.profiles
  add column if not exists is_verified boolean not null default false;
