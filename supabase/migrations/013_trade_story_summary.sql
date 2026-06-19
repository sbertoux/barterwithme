-- Split trade stories into auto-generated summary + optional personal note.
-- Previously story_text held everything the user typed (the full trade description).
-- Now:
--   trade_summary  — auto-generated server-side from offer_description + listing title
--   story_text     — optional personal note ("how did it go?"), nullable

alter table public.trade_stories
  add column if not exists trade_summary text;

-- Allow story_text to be null so stories can be submitted with only the summary.
alter table public.trade_stories
  alter column story_text drop not null;
