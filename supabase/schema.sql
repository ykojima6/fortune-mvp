create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  birth_date date not null,
  gender text not null default 'other' check (gender in ('male', 'female', 'other')),
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists gender text not null default 'other';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_gender_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_gender_check check (gender in ('male', 'female', 'other'));
  end if;
end;
$$;

create table if not exists public.calendar_days (
  solar_date date primary key,
  lunar_year int not null,
  lunar_month int not null check (lunar_month between 1 and 12),
  lunar_day int not null check (lunar_day between 1 and 30),
  is_leap_month boolean not null default false,
  moon_phase text,
  rokuyo text,
  sexagenary text,
  created_at timestamptz not null default now()
);

create table if not exists public.readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shuku_name text not null,
  shuku_index int not null,
  tarot_card_id int not null check (tarot_card_id between 0 and 21),
  tarot_reversed boolean not null default false,
  calendar_date date not null,
  result_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  reading_id uuid references public.readings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, birth_date, gender, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', '未設定'),
    coalesce(nullif(new.raw_user_meta_data ->> 'birth_date', '')::date, current_date),
    coalesce(nullif(new.raw_user_meta_data ->> 'gender', ''), 'other'),
    coalesce(new.email, '')
  )
  on conflict (id) do update set
    name = excluded.name,
    birth_date = excluded.birth_date,
    gender = excluded.gender,
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

alter table public.profiles enable row level security;
alter table public.calendar_days enable row level security;
alter table public.readings enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "calendar_public_read" on public.calendar_days;
create policy "calendar_public_read" on public.calendar_days
  for select using (true);

drop policy if exists "readings_select_own" on public.readings;
create policy "readings_select_own" on public.readings
  for select using (auth.uid() = user_id);

drop policy if exists "chat_select_own" on public.chat_messages;
create policy "chat_select_own" on public.chat_messages
  for select using (auth.uid() = user_id);

drop policy if exists "chat_insert_own" on public.chat_messages;
create policy "chat_insert_own" on public.chat_messages
  for insert with check (auth.uid() = user_id);
