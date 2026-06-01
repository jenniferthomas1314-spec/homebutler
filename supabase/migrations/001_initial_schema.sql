-- HomeButler Database Schema
-- Run this in Supabase SQL editor or via Supabase CLI
-- supabase/migrations/001_initial_schema.sql

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Users (extends Supabase auth.users) ──────────────────
create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  name        text not null default '',
  initials    text not null default '',
  avatar_color      text not null default '#e8d5a3',
  avatar_text_color text not null default '#6b4c1a',
  plan        text not null default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id text,
  butler_name  text not null default 'Alfred',
  butler_trait text not null default 'formal' check (butler_trait in ('formal','friendly','concise','witty')),
  affiliate_tags    jsonb not null default '{}',
  saved_part_specs  jsonb not null default '{}',
  notif_prefs       jsonb not null default '{"inApp":true,"advanceDays":[7],"triggers":{"tasksDue":true,"tasksOverdue":true,"warrantyExpiring":true,"docExpiring":true}}',
  completed_guides  jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Properties ────────────────────────────────────────────
create table public.properties (
  id            uuid default uuid_generate_v4() primary key,
  owner_id      uuid references public.profiles on delete cascade not null,
  name          text not null,
  address       text not null default '',
  type          text not null default 'Single family',
  emoji         text not null default '🏠',
  purchase_date text,
  purchase_price numeric,
  year_built    text,
  total_saved   numeric not null default 0,
  transfer_code text unique,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Property Members ──────────────────────────────────────
create table public.property_members (
  id          uuid default uuid_generate_v4() primary key,
  property_id uuid references public.properties on delete cascade not null,
  user_id     uuid references public.profiles on delete cascade not null,
  role        text not null default 'member' check (role in ('owner','admin','member','viewer')),
  joined_at   timestamptz not null default now(),
  unique (property_id, user_id)
);

-- ── Property Invites ──────────────────────────────────────
create table public.property_invites (
  id          uuid default uuid_generate_v4() primary key,
  property_id uuid references public.properties on delete cascade not null,
  code        text not null unique,
  email       text,
  role        text not null default 'member',
  status      text not null default 'pending' check (status in ('pending','accepted','revoked')),
  created_at  timestamptz not null default now()
);

-- ── Tasks ─────────────────────────────────────────────────
create table public.tasks (
  id                 uuid default uuid_generate_v4() primary key,
  property_id        uuid references public.properties on delete cascade not null,
  name               text not null,
  area               text not null default 'General',
  due_date           text not null,
  recur              text not null default '',
  done               boolean not null default false,
  notes              text not null default '',
  completion_history jsonb not null default '[]',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ── Appliances ────────────────────────────────────────────
create table public.appliances (
  id          uuid default uuid_generate_v4() primary key,
  property_id uuid references public.properties on delete cascade not null,
  name        text not null,
  brand       text not null default '',
  model       text not null default '',
  purchased   text not null default '',
  warranty    text not null default '',
  notes       text not null default '',
  history     jsonb not null default '[]',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Contractors ───────────────────────────────────────────
create table public.contractors (
  id          uuid default uuid_generate_v4() primary key,
  property_id uuid references public.properties on delete cascade not null,
  name        text not null,
  trade       text not null default 'General',
  phone       text not null default '',
  rating      integer not null default 5 check (rating between 1 and 5),
  notes       text not null default '',
  created_at  timestamptz not null default now()
);

-- ── Costs ─────────────────────────────────────────────────
create table public.costs (
  id          uuid default uuid_generate_v4() primary key,
  property_id uuid references public.properties on delete cascade not null,
  description text not null,
  category    text not null default 'General',
  amount      numeric not null,
  cost_date   text not null,
  created_at  timestamptz not null default now()
);

-- ── Document Vault ────────────────────────────────────────
create table public.vault_documents (
  id          uuid default uuid_generate_v4() primary key,
  property_id uuid references public.properties on delete cascade not null,
  type        text not null default 'other',
  name        text not null,
  issuer      text not null default '',
  appliance   text not null default '',
  room        text not null default '',
  date_added  text,
  expiry_date text,
  amount      numeric,
  notes       text not null default '',
  file_name   text not null default '',
  file_size   bigint,
  file_path   text,    -- Supabase Storage path
  added_at    timestamptz not null default now()
);

-- ── Timeline Events ───────────────────────────────────────
create table public.timeline_events (
  id          uuid default uuid_generate_v4() primary key,
  property_id uuid references public.properties on delete cascade not null,
  type        text not null default 'renovation',
  title       text not null,
  event_date  text not null,
  notes       text not null default '',
  amount      numeric,
  added_at    timestamptz not null default now()
);

-- ── Seasonal Checklists ───────────────────────────────────
create table public.seasonal_items (
  id          uuid default uuid_generate_v4() primary key,
  property_id uuid references public.properties on delete cascade not null,
  season      text not null check (season in ('Spring','Summer','Fall','Winter')),
  item        text not null,
  unique (property_id, season, item)
);

-- ── Activity Log ──────────────────────────────────────────
create table public.activity_log (
  id          uuid default uuid_generate_v4() primary key,
  property_id uuid references public.properties on delete cascade not null,
  user_id     uuid references public.profiles on delete cascade,
  type        text not null,
  message     text not null,
  created_at  timestamptz not null default now()
);

-- ── Subscriptions ─────────────────────────────────────────
create table public.subscriptions (
  id                    uuid default uuid_generate_v4() primary key,
  user_id               uuid references public.profiles on delete cascade not null unique,
  stripe_customer_id    text not null,
  stripe_subscription_id text not null unique,
  status                text not null,
  plan                  text not null check (plan in ('monthly','yearly')),
  current_period_end    timestamptz not null,
  cancel_at_period_end  boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ── AI Message Log (for rate limiting on free plan) ──────
create table public.ai_messages (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles on delete cascade not null,
  created_at  timestamptz not null default now()
);

-- ── Row Level Security ────────────────────────────────────
alter table public.profiles          enable row level security;
alter table public.properties        enable row level security;
alter table public.property_members  enable row level security;
alter table public.property_invites  enable row level security;
alter table public.tasks             enable row level security;
alter table public.appliances        enable row level security;
alter table public.contractors       enable row level security;
alter table public.costs             enable row level security;
alter table public.vault_documents   enable row level security;
alter table public.timeline_events   enable row level security;
alter table public.seasonal_items    enable row level security;
alter table public.activity_log      enable row level security;
alter table public.subscriptions     enable row level security;
alter table public.ai_messages       enable row level security;

-- ── RLS Policies ──────────────────────────────────────────

-- Profiles: users can read/update their own
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Properties: visible to members
create policy "Members can view properties" on public.properties
  for select using (
    id in (
      select property_id from public.property_members
      where user_id = auth.uid()
    )
  );
create policy "Owners can insert properties" on public.properties
  for insert with check (owner_id = auth.uid());
create policy "Owners and admins can update properties" on public.properties
  for update using (
    id in (
      select property_id from public.property_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );
create policy "Only owners can delete properties" on public.properties
  for delete using (owner_id = auth.uid());

-- Property members: visible to members of the same property
create policy "Members can view property members" on public.property_members
  for select using (
    property_id in (
      select property_id from public.property_members
      where user_id = auth.uid()
    )
  );

-- Tasks, Appliances, etc.: accessible to property members
-- (same pattern — members of the property can read, editors can write)
create policy "Members can view tasks" on public.tasks
  for select using (
    property_id in (select property_id from public.property_members where user_id = auth.uid())
  );
create policy "Editors can modify tasks" on public.tasks
  for all using (
    property_id in (
      select property_id from public.property_members
      where user_id = auth.uid() and role in ('owner', 'admin', 'member')
    )
  );

-- Vault documents
create policy "Members can view vault" on public.vault_documents
  for select using (
    property_id in (select property_id from public.property_members where user_id = auth.uid())
  );
create policy "Editors can modify vault" on public.vault_documents
  for all using (
    property_id in (
      select property_id from public.property_members
      where user_id = auth.uid() and role in ('owner', 'admin', 'member')
    )
  );

-- Subscriptions: own only
create policy "Users can view own subscription" on public.subscriptions
  for select using (user_id = auth.uid());

-- AI messages: own only
create policy "Users can view own ai messages" on public.ai_messages
  for select using (user_id = auth.uid());
create policy "Users can insert ai messages" on public.ai_messages
  for insert with check (user_id = auth.uid());

-- ── Functions ─────────────────────────────────────────────

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    upper(left(coalesce(new.raw_user_meta_data->>'name', new.email), 2))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Count AI messages today (for free plan rate limiting)
create or replace function public.count_ai_messages_today(p_user_id uuid)
returns integer as $$
  select count(*)::integer from public.ai_messages
  where user_id = p_user_id
  and created_at > now() - interval '24 hours';
$$ language sql security definer;

-- ── Storage Buckets ───────────────────────────────────────
-- Run these in Supabase dashboard: Storage > New Bucket
-- Name: vault-documents, Public: false
-- Policies: authenticated users can upload to their own folder (user_id/property_id/*)
