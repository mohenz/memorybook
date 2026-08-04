import { NotificationSettings, Schedule, ScheduleWeekday } from '../types';
import { scheduleOccursOnDate } from '../components/calendar/scheduleUtils';
import { addLocalDays } from '../utils/scheduleFilter';
import { toLocalDateString } from '../utils/date';

const WEEKDAY_BY_INDEX: ScheduleWeekday[] = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function atLocalTime(dateString: string, time: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function reminderWeekdays(schedule: Schedule) {
  if (schedule.recurrence?.weekdays.length) return schedule.recurrence.weekdays;
  return [WEEKDAY_BY_INDEX[atLocalTime(schedule.dateString, '12:00').getDay()]];
}

export function calcNextReminderTime(schedule: Schedule, now: Date): Date | null {
  const reminder = schedule.reminder;
  if (!reminder?.enabled) return null;
  const eventTime = schedule.startTime || '09:00';
  const offsetMs = reminder.minutesBefore * 60_000;

  if (reminder.frequency === 'once') {
    const fireAt = new Date(atLocalTime(schedule.dateString, eventTime).getTime() - offsetMs);
    return fireAt.getTime() > now.getTime() ? fireAt : null;
  }

  const allowedWeekdays = reminder.frequency === 'weekly' ? reminderWeekdays(schedule) : null;
  for (let offset = 0; offset <= 14; offset += 1) {
    const eventDate = addLocalDays(now, offset);
    const dateString = toLocalDateString(eventDate);
    if (dateString < schedule.dateString) continue;
    if (schedule.recurrence?.untilDateString && dateString > schedule.recurrence.untilDateString) continue;
    if (allowedWeekdays && !allowedWeekdays.includes(WEEKDAY_BY_INDEX[eventDate.getDay()])) continue;
    const fireAt = new Date(atLocalTime(dateString, eventTime).getTime() - offsetMs);
    if (fireAt.getTime() > now.getTime()) return fireAt;
  }
  return null;
}

function nextDailyTime(time: string, now: Date) {
  const candidate = atLocalTime(toLocalDateString(now), time);
  return candidate.getTime() > now.getTime() ? candidate : atLocalTime(toLocalDateString(addLocalDays(now, 1)), time);
}

function nextWeeklyTime(dayOfWeek: number, time: string, now: Date) {
  for (let offset = 0; offset <= 7; offset += 1) {
    const date = addLocalDays(now, offset);
    if (date.getDay() !== dayOfWeek) continue;
    const candidate = atLocalTime(toLocalDateString(date), time);
    if (candidate.getTime() > now.getTime()) return candidate;
  }
  return atLocalTime(toLocalDateString(addLocalDays(now, 7)), time);
}

function canNotify() {
  return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
}

export class NotificationService {
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  isSupported() {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    return (await Notification.requestPermission()) === 'granted';
  }

  scheduleAll(schedules: Schedule[], settings: NotificationSettings, now = new Date()) {
    this.clearAll();
    if (!settings.browserPermission || !canNotify()) return;
    schedules.filter((schedule) => schedule.reminder?.enabled).forEach((schedule) => this.scheduleOne(schedule, now));
    if (settings.dailyDigest.enabled) this.scheduleDailyDigest(schedules, settings.dailyDigest.time, now);
    if (settings.weeklyDigest.enabled) this.scheduleWeeklyDigest(schedules, settings.weeklyDigest.dayOfWeek, settings.weeklyDigest.time, now);
  }

  private setTimer(key: string, fireAt: Date, callback: () => void) {
    const delay = fireAt.getTime() - Date.now();
    if (delay <= 0 || delay > 2_147_483_647) return;
    const timer = setTimeout(callback, delay);
    this.timers.set(key, timer);
  }

  private scheduleOne(schedule: Schedule, now: Date) {
    const fireAt = calcNextReminderTime(schedule, now);
    if (!fireAt) return;
    this.setTimer(`schedule:${schedule.id}`, fireAt, () => {
      if (canNotify()) {
        new Notification(`⏰ ${schedule.title}`, {
          body: schedule.allDay ? '오늘 종일 일정이 있습니다.' : `${schedule.startTime || ''} 일정이 있습니다.`,
          icon: '/icon.svg',
          tag: `schedule-${schedule.id}`,
        });
      }
      this.timers.delete(`schedule:${schedule.id}`);
      if (schedule.reminder?.frequency !== 'once') this.scheduleOne(schedule, new Date());
    });
  }

  private scheduleDailyDigest(schedules: Schedule[], time: string, now: Date) {
    const fireAt = nextDailyTime(time, now);
    this.setTimer('digest:daily', fireAt, () => {
      const today = toLocalDateString();
      const count = schedules.filter((schedule) => scheduleOccursOnDate(schedule, today)).length;
      if (canNotify()) new Notification('MEMOry 오늘의 일정', { body: count ? `오늘 일정이 ${count}개 있습니다.` : '오늘 예정된 일정이 없습니다.', icon: '/icon.svg', tag: 'memory-daily-digest' });
      this.timers.delete('digest:daily');
      this.scheduleDailyDigest(schedules, time, new Date());
    });
  }

  private scheduleWeeklyDigest(schedules: Schedule[], dayOfWeek: number, time: string, now: Date) {
    const fireAt = nextWeeklyTime(dayOfWeek, time, now);
    this.setTimer('digest:weekly', fireAt, () => {
      const start = new Date();
      const count = Array.from({ length: 7 }, (_, offset) => toLocalDateString(addLocalDays(start, offset)))
        .reduce((total, dateString) => total + schedules.filter((schedule) => scheduleOccursOnDate(schedule, dateString)).length, 0);
      if (canNotify()) new Notification('MEMOry 이번 주 일정', { body: `앞으로 7일간 일정이 ${count}개 있습니다.`, icon: '/icon.svg', tag: 'memory-weekly-digest' });
      this.timers.delete('digest:weekly');
      this.scheduleWeeklyDigest(schedules, dayOfWeek, time, new Date());
    });
  }

  clearAll() {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
  }
}

export const notificationService = new NotificationService();
