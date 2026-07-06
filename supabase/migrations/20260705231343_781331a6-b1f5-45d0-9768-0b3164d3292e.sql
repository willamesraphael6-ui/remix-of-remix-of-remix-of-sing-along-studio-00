
-- Roles
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  stage_name text not null,
  avatar_url text,
  city text,
  bio text,
  total_score numeric not null default 0,
  performances_count integer not null default 0,
  best_score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.profiles to anon;
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles public read" on public.profiles for select using (true);
create policy "insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Songs history
create table public.songs_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  youtube_id text not null,
  title text not null,
  channel text,
  duration integer,
  thumbnail_url text,
  chosen_at timestamptz not null default now()
);
grant select, insert, delete on public.songs_history to authenticated;
grant all on public.songs_history to service_role;
alter table public.songs_history enable row level security;
create policy "own history read" on public.songs_history for select to authenticated using (auth.uid() = user_id);
create policy "own history insert" on public.songs_history for insert to authenticated with check (auth.uid() = user_id);
create policy "own history delete" on public.songs_history for delete to authenticated using (auth.uid() = user_id);
create index songs_history_user_idx on public.songs_history(user_id, chosen_at desc);

-- Performances
create table public.performances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  youtube_id text not null,
  title text not null,
  audio_path text,
  score integer not null default 0,
  ai_feedback text,
  transcript text,
  created_at timestamptz not null default now()
);
grant select on public.performances to anon;
grant select, insert, delete on public.performances to authenticated;
grant all on public.performances to service_role;
alter table public.performances enable row level security;
create policy "performances public read" on public.performances for select using (true);
create policy "own performances insert" on public.performances for insert to authenticated with check (auth.uid() = user_id);
create policy "own performances delete" on public.performances for delete to authenticated using (auth.uid() = user_id);
create index performances_user_idx on public.performances(user_id, created_at desc);
create index performances_score_idx on public.performances(score desc, created_at desc);

-- Push subscriptions
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  notify_hour integer not null default 19 check (notify_hour between 0 and 23),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant all on public.push_subscriptions to service_role;
alter table public.push_subscriptions enable row level security;
create policy "own push read" on public.push_subscriptions for select to authenticated using (auth.uid() = user_id);
create policy "own push insert" on public.push_subscriptions for insert to authenticated with check (auth.uid() = user_id);
create policy "own push update" on public.push_subscriptions for update to authenticated using (auth.uid() = user_id);
create policy "own push delete" on public.push_subscriptions for delete to authenticated using (auth.uid() = user_id);

-- Trigger: auto-create profile + role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, stage_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'stage_name', split_part(coalesce(new.email, 'cantor'), '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger: update profile aggregates after new performance
create or replace function public.bump_profile_after_performance()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set
    total_score = total_score + new.score,
    performances_count = performances_count + 1,
    best_score = greatest(best_score, new.score),
    updated_at = now()
  where id = new.user_id;
  return new;
end;
$$;

create trigger on_performance_created
  after insert on public.performances
  for each row execute function public.bump_profile_after_performance();

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
