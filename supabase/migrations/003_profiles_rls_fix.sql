-- Fix RLS policies on public.profiles
--
-- Problems addressed:
-- 1. No INSERT policy — upsert in ProfileSetupForm fails when the trigger row
--    doesn't exist yet (trigger ran as security definer and succeeded, but
--    any re-run or edge case leaves the client blocked).
-- 2. SELECT policy excludes dormant users from reading their own profile.
-- 3. UPDATE policy missing WITH CHECK (allows changing id column via API).

-- ── SELECT ────────────────────────────────────────────────────────────────────
-- Drop and replace the overly-restrictive policy.
-- Non-dormant profiles are public; owners can always read their own row.

drop policy if exists "Public profiles are viewable" on public.profiles;

create policy "Public profiles are viewable"
  on public.profiles for select
  using (
    account_status != 'dormant'   -- visible to everyone
    or auth.uid() = id            -- always visible to the owner (even if dormant)
  );

-- ── INSERT ────────────────────────────────────────────────────────────────────
-- Authenticated users can insert exactly their own profile row.
-- The trigger also creates this row (security definer, bypasses RLS),
-- so in the normal flow this policy only fires on the upsert fallback path.

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ── UPDATE ────────────────────────────────────────────────────────────────────
-- Add WITH CHECK so the id column can't be swapped out via an update.
-- (USING already filters to the right row; WITH CHECK prevents the
--  returned row from having a different id.)

drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
