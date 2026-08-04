import { Note } from '../../types';
import { toLocalDateString } from '../../utils/date';

export type CalendarViewMode = 'month' | 'week' | 'day';

export interface CalendarDayCell {
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
}

export const clampDayToMonth = (day: number, year: number, monthIndex: number) =>
  Math.min(day, new Date(year, monthIndex + 1, 0).getDate());

export const addDays = (date: Date, amount: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);

export const startOfWeek = (date: Date) => addDays(date, -date.getDay());

export const isSameLocalDate = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear()
  && left.getMonth() === right.getMonth()
  && left.getDate() === right.getDate();

export function shiftCalendarDate(date: Date, mode: CalendarViewMode, offset: number) {
  if (mode === 'day') return addDays(date, offset);
  if (mode === 'week') return addDays(date, offset * 7);

  const targetMonth = new Date(date.getFullYear(), date.getMonth() + offset, 1);
  return new Date(
    targetMonth.getFullYear(),
    targetMonth.getMonth(),
    clampDayToMonth(date.getDate(), targetMonth.getFullYear(), targetMonth.getMonth()),
  );
}

export function getMonthCells(selectedDate: Date): CalendarDayCell[] {
  const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const gridStart = startOfWeek(monthStart);
  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
  const cellCount = Math.ceil((monthStart.getDay() + daysInMonth) / 7) * 7;

  return Array.from({ length: cellCount }, (_, index) => {
    const date = addDays(gridStart, index);
    return {
      date,
      dateString: toLocalDateString(date),
      isCurrentMonth: date.getMonth() === selectedDate.getMonth(),
    };
  });
}

export const getWeekDates = (selectedDate: Date) => {
  const weekStart = startOfWeek(selectedDate);
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
};

export function formatCalendarPeriod(date: Date, mode: CalendarViewMode) {
  if (mode === 'month') return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;

  if (mode === 'day') {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }).format(date);
  }

  const weekDates = getWeekDates(date);
  const start = weekDates[0];
  const end = weekDates[6];
  const endLabel = start.getFullYear() === end.getFullYear()
    ? `${end.getMonth() + 1}월 ${end.getDate()}일`
    : `${end.getFullYear()}년 ${end.getMonth() + 1}월 ${end.getDate()}일`;

  return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 – ${endLabel}`;
}

export function groupCalendarNotes(notes: Note[], searchQuery: string) {
  const query = searchQuery.trim().toLocaleLowerCase('ko-KR');
  const notesByDate = new Map<string, Note[]>();

  notes.forEach((note) => {
    if (note.isDeleted) return;
    if (query && !`${note.title} ${note.content}`.toLocaleLowerCase('ko-KR').includes(query)) return;

    const dayNotes = notesByDate.get(note.dateString) || [];
    dayNotes.push(note);
    notesByDate.set(note.dateString, dayNotes);
  });

  return notesByDate;
}
