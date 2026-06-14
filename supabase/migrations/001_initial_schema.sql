-- BarterWithMe — Initial Schema
-- Run this in the Supabase SQL editor for your project.

-- ─────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for fast text search

-- ─────────────────────────────────────────────
-- PROFILES
-- Created automatically when a user signs up via trigger.
-- ─────────────────────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  bio           text,
  region        text not null,               -- derived from zip at signup; zip is never stored
  account_status text not null default 'active'
                check (account_status in ('active', 'grace', 'dormant', 'suspended')),
  trade_count   integer not null default 0,
  vouch_count   integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  last_active   timestamptz not null default now()
);

-- Trigger: create a profile row when a user registers
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username, region)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'region', 'Unknown Region')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────
-- CATEGORIES
-- ─────────────────────────────────────────────
create table public.categories (
  id            serial primary key,
  name          text not null unique,
  slug          text not null unique,
  icon          text,
  display_order integer not null default 0
);

insert into public.categories (name, slug, icon, display_order) values
  ('Food & Garden',             'food-garden',             '🌱', 1),
  ('Skills & Labor',            'skills-labor',            '🔨', 2),
  ('Household & Tools',         'household-tools',         '🏠', 3),
  ('Animals & Livestock',       'animals-livestock',       '🐄', 4),
  ('Professional Services',     'professional-services',   '💼', 5),
  ('Handmade & Crafts',         'handmade-crafts',         '🧶', 6),
  ('Transportation & Hauling',  'transportation',          '🚛', 7),
  ('Valuables & Collectibles',  'valuables-collectibles',  '✨', 8),
  ('Other',                     'other',                   '📦', 9);

-- ─────────────────────────────────────────────
-- LISTINGS
-- ─────────────────────────────────────────────
create table public.listings (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  description   text not null,
  category_id   integer references public.categories(id),
  listing_type  text not null check (listing_type in ('item', 'service', 'recurring')),
  open_to       text,                        -- what they want in return; nullable = open to offers
  photos        text[] default '{}',         -- Supabase Storage public URLs
  status        text not null default 'active'
                check (status in ('active', 'traded', 'dormant')),
  region        text not null,               -- copied from profile at creation time
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  traded_at     timestamptz,
  grace_ends_at timestamptz                  -- 14 days after traded_at for item type
);

-- Full-text search index over title, description, and open_to
create index idx_listings_search on public.listings
  using gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(open_to,'')));

create index idx_listings_user_id on public.listings(user_id);
create index idx_listings_status on public.listings(status);
create index idx_listings_category on public.listings(category_id);

-- ─────────────────────────────────────────────
-- OFFERS
-- ─────────────────────────────────────────────
create table public.offers (
  id                uuid primary key default uuid_generate_v4(),
  listing_id        uuid not null references public.listings(id) on delete cascade,
  from_user_id      uuid not null references public.profiles(id) on delete cascade,
  offer_description text not null,
  status            text not null default 'pending'
                    check (status in ('pending', 'accepted', 'declined', 'countered', 'withdrawn')),
  created_at        timestamptz not null default now(),
  responded_at      timestamptz,
  unique (listing_id, from_user_id)           -- one active offer per user per listing
);

create index idx_offers_listing_id on public.offers(listing_id);
create index idx_offers_from_user on public.offers(from_user_id);

