-- Activity tracking for offer-maker notifications
--
-- 1. from_user_last_seen_at on offers — stamped when the offer-maker visits the
--    thread. Compared against responded_at to detect unseen status changes
--    (accepted / declined) without an extra notifications table.
--
-- 2. Message read receipts — recipient can set read_at to mark messages seen.
--    Used for unread-message counts in the nav badge and offer list dots.

alter table public.offers
  add column if not exists from_user_last_seen_at timestamptz;

-- The existing offers UPDATE policy (migration 004) already allows both
-- listing owner and offer maker to update. No new policy needed for offers.

-- Allow message recipient to mark received messages as read
drop policy if exists "Recipient can mark messages read" on public.messages;
create policy "Recipient can mark messages read"
  on public.messages for update
  using  (auth.uid() = to_user_id)
  with check (auth.uid() = to_user_id);
