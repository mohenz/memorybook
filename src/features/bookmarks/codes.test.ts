import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ calls: [] as any[], result: { data: null as any, error: null as any } }));

vi.mock('../../supabase/client', () => {
  const builder = (call: any): any => ({
    select: (columns: string) => { call.columns = columns; return builder(call); },
    insert: (values: any) => { call.method = 'insert'; call.values = values; return builder(call); },
    update: (values: any) => { call.method = 'update'; call.values = values; return builder(call); },
    eq: (column: string, value: unknown) => { call.filters.push([column, value]); return builder(call); },
    order: (column: string) => { call.orders.push(column); return builder(call); },
    single: () => Promise.resolve(state.result),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(state.result).then(resolve),
  });
  return {
    supabase: {
      from: (table: string) => {
        const call = { table, method: 'select', values: undefined, columns: '', filters: [] as any[], orders: [] as string[] };
        state.calls.push(call);
        return builder(call);
      },
    },
  };
});

const { createBookmarkCode, loadBookmarkCodes, loadBookmarks, normalizeBookmarkCodeDraft, normalizeBookmarkCodePatch, subscribeBookmarkCodes, updateBookmarkCode } = await import('./service');

beforeEach(() => {
  state.calls = [];
  state.result = { data: null, error: null };
});

describe('bookmark category code validation', () => {
  it('uppercases the code and keeps only database-safe identifiers', () => {
    expect(normalizeBookmarkCodeDraft({ code: ' travel_2 ', label: ' 여행 ', sort_order: 40.4, is_active: true }))
      .toEqual({ code: 'TRAVEL_2', label: '여행', sort_order: 40, is_active: true });
  });

  it('rejects codes that are empty, non-alphanumeric or do not start with a letter', () => {
    for (const code of ['', '  ', '여행', '2TECH', '_TECH', 'TE CH', 'A'.repeat(41)]) {
      expect(() => normalizeBookmarkCodeDraft({ code, label: '여행', sort_order: 10, is_active: true })).toThrow('코드는');
    }
  });

  it('rejects blank or overlong labels and out-of-range sort orders', () => {
    expect(() => normalizeBookmarkCodePatch({ label: '   ', sort_order: 10, is_active: true })).toThrow('표시 이름은');
    expect(() => normalizeBookmarkCodePatch({ label: '가'.repeat(81), sort_order: 10, is_active: true })).toThrow('표시 이름은');
    for (const sortOrder of [-1, 10000, Number.NaN]) {
      expect(() => normalizeBookmarkCodePatch({ label: '여행', sort_order: sortOrder, is_active: true })).toThrow('정렬 순서는');
    }
  });
});

describe('bookmark category code storage', () => {
  it('reads every code of the bookmark group in display order', async () => {
    state.result = { data: [{ code: 'TECH', label: 'Tech', sort_order: 10, is_active: false }], error: null };
    expect(await loadBookmarkCodes()).toEqual([{ code: 'TECH', label: 'Tech', sort_order: 10, is_active: false }]);
    expect(state.calls[0]).toMatchObject({ table: 'common_codes', filters: [['code_group', 'BOOKMARK_CATEGORY']], orders: ['sort_order', 'label'] });
  });

  it('treats rows without the is_active column as active', async () => {
    state.result = { data: [{ code: 'TECH', label: 'Tech' }], error: null };
    expect(await loadBookmarkCodes()).toEqual([{ code: 'TECH', label: 'Tech', sort_order: 0, is_active: true }]);
  });

  it('loads inactive codes with the bookmarks so saved bookmarks keep their label', async () => {
    state.result = { data: [{ code: 'TECH', label: 'Tech', sort_order: 10, is_active: false }], error: null };
    const result = await loadBookmarks('owner');
    expect(result.codes).toEqual([{ code: 'TECH', label: 'Tech', sort_order: 10, is_active: false }]);
    expect(state.calls[0].filters).toEqual([['code_group', 'BOOKMARK_CATEGORY']]);
  });

  it('inserts a new code into the bookmark group only', async () => {
    state.result = { data: { code: 'TRAVEL', label: '여행', sort_order: 40, is_active: true }, error: null };
    await createBookmarkCode({ code: 'travel', label: '여행', sort_order: 40, is_active: true });
    expect(state.calls[0]).toMatchObject({
      table: 'common_codes',
      method: 'insert',
      values: { code_group: 'BOOKMARK_CATEGORY', code: 'TRAVEL', label: '여행', sort_order: 40, is_active: true },
    });
  });

  it('explains a duplicate code instead of leaking the database error', async () => {
    state.result = { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } };
    await expect(createBookmarkCode({ code: 'TECH', label: 'Tech', sort_order: 10, is_active: true })).rejects.toThrow('이미 등록된 코드입니다. 다른 코드를 입력해 주세요.');
  });

  it('never rewrites the code value when editing, so bookmarks keep their category', async () => {
    state.result = { data: { code: 'TECH', label: '기술', sort_order: 5, is_active: false }, error: null };
    await updateBookmarkCode('TECH', { label: '기술', sort_order: 5, is_active: false });
    expect(state.calls[0].values).toEqual({ label: '기술', sort_order: 5, is_active: false });
    expect(state.calls[0].filters).toEqual([['code_group', 'BOOKMARK_CATEGORY'], ['code', 'TECH']]);
  });

  it('notifies the bookmark screen after a code changes and stops after unsubscribing', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeBookmarkCodes(listener);
    state.result = { data: { code: 'TECH', label: 'Tech', sort_order: 10, is_active: true }, error: null };
    await updateBookmarkCode('TECH', { label: 'Tech', sort_order: 10, is_active: true });
    await createBookmarkCode({ code: 'TRAVEL', label: '여행', sort_order: 40, is_active: true });
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    await updateBookmarkCode('TECH', { label: 'Tech', sort_order: 10, is_active: true });
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
