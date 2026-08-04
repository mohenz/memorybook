import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = fs.readFileSync(
  path.resolve(process.cwd(), 'supabase/migrations/202608050001_initial_memorybook.sql'),
  'utf8',
).toLowerCase();

describe('memorybook Supabase migration', () => {
  it('creates the memo state and archive metadata tables', () => {
    expect(sql).toContain('create table if not exists public.memo_states');
    expect(sql).toContain('create table if not exists public.archive_files');
  });

  it('enables RLS on both application tables', () => {
    expect(sql).toContain('alter table public.memo_states enable row level security');
    expect(sql).toContain('alter table public.archive_files enable row level security');
  });

  it('uses cached auth.uid checks for tenant isolation', () => {
    expect(sql).toContain('(select auth.uid()) = user_id');
    expect(sql).toContain('(storage.foldername(name))[1] = (select auth.uid())::text');
  });

  it('creates a private storage bucket', () => {
    expect(sql).toContain("values ('memorybook-files', 'memorybook-files', false, 52428800)");
  });

  it('does not grant anonymous table access', () => {
    expect(sql).toContain('revoke all on public.memo_states, public.archive_files from anon');
    expect(sql).not.toContain('grant all');
  });
});
