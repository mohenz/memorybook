-- Shared code catalog; bookmark rows belong to the signed-in account.
create table if not exists public.common_codes (
  code_group text not null,
  code text not null,
  label text not null,
  sort_order integer not null default 0,
  primary key (code_group, code)
);

insert into public.common_codes (code_group, code, label, sort_order) values
  ('BOOKMARK_CATEGORY', 'TECH', 'Tech', 10),
  ('BOOKMARK_CATEGORY', 'HEALTH', 'Health', 20),
  ('BOOKMARK_CATEGORY', 'IDEA', 'Idea', 30)
on conflict (code_group, code) do nothing;

alter table public.common_codes enable row level security;
drop policy if exists common_codes_read on public.common_codes;
create policy common_codes_read on public.common_codes for select to authenticated using (true);
grant select on public.common_codes to authenticated;

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  category_group text not null default 'BOOKMARK_CATEGORY' check (category_group = 'BOOKMARK_CATEGORY'),
  category_code text not null,
  url text not null check (url ~ '^https?://' and length(url) <= 4096),
  title text not null default '무제' check (length(title) between 1 and 500),
  site_info jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (category_group, category_code) references public.common_codes(code_group, code)
);
create index if not exists bookmarks_user_created_idx on public.bookmarks(user_id, created_at desc);
alter table public.bookmarks enable row level security;
drop policy if exists bookmarks_owner on public.bookmarks;
create policy bookmarks_owner on public.bookmarks for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.bookmarks to authenticated;

create or replace function public.set_bookmark_timestamps() returns trigger
language plpgsql set search_path = public as $$
begin
  if TG_OP = 'UPDATE' then
    new.created_at := old.created_at;
  else
    new.created_at := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists bookmark_timestamps on public.bookmarks;
create trigger bookmark_timestamps before insert or update on public.bookmarks
for each row execute function public.set_bookmark_timestamps();
