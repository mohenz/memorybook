import { describe, expect, it } from 'vitest';
import { Schedule } from '../types';
import { getPopupData } from './scheduleFilter';

const schedules: Schedule[] = [
  {
    id: 'normal', title: '일반 일정', dateString: '2026-08-03', allDay: false,
    startTime: '10:00', endTime: '11:00', priority: 'normal', createdAt: '', updatedAt: '',
  },
  {
    id: 'weekly', title: '주간 일정', dateString: '2026-07-27', allDay: false,
    startTime: '09:00', endTime: '10:00', priority: 'high', createdAt: '', updatedAt: '',
    recurrence: { frequency: 'weekly', weekdays: ['MO', 'WE'] },
  },
];

describe('getPopupData', () => {
  it('expands recurring schedules across today, tomorrow, and the day after', () => {
    const data = getPopupData(schedules, new Date(2026, 7, 3, 12));
    expect(data.dates).toEqual(['2026-08-03', '2026-08-04', '2026-08-05']);
    expect(data.today.map((schedule) => schedule.id)).toEqual(['weekly', 'normal']);
    expect(data.tomorrow).toHaveLength(0);
    expect(data.dayAfter.map((schedule) => schedule.id)).toEqual(['weekly']);
    expect(data.reminders.map((schedule) => schedule.occurrenceDateString)).toEqual(['2026-08-03', '2026-08-05']);
  });
});
