import { describe, expect, jest, test } from '@jest/globals';
import {
  getMonthCells,
  getWeekDates,
  groupCalendarNotes,
  shiftCalendarDate,
} from '../../src/components/calendar/calendarUtils';
import { resolveNoteTitle } from '../../src/utils/autoTitle';
import { Note } from '../../src/types';
import { koreanHolidays } from '../../src/features/holidays/koreanHolidays.generated';
import {
  groupKoreanHolidays,
  mergeKasiHolidays,
} from '../../src/features/holidays/koreanHolidayUtils';

const groups = [
  { id: 'project', name: '프로젝트' },
  { id: 'schedule', name: '일정' },
  { id: 'personal', name: '개인' },
];

const makeNote = (overrides: Partial<Note> = {}): Note => ({
  id: 'note-1',
  title: '프로젝트 회의',
  content: '진행 상황 확인',
  groupId: 'project',
  createdAt: '',
  updatedAt: '',
  dateString: '2026-07-23',
  isFavorite: false,
  isDeleted: false,
  images: [],
  checklist: [],
  ...overrides,
});

describe('calendar navigation', () => {
  test('keeps the day when moving to a month that contains it', () => {
    expect(shiftCalendarDate(new Date(2026, 6, 15), 'month', 1)).toEqual(new Date(2026, 7, 15));
  });

  test('clamps the day when moving to a shorter month', () => {
    expect(shiftCalendarDate(new Date(2026, 0, 31), 'month', 1)).toEqual(new Date(2026, 1, 28));
  });

  test('creates a Sunday-to-Saturday week', () => {
    const week = getWeekDates(new Date(2026, 6, 23));
    expect(week[0]).toEqual(new Date(2026, 6, 19));
    expect(week[6]).toEqual(new Date(2026, 6, 25));
  });

  test('creates a complete month grid including adjacent dates', () => {
    const cells = getMonthCells(new Date(2026, 6, 23));
    expect(cells).toHaveLength(35);
    expect(cells[0].dateString).toBe('2026-06-28');
    expect(cells[34].dateString).toBe('2026-08-01');
  });
});

describe('calendar filtering', () => {
  test('filters by title or content and excludes deleted notes', () => {
    const result = groupCalendarNotes([
      makeNote(),
      makeNote({ id: 'note-2', title: '개인 기록', content: '일상', dateString: '2026-07-24' }),
      makeNote({ id: 'note-3', isDeleted: true }),
    ], '진행 상황');

    expect(result.get('2026-07-23')?.map((note) => note.id)).toEqual(['note-1']);
    expect(result.has('2026-07-24')).toBe(false);
  });
});

describe('Korean holiday data', () => {
  test('merges public and national categories for a legal national holiday', () => {
    expect(mergeKasiHolidays(
      [{ locdate: 20260301, dateName: '삼일절', isHoliday: 'Y' }],
      [{ locdate: 20260301, dateName: '삼일절', isHoliday: 'Y' }],
    )).toEqual([{
      date: '2026-03-01',
      name: '삼일절',
      categories: ['public', 'national'],
      isDayOff: true,
    }]);
  });

  test('does not classify Labor Day as a national holiday', () => {
    const holidays = mergeKasiHolidays(
      [{ locdate: 20260501, dateName: '노동절', isHoliday: 'Y' }],
      [{ locdate: 20260501, dateName: '노동절', isHoliday: 'Y' }],
    );

    expect(holidays[0].categories).toEqual(['public']);
  });

  test('contains the synchronized 2018 through 2027 holiday snapshot', () => {
    const holidaysByDate = groupKoreanHolidays(koreanHolidays);

    expect(koreanHolidays).toHaveLength(200);
    expect(holidaysByDate.get('2026-07-17')).toEqual([
      expect.objectContaining({ name: '제헌절', categories: ['public', 'national'] }),
    ]);
  });
});

describe('note title resolution', () => {
  test('keeps a typed title for project and schedule groups', () => {
    expect(resolveNoteTitle({ groupId: 'project', groups, title: '변경한 프로젝트 제목' })).toBe('변경한 프로젝트 제목');
    expect(resolveNoteTitle({ groupId: 'schedule', groups, title: '변경한 일정 제목' })).toBe('변경한 일정 제목');
  });

  test('uses an automatic title only when the project title is empty', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 6, 23, 10));

    expect(resolveNoteTitle({ groupId: 'project', groups, title: '' })).toBe('2026-07-23_프로젝트_일정');

    jest.useRealTimers();
  });

  test('uses the fallback title for an empty personal note title', () => {
    expect(resolveNoteTitle({ groupId: 'personal', groups, title: '  ' })).toBe('제목 없는 메모');
  });
});
