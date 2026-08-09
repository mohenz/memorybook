import { describe, expect, it } from 'vitest';
import { Schedule } from '../../types';
import {
  groupSchedulesByDate,
  layoutOverlappingSchedules,
  minutesToTime,
  scheduleHeightPx,
  scheduleOccursOnDate,
  scheduleTopPx,
  snapToStep,
  splitAllDaySchedules,
  timeToMinutes,
  weekdayFromDateString,
} from './scheduleUtils';

const makeSchedule = (overrides: Partial<Schedule> = {}): Schedule => ({
  id: 'schedule-1',
  title: '팀 회의',
  dateString: '2026-07-23',
  allDay: false,
  startTime: '09:00',
  endTime: '10:00',
  priority: 'normal',
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

describe('time math', () => {
  it('converts HH:mm to minutes and back', () => {
    expect(timeToMinutes('09:30')).toBe(570);
    expect(timeToMinutes('00:00')).toBe(0);
    expect(minutesToTime(570)).toBe('09:30');
    expect(minutesToTime(0)).toBe('00:00');
  });

  it('clamps minutesToTime to a single day', () => {
    expect(minutesToTime(-30)).toBe('00:00');
    expect(minutesToTime(24 * 60 + 30)).toBe('24:00');
  });

  it('computes grid top offset proportional to hour height', () => {
    expect(scheduleTopPx('01:00')).toBe(56);
    expect(scheduleTopPx('00:30')).toBe(28);
  });

  it('computes grid height for a duration, with a 15-minute floor', () => {
    expect(scheduleHeightPx('09:00', '10:00')).toBe(56);
    expect(scheduleHeightPx('09:00', '09:05')).toBeCloseTo((15 / 60) * 56);
  });

  it('snaps a time to the nearest 30-minute step', () => {
    expect(snapToStep('09:00')).toBe('09:00');
    expect(snapToStep('09:14')).toBe('09:00');
    expect(snapToStep('09:15')).toBe('09:30');
    expect(snapToStep('09:44')).toBe('09:30');
    expect(snapToStep('09:45')).toBe('10:00');
  });

  it('supports the 10-minute step used by schedule time inputs', () => {
    expect(snapToStep('09:04', 10)).toBe('09:00');
    expect(snapToStep('09:05', 10)).toBe('09:10');
    expect(snapToStep('09:14', 10)).toBe('09:10');
    expect(snapToStep('09:15', 10)).toBe('09:20');
    expect(snapToStep('23:59', 10)).toBe('23:50');
  });
});

describe('groupSchedulesByDate', () => {
  it('groups by date, filters by search query, and excludes non-matches', () => {
    const grouped = groupSchedulesByDate([
      makeSchedule(),
      makeSchedule({ id: 'schedule-2', title: '병원 예약', dateString: '2026-07-24' }),
    ], '회의');

    expect(grouped.get('2026-07-23')?.map((s) => s.id)).toEqual(['schedule-1']);
    expect(grouped.has('2026-07-24')).toBe(false);
  });

  it('sorts all-day schedules before timed schedules, timed by start time', () => {
    const grouped = groupSchedulesByDate([
      makeSchedule({ id: 'late', startTime: '18:00', endTime: '19:00' }),
      makeSchedule({ id: 'all-day', allDay: true, startTime: undefined, endTime: undefined }),
      makeSchedule({ id: 'early', startTime: '08:00', endTime: '09:00' }),
    ], '');

    expect(grouped.get('2026-07-23')?.map((s) => s.id)).toEqual(['all-day', 'early', 'late']);
  });

  it('expands a weekly schedule only on selected weekdays within its date range', () => {
    const recurring = makeSchedule({
      dateString: '2026-07-21',
      recurrence: {
        frequency: 'weekly',
        weekdays: ['TU', 'TH'],
        untilDateString: '2026-07-30',
      },
    });
    const grouped = groupSchedulesByDate([recurring], '', [
      '2026-07-16',
      '2026-07-20',
      '2026-07-21',
      '2026-07-23',
      '2026-07-28',
      '2026-07-30',
      '2026-08-04',
    ]);

    expect([...grouped.keys()]).toEqual([
      '2026-07-21',
      '2026-07-23',
      '2026-07-28',
      '2026-07-30',
    ]);
  });

  it('keeps a one-time schedule on its exact date when a visible range is supplied', () => {
    const grouped = groupSchedulesByDate([makeSchedule()], '', ['2026-07-22', '2026-07-23', '2026-07-24']);

    expect([...grouped.keys()]).toEqual(['2026-07-23']);
  });
});

describe('weekly recurrence', () => {
  it('uses local calendar weekdays and observes the start date', () => {
    const recurring = makeSchedule({
      dateString: '2026-07-21',
      recurrence: { frequency: 'weekly', weekdays: ['TU', 'TH'] },
    });

    expect(weekdayFromDateString('2026-07-21')).toBe('TU');
    expect(weekdayFromDateString('2026-07-23')).toBe('TH');
    expect(scheduleOccursOnDate(recurring, '2026-07-16')).toBe(false);
    expect(scheduleOccursOnDate(recurring, '2026-07-21')).toBe(true);
    expect(scheduleOccursOnDate(recurring, '2026-07-22')).toBe(false);
    expect(scheduleOccursOnDate(recurring, '2026-07-23')).toBe(true);
  });
});

describe('splitAllDaySchedules', () => {
  it('separates all-day (고정) schedules from timed ones', () => {
    const allDay = makeSchedule({ id: 'a', allDay: true, startTime: undefined, endTime: undefined });
    const timed = makeSchedule({ id: 'b' });

    expect(splitAllDaySchedules([allDay, timed])).toEqual({
      allDay: [allDay],
      timed: [timed],
    });
  });
});

describe('layoutOverlappingSchedules', () => {
  it('splits schedules that overlap into separate columns', () => {
    const layouts = layoutOverlappingSchedules([
      makeSchedule({ id: 'a', startTime: '10:00', endTime: '11:00' }),
      makeSchedule({ id: 'b', startTime: '10:00', endTime: '11:00' }),
      makeSchedule({ id: 'c', startTime: '10:30', endTime: '12:00' }),
    ]);

    expect(layouts.map(({ schedule, columnIndex, columnCount }) => ({
      id: schedule.id,
      columnIndex,
      columnCount,
    }))).toEqual([
      { id: 'a', columnIndex: 0, columnCount: 3 },
      { id: 'b', columnIndex: 1, columnCount: 3 },
      { id: 'c', columnIndex: 2, columnCount: 3 },
    ]);
  });

  it('keeps back-to-back schedules at full width', () => {
    const layouts = layoutOverlappingSchedules([
      makeSchedule({ id: 'a', startTime: '10:00', endTime: '11:00' }),
      makeSchedule({ id: 'b', startTime: '11:00', endTime: '12:00' }),
    ]);

    expect(layouts.map(({ columnIndex, columnCount }) => ({ columnIndex, columnCount }))).toEqual([
      { columnIndex: 0, columnCount: 1 },
      { columnIndex: 0, columnCount: 1 },
    ]);
  });

  it('uses the maximum simultaneous overlap for a connected time range', () => {
    const layouts = layoutOverlappingSchedules([
      makeSchedule({ id: 'a', startTime: '09:00', endTime: '10:00' }),
      makeSchedule({ id: 'b', startTime: '09:30', endTime: '10:30' }),
      makeSchedule({ id: 'c', startTime: '10:00', endTime: '11:00' }),
    ]);

    expect(layouts.map(({ schedule, columnIndex, columnCount }) => ({
      id: schedule.id,
      columnIndex,
      columnCount,
    }))).toEqual([
      { id: 'a', columnIndex: 0, columnCount: 2 },
      { id: 'b', columnIndex: 1, columnCount: 2 },
      { id: 'c', columnIndex: 0, columnCount: 2 },
    ]);
  });
});
