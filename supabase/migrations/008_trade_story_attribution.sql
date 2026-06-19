-- Track who posted each trade story so the History tab can show it.
-- Existing rows get null (can't retroactively know); new inserts will set it.

alter table public.trade_stories
  add column if not exists user_id uuid references public.profiles(id);

-- Allow users to read their own stories regardless of is_public
drop policy if exists "Users can read own stories" on public.trade_stories;
create policy "Users can read own stories"
  on public.trade_stories for select
  using (auth.uid() = user_id);
