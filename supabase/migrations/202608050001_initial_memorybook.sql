create extension if not exists pgcrypto;

create table if not exists public.memo_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint memo_states_state_object check (jsonb_typeof(state) = 'object')
);

create table if not exists public.archive_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  mime_type text not null default 'application/octet-stream',
  size_bytes bigint not null check (size_bytes >= 0),
  storage_path text not null unique,
  category text not null check (category in ('image', 'text', 'document', 'other')),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint archive_files_filename_not_blank check (length(btrim(filename)) > 0)
);

create index if not exists archive_files_user_created_idx
  on public.archive_files (user_id, created_at desc);

create or replace function public.memorybook_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists memo_states_set_updated_at on public.memo_states;
create trigger memo_states_set_updated_at
before update on public.memo_states
for each row execute function public.memorybook_set_updated_at();

drop trigger if exists archive_files_set_updated_at on public.archive_files;
create trigger archive_files_set_updated_at
before update on public.archive_files
for each row execute function public.memorybook_set_updated_at();

alter table public.memo_states enable row level security;
alter table public.archive_files enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'memo_states' and policyname = 'memo_states_select_own') then
    create policy memo_states_select_own on public.memo_states for select to authenticated using ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'memo_states' and policyname = 'memo_states_insert_own') then
    create policy memo_states_insert_own on public.memo_states for insert to authenticated with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'memo_states' and policyname = 'memo_states_update_own') then
    create policy memo_states_update_own on public.memo_states for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'archive_files' and policyname = 'archive_files_select_own') then
    create policy archive_files_select_own on public.archive_files for select to authenticated using ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'archive_files' and policyname = 'archive_files_insert_own') then
    create policy archive_files_insert_own on public.archive_files for insert to authenticated with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'archive_files' and policyname = 'archive_files_update_own') then
    create policy archive_files_update_own on public.archive_files for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'archive_files' and policyname = 'archive_files_delete_own') then
    create policy archive_files_delete_own on public.archive_files for delete to authenticated using ((select auth.uid()) = user_id);
  end if;
end;
$$;

revoke all on public.memo_states, public.archive_files from anon;
grant select, insert, update on public.memo_states to authenticated;
grant select, insert, update, delete on public.archive_files to authenticated;

insert into storage.buckets (id, name, public, file_size_limit)
values ('memorybook-files', 'memorybook-files', false, 52428800)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'memorybook_storage_select_own') then
    create policy memorybook_storage_select_own on storage.objects for select to authenticated
      using (bucket_id = 'memorybook-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'memorybook_storage_insert_own') then
    create policy memorybook_storage_insert_own on storage.objects for insert to authenticated
      with check (bucket_id = 'memorybook-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'memorybook_storage_update_own') then
    create policy memorybook_storage_update_own on storage.objects for update to authenticated
      using (bucket_id = 'memorybook-files' and (storage.foldername(name))[1] = (select auth.uid())::text)
      with check (bucket_id = 'memorybook-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'memorybook_storage_delete_own') then
    create policy memorybook_storage_delete_own on storage.objects for delete to authenticated
      using (bucket_id = 'memorybook-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'archive_files'
  ) and not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime' and puballtables
  ) then
    alter publication supabase_realtime add table public.archive_files;
  end if;
end;
$$;
