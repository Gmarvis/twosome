-- ============================================================
-- Twosome: Initial migration
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- Users (extends auth.users)
-- ============================================================

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  avatar_color text not null default '#F43F5E',
  total_games integer not null default 0,
  total_words integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', 'Player'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row execute procedure public.update_updated_at();

-- ============================================================
-- Friends
-- ============================================================

create table public.friends (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  friend_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  unique(user_id, friend_id)
);

create index idx_friends_user on public.friends(user_id);
create index idx_friends_friend on public.friends(friend_id);

-- ============================================================
-- Rooms
-- ============================================================

create table public.rooms (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  host_id uuid references public.users(id),
  game_mode text not null check (game_mode in ('word', 'sentence')),
  turn_timer integer check (turn_timer in (5, 10, 15)),
  max_turns integer check (max_turns in (10, 20, 50)),
  prompt text,
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  created_at timestamptz not null default now()
);

create index idx_rooms_code on public.rooms(code);
create index idx_rooms_status on public.rooms(status);

-- ============================================================
-- Room players
-- ============================================================

create table public.room_players (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid references public.users(id),
  display_name text not null,
  is_host boolean not null default false,
  is_ready boolean not null default false,
  joined_at timestamptz not null default now()
);

create index idx_room_players_room on public.room_players(room_id);
create index idx_room_players_user on public.room_players(user_id);

-- ============================================================
-- Turns
-- ============================================================

create table public.turns (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  player_id uuid not null references public.room_players(id) on delete cascade,
  content text not null,
  turn_number integer not null,
  response_time_ms integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_turns_room on public.turns(room_id, turn_number);

-- ============================================================
-- Saved stories
-- ============================================================

create table public.saved_stories (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  full_text text not null,
  player_contributions jsonb not null default '{}'::jsonb,
  stats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(room_id, user_id)
);

create index idx_saved_stories_user on public.saved_stories(user_id, created_at desc);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.users enable row level security;
alter table public.friends enable row level security;
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.turns enable row level security;
alter table public.saved_stories enable row level security;

-- Users: read own profile, update own profile
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- Users: read other profiles (for friend list, game partners)
create policy "users_select_others" on public.users
  for select using (true);

-- Friends: manage own friendships
create policy "friends_select" on public.friends
  for select using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "friends_insert" on public.friends
  for insert with check (auth.uid() = user_id);

create policy "friends_update" on public.friends
  for update using (auth.uid() = friend_id);

create policy "friends_delete" on public.friends
  for delete using (auth.uid() = user_id or auth.uid() = friend_id);

-- Rooms: anyone can create, read rooms they're in
create policy "rooms_insert" on public.rooms
  for insert with check (true);

create policy "rooms_select" on public.rooms
  for select using (true);

create policy "rooms_update" on public.rooms
  for update using (true);

-- Room players: join rooms, read players in same room
create policy "room_players_insert" on public.room_players
  for insert with check (true);

create policy "room_players_select" on public.room_players
  for select using (true);

create policy "room_players_update" on public.room_players
  for update using (true);

create policy "room_players_delete" on public.room_players
  for delete using (true);

-- Turns: insert own turns, read turns in rooms you're in
create policy "turns_insert" on public.turns
  for insert with check (true);

create policy "turns_select" on public.turns
  for select using (true);

-- Saved stories: manage own stories
create policy "saved_stories_insert" on public.saved_stories
  for insert with check (auth.uid() = user_id);

create policy "saved_stories_select" on public.saved_stories
  for select using (auth.uid() = user_id);

create policy "saved_stories_delete" on public.saved_stories
  for delete using (auth.uid() = user_id);

-- ============================================================
-- Enable Realtime
-- ============================================================

alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_players;
alter publication supabase_realtime add table public.turns;

-- ============================================================
-- Cleanup: auto-delete rooms older than 24h
-- ============================================================

create or replace function public.cleanup_old_rooms()
returns void
language sql
as $$
  delete from public.rooms
  where created_at < now() - interval '24 hours'
  and status = 'finished';
$$;
