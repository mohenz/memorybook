-- DRAFT — design review only. Not wired into scripts/supabase-db.mjs (migrate reads a
-- hardcoded path) and NOT applied to any database. Rename to .sql and update that script
-- only after this design is explicitly approved.
--
-- Replaces public.memo_states (single JSONB blob per user) with per-entity, per-user
-- tables. The existing data was already lost/reset, so this ships with no backfill from
-- memo_states — content tables start empty. memo_states is left in place but unused (this
-- agent does not run DROP/ALTER/TRUNCATE per project DB-safety rules); drop it manually
-- from the dashboard once you've confirmed the new tables are working.

-- public.users is the app's own profile row, separate from auth.users — every content
-- table below references THIS table, not auth.users directly, and every existing/new
-- auth account gets a row here automatically (backfill + trigger further down).
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  dark_mode boolean not null default false,
  profile_image text not null default '',
  notification_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.groups (
  user_id uuid not null references public.users(id) on delete cascade,
  id text not null,
  name text not null,
  icon text,
  position integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.notes (
  user_id uuid not null references public.users(id) on delete cascade,
  id text not null,
  -- Hard FK to groups: a note can only reference a group its own user owns. If that
  -- group is ever deleted, the note is NOT deleted with it — it just becomes ungrouped
  -- (set null), since silently deleting someone's notes because a folder was removed
  -- would be a surprise data loss in its own right.
  group_id text,
  title text not null default '',
  content text not null default '',
  date_string text not null,
  is_favorite boolean not null default false,
  is_deleted boolean not null default false,
  images jsonb not null default '[]'::jsonb,
  checklist jsonb not null default '[]'::jsonb,
  -- app-formatted Korean display strings (e.g. "2026년 8월 24일 오후 3:20"), preserved
  -- as-is from the current client behavior — NOT parseable timestamps.
  created_at text not null default '',
  updated_at text not null default '',
  -- DB-managed, for ordering/conflict/Realtime use — independent of the display strings above.
  db_updated_at timestamptz not null default now(),
  primary key (user_id, id),
  -- Composite FK: without naming the column, "on delete set null" would null out
  -- user_id too (which is not-null) and the delete would fail. PG15+ column-list
  -- syntax nulls only group_id.
  foreign key (user_id, group_id) references public.groups (user_id, id) on delete set null (group_id)
);

create index if not exists notes_user_group_idx on public.notes (user_id, group_id);
create index if not exists notes_user_deleted_idx on public.notes (user_id, is_deleted);

create table if not exists public.schedules (
  user_id uuid not null references public.users(id) on delete cascade,
  id text not null,
  title text not null,
  date_string text not null,
  all_day boolean not null default false,
  start_time text,
  end_time text,
  priority text not null default 'normal' check (priority in ('high', 'normal', 'low')),
  memo text,
  recurrence jsonb,
  reminder jsonb,
  is_deleted boolean not null default false,
  created_at text not null default '',
  updated_at text not null default '',
  db_updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists schedules_user_date_idx on public.schedules (user_id, date_string);
create index if not exists schedules_user_deleted_idx on public.schedules (user_id, is_deleted);

create table if not exists public.todos (
  user_id uuid not null references public.users(id) on delete cascade,
  id text not null,
  text text not null,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  created_date_string text not null,
  target_date_string text,
  -- todos already store real ISO timestamps client-side, unlike notes/schedules above.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists todos_user_status_idx on public.todos (user_id, status);
create index if not exists todos_user_target_idx on public.todos (user_id, target_date_string);

-- Reuse the existing shared trigger function from the initial migration.
drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute function public.memorybook_set_updated_at();

drop trigger if exists groups_set_updated_at on public.groups;
create trigger groups_set_updated_at
before update on public.groups
for each row execute function public.memorybook_set_updated_at();

-- notes/schedules use db_updated_at, not updated_at, for the trigger target.
create or replace function public.memorybook_set_db_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.db_updated_at = now();
  return new;
end;
$$;

drop trigger if exists notes_set_db_updated_at on public.notes;
create trigger notes_set_db_updated_at
before update on public.notes
for each row execute function public.memorybook_set_db_updated_at();

drop trigger if exists schedules_set_db_updated_at on public.schedules;
create trigger schedules_set_db_updated_at
before update on public.schedules
for each row execute function public.memorybook_set_db_updated_at();

drop trigger if exists todos_set_updated_at on public.todos;
create trigger todos_set_updated_at
before update on public.todos
for each row execute function public.memorybook_set_updated_at();

-- Auto-provision a public.users row whenever a new auth account is created, so the
-- app never has to race a manual "create my profile row" call after signup.
create or replace function public.memorybook_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_memorybook on auth.users;
create trigger on_auth_user_created_memorybook
after insert on auth.users
for each row execute function public.memorybook_handle_new_user();

-- Backfill public.users for accounts that already exist (signed up before this trigger).
insert into public.users (id)
select id from auth.users
on conflict (id) do nothing;

alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.notes enable row level security;
alter table public.schedules enable row level security;
alter table public.todos enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'users' and policyname = 'users_select_own') then
    create policy users_select_own on public.users for select to authenticated using ((select auth.uid()) = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'users' and policyname = 'users_update_own') then
    create policy users_update_own on public.users for update to authenticated
      using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
  end if;
  -- No insert policy for users: rows are created only by the security-definer trigger above.

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'groups' and policyname = 'groups_all_own') then
    create policy groups_all_own on public.groups for all to authenticated
      using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notes' and policyname = 'notes_all_own') then
    create policy notes_all_own on public.notes for all to authenticated
      using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'schedules' and policyname = 'schedules_all_own') then
    create policy schedules_all_own on public.schedules for all to authenticated
      using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'todos' and policyname = 'todos_all_own') then
    create policy todos_all_own on public.todos for all to authenticated
      using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;
end;
$$;

revoke all on public.users, public.groups, public.notes, public.schedules, public.todos from anon;
grant select, update on public.users to authenticated;
grant select, insert, update, delete on public.groups, public.notes, public.schedules, public.todos to authenticated;
