import { beforeEach, describe, expect, it, vi } from 'vitest';

const { channelNames, supabase } = vi.hoisted(() => {
  const names: string[] = [];
  return {
    channelNames: names,
    supabase: {
      channel: vi.fn((name: string) => {
        names.push(name);
        return {
          on() { return this; },
          subscribe() { return this; },
        };
      }),
      from: vi.fn(() => ({
        select() { return this; },
        eq() { return this; },
        order: async () => ({ data: [], error: null }),
      })),
      removeChannel: vi.fn(),
    },
  };
});

vi.mock('../../../supabase/client.ts', () => ({
  isSupabaseConfigured: true,
  supabase,
}));

import { subscribeFiles } from './archiveService.js';

describe('archive realtime subscription', () => {
  beforeEach(() => {
    channelNames.length = 0;
    vi.clearAllMocks();
  });

  it('uses a unique channel for each mounted archive screen', () => {
    const stopFirst = subscribeFiles('user-1', vi.fn(), vi.fn());
    const stopSecond = subscribeFiles('user-1', vi.fn(), vi.fn());

    expect(channelNames).toHaveLength(2);
    expect(channelNames[0]).not.toBe(channelNames[1]);

    stopFirst();
    stopSecond();
  });
});
