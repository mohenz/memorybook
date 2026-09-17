import { afterEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), crawl: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ auth: { getUser: mocks.getUser } }) }));
vi.mock('../../../server/bookmarkMetadata', () => ({ crawlMetadata: mocks.crawl }));
import handler from '../../../api/bookmark-metadata';

async function call(method: string, headers: Record<string, string> = {}, body: unknown = { url: 'https://example.com' }) {
  let payload = '';
  const res = { statusCode: 200, setHeader: vi.fn(), end: (value: string) => { payload = value; } };
  await handler({ method, headers, body } as any, res as any);
  return { status: res.statusCode, body: JSON.parse(payload), headers: res.setHeader };
}

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe('bookmark metadata endpoint', () => {
  it('rejects anonymous requests before crawling', async () => {
    expect((await call('POST')).status).toBe(401);
    expect(mocks.crawl).not.toHaveBeenCalled();
  });
  it('accepts only POST', async () => {
    expect((await call('GET')).status).toBe(405);
    expect(mocks.crawl).not.toHaveBeenCalled();
  });
  it('rejects forged tokens after server-side validation', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'public');
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: new Error('invalid') });
    expect((await call('POST', { authorization: 'Bearer forged' })).status).toBe(401);
    expect(mocks.getUser).toHaveBeenCalledWith('forged');
    expect(mocks.crawl).not.toHaveBeenCalled();
  });
  it('returns metadata only after successful authentication', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'public');
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'owner' } }, error: null });
    mocks.crawl.mockResolvedValue({ title: 'Title' });
    expect(await call('POST', { authorization: 'Bearer valid' })).toMatchObject({ status: 200, body: { title: 'Title' } });
    expect(mocks.crawl).toHaveBeenCalledWith('https://example.com');
  });
  it('does not leak crawler errors to the client', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'public');
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'owner' } }, error: null });
    mocks.crawl.mockRejectedValue(new Error('internal network details'));
    const result = await call('POST', { authorization: 'Bearer valid' });
    expect(result.status).toBe(422);
    expect(result.body.error).not.toContain('internal');
  });
});
