import { Schedule, SchedulePriority } from '../types';
import { scheduleOccursOnDate } from '../components/calendar/scheduleUtils';
import { toLocalDateString } from './date';

export interface PopupScheduleOccurrence extends Schedule {
  occurrenceDateString: string;
}

export interface PopupScheduleData {
  reminders: PopupScheduleOccurrence[];
  today: PopupScheduleOccurrence[];
  tomorrow: PopupScheduleOccurrence[];
  dayAfter: PopupScheduleOccurrence[];
  dates: [string, string, string];
}

const PRIORITY_RANK: Record<SchedulePriority, number> = {
  high: 0,
  normal: 1,
  low: 2,
};

export function addLocalDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function sortOccurrences(items: PopupScheduleOccurrence[]) {
  return [...items].sort((a, b) => {
    const priorityDifference = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (priorityDifference) return priorityDifference;
    if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
    const timeDifference = (a.startTime || '').localeCompare(b.startTime || '');
    return timeDifference || a.title.localeCompare(b.title, 'ko-KR');
  });
}

export function getPopupData(schedules: Schedule[], today: Date): PopupScheduleData {
  const dates = [0, 1, 2].map((offset) => toLocalDateString(addLocalDays(today, offset))) as [string, string, string];
  const byDate = dates.map((dateString) => sortOccurrences(
    schedules
      .filter((schedule) => scheduleOccursOnDate(schedule, dateString))
      .map((schedule) => ({ ...schedule, occurrenceDateString: dateString })),
  ));

  return {
    reminders: sortOccurrences(byDate.flat().filter((schedule) => Boolean(schedule.recurrence))),
    today: byDate[0],
    tomorrow: byDate[1],
    dayAfter: byDate[2],
    dates,
  };
}
