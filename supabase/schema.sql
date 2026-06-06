-- Run this in your Supabase SQL editor to set up the schema

create table if not exists users (
  sleeper_user_id text primary key,
  username        text not null,
  display_name    text,
  avatar          text,
  created_at      timestamptz default now()
);

create table if not exists bagels (
  id               uuid primary key default gen_random_uuid(),
  week             int  not null,
  season           text not null,
  roster_id        int  not null,
  owner_user_id    text not null references users(sleeper_user_id),
  player_id        text not null,
  player_name      text not null,
  video_url        text,
  video_path       text,
  created_at       timestamptz default now(),
  unique (week, season, roster_id, player_id)
);

create table if not exists ratings (
  id             uuid primary key default gen_random_uuid(),
  bagel_id       uuid not null references bagels(id) on delete cascade,
  rater_user_id  text not null references users(sleeper_user_id),
  score          int  not null check (score >= 1 and score <= 10),
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique (bagel_id, rater_user_id)
);

create table if not exists synced_weeks (
  week       int  not null,
  season     text not null,
  synced_at  timestamptz default now(),
  primary key (week, season)
);

-- Player name cache — populated lazily after sync
create table if not exists players (
  player_id  text primary key,
  name       text not null,
  position   text,
  team       text
);

-- Storage bucket for chug videos (run after creating the bucket named "bagel-videos")
-- insert into storage.buckets (id, name, public) values ('bagel-videos', 'bagel-videos', false);

-- RLS: keep it simple — service role key bypasses all policies
alter table users         enable row level security;
alter table bagels        enable row level security;
alter table ratings       enable row level security;
alter table synced_weeks  enable row level security;

-- Allow public read on everything (the app enforces write auth itself)
create policy "public read users"        on users        for select using (true);
create policy "public read bagels"       on bagels       for select using (true);
create policy "public read ratings"      on ratings      for select using (true);
create policy "public read synced_weeks" on synced_weeks for select using (true);
create policy "public read players"      on players      for select using (true);
