-- URL 링크 분류를 하드코딩 대신 공통코드 화면에서 추가/수정/비활성화한다.
alter table public.common_codes add column if not exists is_active boolean not null default true;
alter table public.common_codes drop constraint if exists common_codes_code_format;
alter table public.common_codes add constraint common_codes_code_format
  check (code_group <> 'BOOKMARK_CATEGORY' or code ~ '^[A-Z][A-Z0-9_]{0,39}$');
alter table public.common_codes drop constraint if exists common_codes_label_length;
alter table public.common_codes add constraint common_codes_label_length
  check (length(btrim(label)) between 1 and 80);
alter table public.common_codes drop constraint if exists common_codes_sort_order_range;
alter table public.common_codes add constraint common_codes_sort_order_range
  check (sort_order between 0 and 9999);

-- 북마크가 참조 중인 분류는 삭제하지 않고 비활성화만 허용하므로 delete 권한은 주지 않는다.
drop policy if exists common_codes_insert on public.common_codes;
create policy common_codes_insert on public.common_codes for insert to authenticated
  with check (code_group = 'BOOKMARK_CATEGORY');
drop policy if exists common_codes_update on public.common_codes;
create policy common_codes_update on public.common_codes for update to authenticated
  using (code_group = 'BOOKMARK_CATEGORY') with check (code_group = 'BOOKMARK_CATEGORY');

-- Supabase는 테이블 생성 시 anon/authenticated에 delete·truncate를 포함한 전체 권한을 기본
-- 부여한다. 이전 마이그레이션이 이를 회수하지 않아 authenticated가 code/code_group까지
-- 고칠 수 있었고(컬럼 제한 GRANT는 기존의 더 넓은 GRANT를 좁히지 못함), 두 역할 모두
-- truncate까지 가능한 상태였다. 전체 권한을 걷어낸 뒤 필요한 권한만 다시 부여한다.
revoke all on public.common_codes from anon;
revoke all on public.common_codes from authenticated;
grant select on public.common_codes to authenticated;
grant insert on public.common_codes to authenticated;
grant update (label, sort_order, is_active) on public.common_codes to authenticated;
