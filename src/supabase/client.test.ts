import { beforeEach, describe, expect, it, vi } from 'vitest';

const createClient = vi.fn(() => ({ kind: 'supabase-client' }));

vi.mock('@supabase/supabase-js', () => ({ createClient }));

async function loadClient(url = '', key = '') {
  vi.stubEnv('VITE_SUPABASE_URL', url);
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', key);
  return import('./client');
}

describe('Supabase client configuration', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    createClient.mockClear();
  });

  it('disables the client when both variables are missing', async () => {
    const module = await loadClient();
    expect(module.isSupabaseConfigured).toBe(false);
    expect(module.supabase).toBeNull();
  });

  it('disables the client when the publishable key is missing', async () => {
    const module = await loadClient('https://example.supabase.co');
    expect(module.isSupabaseConfigured).toBe(false);
  });

  it('disables the client when the project URL is missing', async () => {
    const module = await loadClient('', 'publishable-key');
    expect(module.isSupabaseConfigured).toBe(false);
  });

  it('trims environment variable values', async () => {
    await loadClient(' https://example.supabase.co ', ' publishable-key ');
    expect(createClient).toHaveBeenCalledWith('https://example.supabase.co', 'publishable-key');
  });

  it('creates one client when both variables are valid', async () => {
    const module = await loadClient('https://example.supabase.co', 'publishable-key');
    expect(module.isSupabaseConfigured).toBe(true);
    expect(module.supabase).toEqual({ kind: 'supabase-client' });
    expect(createClient).toHaveBeenCalledTimes(1);
  });
});