-- ─────────────────────────────────────────────
-- MESSAGES
-- ─────────────────────────────────────────────
create table public.messages (
  id           uuid primary key default uuid_generate_v4(),
  offer_id     uuid not null references public.offers(id) on delete cascade,
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id   uuid not null references public.profiles(id) on delete cascade,
  content      text not null,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index idx_messages_offer_id on public.messages(offer_id);
create index idx_messages_to_user on public.messages(to_user_id);

-- ─────────────────────────────────────────────
-- TRADES
-- ─────────────────────────────────────────────
create table public.trades (
  id                  uuid primary key default uuid_generate_v4(),
  listing_id          uuid not null references public.listings(id),
  offer_id            uuid not null references public.offers(id),
  completed_at        timestamptz,
  confirmed_by_lister boolean not null default false,
  confirmed_by_trader boolean not null default false,
  created_at          timestamptz not null default now()
);

-- When both parties confirm, set completed_at and update listing status
create or replace function public.handle_trade_confirmed()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  listing_type_val text;
begin
  if new.confirmed_by_lister and new.confirmed_by_trader and new.completed_at is null then
    new.completed_at := now();

    select listing_type into listing_type_val
    from public.listings where id = new.listing_id;

    update public.listings set
      status = 'traded',
      traded_at = now(),
      grace_ends_at = case when listing_type_val = 'item' then now() + interval '14 days' else null end
    where id = new.listing_id;

    -- Increment trade count for both parties
    update public.profiles p
    set trade_count = trade_count + 1
    from public.offers o
    where o.id = new.offer_id
      and p.id in (o.from_user_id, (select user_id from public.listings where id = new.listing_id));
  end if;
  return new;
end;
$$;

create trigger on_trade_confirmed
  before update on public.trades
  for each row execute procedure public.handle_trade_confirmed();

-- ─────────────────────────────────────────────
-- TRADE STORIES
-- ─────────────────────────────────────────────
create table public.trade_stories (
  id         uuid primary key default uuid_generate_v4(),
  trade_id   uuid not null references public.trades(id) on delete cascade,
  story_text text not null,
  region     text not null,
  is_public  boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- VOUCHES
-- ─────────────────────────────────────────────
create table public.vouches (
  id           uuid primary key default uuid_generate_v4(),
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id   uuid not null references public.profiles(id) on delete cascade,
  trade_id     uuid not null references public.trades(id),
  note         text,
  created_at   timestamptz not null default now(),
  unique (from_user_id, trade_id)
);

create or replace function public.increment_vouch_count()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set vouch_count = vouch_count + 1 where id = new.to_user_id;
  return new;
end;
$$;

create trigger on_vouch_created
  after insert on public.vouches
  for each row execute procedure public.increment_vouch_count();

-- ─────────────────────────────────────────────
-- FLAGS
-- ─────────────────────────────────────────────
create table public.flags (
  id            uuid primary key default uuid_generate_v4(),
  from_user_id  uuid not null references public.profiles(id) on delete cascade,
  to_user_id    uuid not null references public.profiles(id) on delete cascade,
  trade_id      uuid references public.trades(id),
  reason        text not null check (reason in (
    'not_as_described',
    'no_show',
    'inappropriate_behavior',
    'suspected_fraud',
    'other'
  )),
  details       text,
  severity      text not null default 'standard' check (severity in ('standard', 'severe')),
  reviewed      boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (from_user_id, trade_id)
);

-- ─────────────────────────────────────────────
-- IDEAS / FEATURE REQUESTS
-- ─────────────────────────────────────────────
create table public.ideas (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  description  text not null,
  upvote_count integer not null default 0,
  status       text not null default 'new'
               check (status in ('new', 'under_review', 'planned', 'declined')),
  created_at   timestamptz not null default now()
);

create table public.idea_upvotes (
  id         uuid primary key default uuid_generate_v4(),
  idea_id    uuid not null references public.ideas(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (idea_id, user_id)
);

create or replace function public.sync_idea_upvote_count()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.ideas
  set upvote_count = (select count(*) from public.idea_upvotes where idea_id = coalesce(new.idea_id, old.idea_id))
  where id = coalesce(new.idea_id, old.idea_id);
  return coalesce(new, old);
end;
$$;

create trigger on_idea_upvote
  after insert or delete on public.idea_upvotes
  for each row execute procedure public.sync_idea_upvote_count();

-- ─────────────────────────────────────────────
-- TERMS AGREEMENTS
-- ─────────────────────────────────────────────
create table public.terms_agreements (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  terms_version text not null,
  agreed_at     timestamptz not null default now(),
  ip_hash       text                            -- sha256 of IP, not plaintext
);

-- ─────────────────────────────────────────────
-- DORMANT ACCOUNT AUTOMATION
-- Runs nightly via pg_cron or Supabase Edge Function cron.
-- Marks accounts dormant if grace period expired and no active listings.
-- ─────────────────────────────────────────────
create or replace function public.sweep_dormant_accounts()
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles p
  set account_status = 'dormant'
  where p.account_status in ('active', 'grace')
    and not exists (
      select 1 from public.listings l
      where l.user_id = p.id and l.status = 'active'
    )
    and not exists (
      select 1 from public.listings l
      where l.user_id = p.id
        and l.status = 'traded'
        and l.grace_ends_at > now()
    );
end;
$$;

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

alter table public.profiles         enable row level security;
alter table public.listings         enable row level security;
alter table public.offers           enable row level security;
alter table public.messages         enable row level security;
alter table public.trades           enable row level security;
alter table public.trade_stories    enable row level security;
alter table public.vouches          enable row level security;
alter table public.flags            enable row level security;
alter table public.ideas            enable row level security;
alter table public.idea_upvotes     enable row level security;
alter table public.terms_agreements enable row level security;

-- PROFILES: anyone can read non-dormant profiles; only owner can update
create policy "Public profiles are viewable"
  on public.profiles for select
  using (account_status != 'dormant');

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- LISTINGS: public reads active listings; owners manage theirs
create policy "Active listings are public"
  on public.listings for select
  using (status = 'active');

create policy "Owners can read all their listings"
  on public.listings for select
  using (auth.uid() = user_id);

create policy "Owners can insert listings"
  on public.listings for insert
  with check (auth.uid() = user_id);

create policy "Owners can update listings"
  on public.listings for update
  using (auth.uid() = user_id);

-- OFFERS: only involved parties can see
create policy "Offer parties can read"
  on public.offers for select
  using (
    auth.uid() = from_user_id
    or auth.uid() = (select user_id from public.listings where id = listing_id)
  );

create policy "Authenticated users can make offers"
  on public.offers for insert
  with check (auth.uid() = from_user_id);

create policy "Listing owner can update offer status"
  on public.offers for update
  using (
    auth.uid() = (select user_id from public.listings where id = listing_id)
    or auth.uid() = from_user_id
  );

-- MESSAGES: only sender and recipient
create policy "Message parties can read"
  on public.messages for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Authenticated users can send messages"
  on public.messages for insert
  with check (auth.uid() = from_user_id);

-- TRADES: only involved parties
create policy "Trade parties can read"
  on public.trades for select
  using (
    auth.uid() = (select user_id from public.listings where id = listing_id)
    or auth.uid() = (select from_user_id from public.offers where id = offer_id)
  );

create policy "Trade parties can update"
  on public.trades for update
  using (
    auth.uid() = (select user_id from public.listings where id = listing_id)
    or auth.uid() = (select from_user_id from public.offers where id = offer_id)
  );

-- TRADE STORIES: public can read; anyone involved in trade can insert
create policy "Public trade stories are readable"
  on public.trade_stories for select
  using (is_public = true);

create policy "Trade parties can create stories"
  on public.trade_stories for insert
  with check (
    auth.uid() = (
      select l.user_id from public.trades t
      join public.listings l on l.id = t.listing_id
      where t.id = trade_id
    )
    or auth.uid() = (
      select o.from_user_id from public.trades t
      join public.offers o on o.id = t.offer_id
      where t.id = trade_id
    )
  );

-- VOUCHES: public read; authenticated insert
create policy "Vouches are public"
  on public.vouches for select using (true);

create policy "Authenticated can vouch"
  on public.vouches for insert
  with check (auth.uid() = from_user_id);

-- FLAGS: only admin (service role) and the flagging user can read
create policy "Users can see their own flags"
  on public.flags for select
  using (auth.uid() = from_user_id);

create policy "Authenticated users can flag"
  on public.flags for insert
  with check (auth.uid() = from_user_id);

-- IDEAS: public read; authenticated insert/upvote
create policy "Ideas are public"
  on public.ideas for select using (true);

create policy "Authenticated users can submit ideas"
  on public.ideas for insert
  with check (auth.uid() = user_id);

create policy "Idea upvotes are public"
  on public.idea_upvotes for select using (true);

create policy "Authenticated users can upvote"
  on public.idea_upvotes for insert
  with check (auth.uid() = user_id);

create policy "Users can remove own upvote"
  on public.idea_upvotes for delete
  using (auth.uid() = user_id);

-- TERMS: owner only
create policy "Users can read own agreements"
  on public.terms_agreements for select
  using (auth.uid() = user_id);

create policy "Users can insert own agreements"
  on public.terms_agreements for insert
  with check (auth.uid() = user_id);

-- CATEGORIES: public read, no write (managed via migrations)
alter table public.categories enable row level security;
create policy "Categories are public"
  on public.categories for select using (true);
