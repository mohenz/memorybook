import { describe, expect, it } from 'vitest';
import { groupKoreanHolidays, mergeKasiHolidays } from './koreanHolidayUtils';

describe('Korean holiday normalization', () => {
  it('merges a national holiday and public holiday with the same date and name', () => {
    const holidays = mergeKasiHolidays(
      [{ locdate: 20260301, dateName: '삼일절', isHoliday: 'Y' }],
      [{ locdate: 20260301, dateName: '삼일절', isHoliday: 'Y' }],
    );

    expect(holidays).toEqual([
      {
        date: '2026-03-01',
        name: '삼일절',
        categories: ['public', 'national'],
        isDayOff: true,
      },
    ]);
  });

  it('keeps multiple holidays that share one date', () => {
    const holidays = mergeKasiHolidays(
      [
        { locdate: 20250505, dateName: '어린이날', isHoliday: 'Y' },
        { locdate: 20250505, dateName: '부처님 오신 날', isHoliday: 'Y' },
      ],
      [],
    );

    expect(groupKoreanHolidays(holidays).get('2025-05-05')).toHaveLength(2);
  });

  it('keeps a national day even when it is not a day off', () => {
    const holidays = mergeKasiHolidays(
      [],
      [{ locdate: 20250717, dateName: '제헌절', isHoliday: 'N' }],
    );

    expect(holidays[0]).toMatchObject({
      date: '2025-07-17',
      categories: ['national'],
      isDayOff: false,
    });
  });

  it('does not classify Labor Day as a national holiday', () => {
    const holidays = mergeKasiHolidays(
      [{ locdate: 20260501, dateName: '노동절', isHoliday: 'Y' }],
      [{ locdate: 20260501, dateName: '노동절', isHoliday: 'Y' }],
    );

    expect(holidays[0].categories).toEqual(['public']);
  });
});
