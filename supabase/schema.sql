-- Enable UUIDs
create extension if not exists "uuid-ossp";

-- devices: one row per browser-install (localStorage device_id)
create table if not exists devices (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

-- subscriptions: active Web Push endpoints for a device
create table if not exists subscriptions (
  id uuid primary key default uuid_generate_v4(),
  device_id uuid not null references devices(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  active boolean not null default true,
  unique(endpoint)
);

-- facts: the user-entered short text
create table if not exists facts (
  id uuid primary key default uuid_generate_v4(),
  device_id uuid not null references devices(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now(),
  deleted boolean not null default false
);

-- reminders: fan-out schedule per fact
create table if not exists reminders (
  id uuid primary key default uuid_generate_v4(),
  device_id uuid not null references devices(id) on delete cascade,
  fact_id uuid not null references facts(id) on delete cascade,
  ix int not null, -- 0..5 for fixed schedule, 100+ for snoozes
  due_at timestamptz not null,
  sent_at timestamptz,
  canceled boolean not null default false
);

-- Helpful indexes
create index if not exists idx_reminders_due on reminders (due_at) where sent_at is null and canceled = false;
create index if not exists idx_reminders_fact_next on reminders (fact_id, due_at) where sent_at is null and canceled = false;
create index if not exists idx_facts_device on facts (device_id) where deleted = false;
