import { describe, expect, it } from 'vitest';
import { Note } from '../../types';
import {
  formatCalendarPeriod,
  getMonthCells,
  getWeekDates,
  groupCalendarNotes,
  shiftCalendarDate,
} from './calendarUtils';

const makeNote = (overrides: Partial<Note> = {}): Note => ({
  id: 'note-1',
  title: '주간 회의',
  content: '프로젝트 진행 상황',
  groupId: 'work',
  createdAt: '',
  updatedAt: '',
  dateString: '2026-07-23',
  isFavorite: false,
  isDeleted: false,
  images: [],
  checklist: [],
  ...overrides,
});

describe('calendar date navigation', () => {
  it('moves a month while preserving the selected day', () => {
    expect(shiftCalendarDate(new Date(2026, 6, 15), 'month', 1)).toEqual(new Date(2026, 7, 15));
  });

  it('clamps the selected day when moving to a shorter month', () => {
    expect(shiftCalendarDate(new Date(2026, 0, 31), 'month', 1)).toEqual(new Date(2026, 1, 28));
  });

  it('moves weekly and daily views across a year boundary', () => {
    expect(shiftCalendarDate(new Date(2026, 11, 29), 'week', 1)).toEqual(new Date(2027, 0, 5));
    expect(shiftCalendarDate(new Date(2026, 11, 31), 'day', 1)).toEqual(new Date(2027, 0, 1));
  });

  it('builds a Sunday-to-Saturday week', () => {
    const week = getWeekDates(new Date(2026, 6, 23));
    expect(week[0]).toEqual(new Date(2026, 6, 19));
    expect(week[6]).toEqual(new Date(2026, 6, 25));
  });

  it('includes adjacent-month dates in a complete month grid', () => {
    const cells = getMonthCells(new Date(2026, 6, 23));
    expect(cells).toHaveLength(35);
    expect(cells[0].dateString).toBe('2026-06-28');
    expect(cells[34].dateString).toBe('2026-08-01');
  });
});

describe('calendar presentation data', () => {
  it('formats month, week, and day period labels', () => {
    const date = new Date(2026, 6, 23);
    expect(formatCalendarPeriod(date, 'month')).toBe('2026년 7월');
    expect(formatCalendarPeriod(date, 'week')).toBe('2026년 7월 19일 – 7월 25일');
    expect(formatCalendarPeriod(date, 'day')).toContain('2026년 7월 23일');
  });

  it('groups matching notes and excludes deleted or unmatched notes', () => {
    const grouped = groupCalendarNotes([
      makeNote(),
      makeNote({ id: 'note-2', title: '개인 기록', content: '일상', dateString: '2026-07-24' }),
      makeNote({ id: 'note-3', isDeleted: true }),
    ], '프로젝트');

    expect(grouped.get('2026-07-23')?.map((note) => note.id)).toEqual(['note-1']);
    expect(grouped.has('2026-07-24')).toBe(false);
  });
});
