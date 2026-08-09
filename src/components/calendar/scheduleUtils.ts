import { Schedule, SchedulePriority, ScheduleWeekday } from '../../types';

export const HOUR_HEIGHT_PX = 56;
export const GRID_START_HOUR = 0;
export const GRID_END_HOUR = 24;
export const DEFAULT_SCROLL_HOUR = 7;
export const TIME_STEP_MINUTES = 30;
export const SCHEDULE_INPUT_STEP_MINUTES = 10;

export const WEEKDAY_OPTIONS: Array<{ value: ScheduleWeekday; label: string }> = [
  { value: 'MO', label: '월' },
  { value: 'TU', label: '화' },
  { value: 'WE', label: '수' },
  { value: 'TH', label: '목' },
  { value: 'FR', label: '금' },
  { value: 'SA', label: '토' },
  { value: 'SU', label: '일' },
];

const WEEKDAY_BY_INDEX: ScheduleWeekday[] = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

export const PRIORITY_ORDER: SchedulePriority[] = ['high', 'normal', 'low'];

export const PRIORITY_LABELS: Record<SchedulePriority, string> = {
  high: '높음',
  normal: '보통',
  low: '낮음',
};

// 기존 테마 토큰(index.css @theme, .dark)을 그대로 재사용 — 새 CSS 변수를 추가하지 않는다.
export const PRIORITY_COLORS: Record<SchedulePriority, { bg: string; border: string; text: string; dot: string }> = {
  high: {
    bg: 'bg-error/10',
    border: 'border-error',
    text: 'text-error',
    dot: 'bg-error',
  },
  normal: {
    bg: 'bg-primary/10',
    border: 'border-primary',
    text: 'text-primary',
    dot: 'bg-primary',
  },
  low: {
    bg: 'bg-outline-variant/20',
    border: 'border-outline',
    text: 'text-on-surface-variant',
    dot: 'bg-outline',
  },
};

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60, totalMinutes));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function snapToStep(time: string, stepMinutes = TIME_STEP_MINUTES): string {
  const minutes = timeToMinutes(time);
  const snapped = Math.min(
    Math.round(minutes / stepMinutes) * stepMinutes,
    24 * 60 - stepMinutes,
  );
  return minutesToTime(snapped);
}

export function scheduleTopPx(startTime: string): number {
  return (timeToMinutes(startTime) / 60) * HOUR_HEIGHT_PX;
}

export function scheduleHeightPx(startTime: string, endTime: string): number {
  const durationMinutes = Math.max(15, timeToMinutes(endTime) - timeToMinutes(startTime));
  return (durationMinutes / 60) * HOUR_HEIGHT_PX;
}

export function weekdayFromDateString(dateString: string): ScheduleWeekday {
  const [year, month, day] = dateString.split('-').map(Number);
  return WEEKDAY_BY_INDEX[new Date(year, month - 1, day).getDay()];
}

export function scheduleOccursOnDate(schedule: Schedule, dateString: string) {
  if (!schedule.recurrence) return schedule.dateString === dateString;
  if (dateString < schedule.dateString) return false;
  if (schedule.recurrence.untilDateString && dateString > schedule.recurrence.untilDateString) return false;
  return schedule.recurrence.weekdays.includes(weekdayFromDateString(dateString));
}

export function groupSchedulesByDate(
  schedules: Schedule[],
  searchQuery: string,
  visibleDateStrings?: string[],
) {
  const query = searchQuery.trim().toLocaleLowerCase('ko-KR');
  const schedulesByDate = new Map<string, Schedule[]>();
  const targetDates = visibleDateStrings ? [...new Set(visibleDateStrings)].sort() : null;

  schedules.forEach((schedule) => {
    if (query && !`${schedule.title} ${schedule.memo ?? ''}`.toLocaleLowerCase('ko-KR').includes(query)) return;

    const occurrenceDates = targetDates
      ? targetDates.filter((dateString) => scheduleOccursOnDate(schedule, dateString))
      : [schedule.dateString];

    occurrenceDates.forEach((dateString) => {
      const daySchedules = schedulesByDate.get(dateString) || [];
      daySchedules.push(schedule);
      schedulesByDate.set(dateString, daySchedules);
    });
  });

  schedulesByDate.forEach((daySchedules) => {
    daySchedules.sort((a, b) => {
      if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
      if (a.allDay) return 0;
      return timeToMinutes(a.startTime || '00:00') - timeToMinutes(b.startTime || '00:00');
    });
  });

  return schedulesByDate;
}

export function splitAllDaySchedules(schedules: Schedule[]) {
  return {
    allDay: schedules.filter((schedule) => schedule.allDay),
    timed: schedules.filter((schedule) => !schedule.allDay),
  };
}

export interface TimedScheduleLayout {
  schedule: Schedule;
  columnIndex: number;
  columnCount: number;
}

function scheduleInterval(schedule: Schedule) {
  const start = timeToMinutes(schedule.startTime || '00:00');
  const end = Math.max(start + 15, timeToMinutes(schedule.endTime || '01:00'));
  return { start, end };
}

export function layoutOverlappingSchedules(schedules: Schedule[]): TimedScheduleLayout[] {
  const sorted = [...schedules].sort((a, b) => {
    const intervalA = scheduleInterval(a);
    const intervalB = scheduleInterval(b);
    return intervalA.start - intervalB.start || intervalB.end - intervalA.end || a.id.localeCompare(b.id);
  });
  const layouts: TimedScheduleLayout[] = [];
  let cluster: Array<{ schedule: Schedule; columnIndex: number }> = [];
  let clusterEnd = -1;
  let columnEnds: number[] = [];

  const finishCluster = () => {
    const columnCount = Math.max(1, columnEnds.length);
    cluster.forEach(({ schedule, columnIndex }) => layouts.push({ schedule, columnIndex, columnCount }));
    cluster = [];
    columnEnds = [];
    clusterEnd = -1;
  };

  sorted.forEach((schedule) => {
    const { start, end } = scheduleInterval(schedule);
    if (cluster.length > 0 && start >= clusterEnd) finishCluster();

    let columnIndex = columnEnds.findIndex((columnEnd) => columnEnd <= start);
    if (columnIndex === -1) {
      columnIndex = columnEnds.length;
      columnEnds.push(end);
    } else {
      columnEnds[columnIndex] = end;
    }

    cluster.push({ schedule, columnIndex });
    clusterEnd = Math.max(clusterEnd, end);
  });

  if (cluster.length > 0) finishCluster();
  return layouts;
}
