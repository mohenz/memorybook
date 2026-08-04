import { describe, expect, it } from 'vitest';
import { Schedule } from '../types';
import { calcNextReminderTime } from './notificationService';

function schedule(reminder: Schedule['reminder']): Schedule {
  return {
    id: 'schedule', title: '테스트', dateString: '2026-08-03', allDay: false,
    startTime: '10:00', endTime: '11:00', priority: 'normal', reminder,
    createdAt: '', updatedAt: '',
  };
}

describe('calcNextReminderTime', () => {
  it('calculates a one-time reminder before the event', () => {
    const fireAt = calcNextReminderTime(
      schedule({ enabled: true, minutesBefore: 30, frequency: 'once' }),
      new Date(2026, 7, 3, 9),
    );
    expect(fireAt).toEqual(new Date(2026, 7, 3, 9, 30));
  });

  it('moves a daily reminder to the next day after today fire time has passed', () => {
    const fireAt = calcNextReminderTime(
      schedule({ enabled: true, minutesBefore: 10, frequency: 'daily' }),
      new Date(2026, 7, 3, 9, 55),
    );
    expect(fireAt).toEqual(new Date(2026, 7, 4, 9, 50));
  });
});
