import { describe, expect, it } from 'vitest';
import { toLocalDateString } from './date';

describe('toLocalDateString', () => {
  it('uses the local calendar date even when UTC is still on the previous day', () => {
    const koreaMidnight = new Date('2026-07-16T00:30:00+09:00');

    expect(toLocalDateString(koreaMidnight)).toBe('2026-07-16');
    expect(koreaMidnight.toISOString().split('T')[0]).toBe('2026-07-15');
  });

  it('pads single-digit months and days', () => {
    expect(toLocalDateString(new Date(2026, 0, 5, 12))).toBe('2026-01-05');
  });
});
