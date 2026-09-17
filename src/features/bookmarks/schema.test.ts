import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = fs.readFileSync(
  path.resolve(process.cwd(), 'supabase/migrations/202609170002_bookmark_code_management.sql'),
  'utf8',
).toLowerCase();

describe('bookmark category code management migration', () => {
  it('adds the deactivation flag without dropping existing codes', () => {
    expect(sql).toContain('add column if not exists is_active boolean not null default true');
    expect(sql).not.toContain('drop table');
    expect(sql).not.toContain('delete from');
  });

  it('constrains codes, labels and sort order in the database, not only in the client', () => {
    expect(sql).toContain("check (code_group <> 'bookmark_category' or code ~ '^[a-z][a-z0-9_]{0,39}$')");
    expect(sql).toContain('check (length(btrim(label)) between 1 and 80)');
    expect(sql).toContain('check (sort_order between 0 and 9999)');
  });

  it('limits writes to the bookmark category group', () => {
    expect(sql).toContain("with check (code_group = 'bookmark_category')");
    expect(sql).toContain("using (code_group = 'bookmark_category')");
  });

  it('grants updates only on the editable columns so a code can never be renamed or moved', () => {
    expect(sql).toContain('grant update (label, sort_order, is_active) on public.common_codes to authenticated');
    expect(sql).not.toContain('grant update on public.common_codes');
  });

  it('never grants delete, because bookmarks reference the codes', () => {
    expect(sql).not.toContain('delete on public.common_codes');
    expect(sql).not.toContain('for delete');
  });

  it('revokes the broad default privileges before re-granting only what the feature needs', () => {
    // Supabase grants anon/authenticated full table privileges (including delete and truncate)
    // by default; a narrower GRANT UPDATE cannot shrink an already-broader grant, so the
    // defaults must be revoked first or authenticated could still rewrite code/code_group.
    expect(sql).toContain('revoke all on public.common_codes from anon');
    expect(sql).toContain('revoke all on public.common_codes from authenticated');
    expect(sql).toContain('grant select on public.common_codes to authenticated');
    expect(sql).toContain('grant insert on public.common_codes to authenticated');
  });
});
