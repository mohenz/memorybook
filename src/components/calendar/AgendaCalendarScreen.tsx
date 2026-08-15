import { useEffect, useRef } from 'react';
import { CalendarDays, CheckSquare2 } from 'lucide-react';
import { Schedule, TodoItem } from '../../types';
import { toLocalDateString } from '../../utils/date';
import { TODO_STATUS_LABELS } from '../../utils/todoStatus';
import { PRIORITY_COLORS } from './scheduleUtils';

interface AgendaCalendarScreenProps {
  selectedDate: Date;
  schedulesByDate: Map<string, Schedule[]>;
  todos: TodoItem[];
  searchQuery: string;
  onSelectSchedule: (schedule: Schedule) => void;
}

const NEUTRAL_BADGE_CLASS = 'bg-surface-container-high text-on-surface-variant';

function monthDateStrings(selectedDate: Date) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const dayCount = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: dayCount }, (_, index) => toLocalDateString(new Date(year, month, index + 1)));
}

function formatDateHeading(dateString: string) {
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
    .format(new Date(`${dateString}T12:00:00`));
}

export default function AgendaCalendarScreen({ selectedDate, schedulesByDate, todos, searchQuery, onSelectSchedule }: AgendaCalendarScreenProps) {
  const query = searchQuery.trim().toLocaleLowerCase('ko-KR');
  const filteredTodos = todos.filter(todo => !query || todo.text.toLocaleLowerCase('ko-KR').includes(query));
  const days = monthDateStrings(selectedDate).map(dateString => ({
    dateString,
    schedules: schedulesByDate.get(dateString) || [],
    todos: filteredTodos.filter(todo => todo.createdDateString === dateString || todo.targetDateString === dateString),
  })).filter(day => day.schedules.length || day.todos.length);

  const scrollRef = useRef<HTMLDivElement>(null);
  const todayString = toLocalDateString(new Date());
  // Land on today, or the next day that actually has entries. Past months resolve to
  // nothing and stay at the top, which is where their content begins anyway.
  const focusDateString = days.find(day => day.dateString >= todayString)?.dateString;
  const monthKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}`;

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !focusDateString) return;
    const target = container.querySelector<HTMLElement>(`[data-agenda-date="${focusDateString}"]`);
    if (!target) return;
    const offset = target.getBoundingClientRect().top - container.getBoundingClientRect().top;
    container.scrollTop = Math.max(container.scrollTop + offset - 12, 0);
  }, [focusDateString, monthKey]);

  if (!days.length) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
          <CalendarDays className="mx-auto h-10 w-10 text-outline-variant" />
          <p className="mt-3 text-sm font-bold text-on-surface-variant">이 달에 등록된 일정과 할 일이 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto custom-scrollbar px-4 py-5 md:px-8">
      <div className="mx-auto max-w-5xl space-y-4">
        {days.map(day => {
          const isToday = day.dateString === todayString;
          return (
          <section
            key={day.dateString}
            data-agenda-date={day.dateString}
            aria-current={isToday ? 'date' : undefined}
            className={`overflow-hidden rounded-2xl border bg-surface-container-lowest shadow-soft ${
              isToday ? 'border-primary ring-2 ring-primary/30' : 'border-outline-variant/60'
            }`}
          >
            <header className={`flex items-center justify-between border-b border-grid-line px-4 py-3 ${isToday ? 'bg-primary/10' : 'bg-surface-container-low'}`}>
              <h2 className={`flex items-center gap-2 text-sm font-extrabold ${isToday ? 'text-primary' : 'text-on-surface'}`}>
                {formatDateHeading(day.dateString)}
                {isToday && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-extrabold text-white">오늘</span>}
              </h2>
              <span className="text-[10px] font-bold text-outline">일정 {day.schedules.length} · 할 일 {day.todos.length}</span>
            </header>

            <div className="divide-y divide-grid-line/70">
              {day.schedules.map(schedule => {
                const isHighPriority = schedule.priority === 'high';
                return (
                  <button
                    key={`${schedule.id}-${day.dateString}`}
                    type="button"
                    data-schedule-priority={schedule.priority}
                    onClick={() => onSelectSchedule(schedule)}
                    className={`grid w-full grid-cols-[70px_72px_minmax(0,1fr)] items-center gap-3 px-4 py-3 text-left transition-all cursor-pointer ${
                      isHighPriority
                        ? `border-l-4 ${PRIORITY_COLORS.high.border} ${PRIORITY_COLORS.high.bg} hover:brightness-95`
                        : 'hover:bg-surface-container-low'
                    }`}
                  >
                    <span className={`text-[11px] font-bold tabular-nums ${isHighPriority ? PRIORITY_COLORS.high.text : 'text-on-surface-variant'}`}>{day.dateString}</span>
                    <span className={`rounded-lg px-2 py-1 text-center text-[10px] font-extrabold ${
                      isHighPriority
                        ? `${PRIORITY_COLORS.high.bg} ${PRIORITY_COLORS.high.text}`
                        : schedule.allDay ? 'bg-primary/10 text-primary' : NEUTRAL_BADGE_CLASS
                    }`}>
                      종일
                    </span>
                    <span className={`min-w-0 truncate text-sm font-semibold ${isHighPriority ? PRIORITY_COLORS.high.text : 'text-on-surface'}`}>
                      {!schedule.allDay && <span className={`mr-2 text-[11px] font-medium ${isHighPriority ? PRIORITY_COLORS.high.text : 'text-outline'}`}>{schedule.startTime}–{schedule.endTime}</span>}
                      {schedule.title}
                    </span>
                  </button>
                );
              })}

              {day.todos.map(todo => {
                const relation = todo.createdDateString === day.dateString && todo.targetDateString === day.dateString
                  ? '등록·목표일'
                  : todo.targetDateString === day.dateString ? '목표일' : '등록일';
                return (
                  <div key={`${todo.id}-${day.dateString}`} className="grid grid-cols-[70px_72px_minmax(0,1fr)] items-center gap-3 px-4 py-3">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-outline"><CheckSquare2 className="h-3.5 w-3.5" />{relation}</span>
                    <span className={`rounded-lg px-2 py-1 text-center text-[10px] font-extrabold ${todo.status === 'done' ? NEUTRAL_BADGE_CLASS : 'bg-surface-container-high text-primary'}`}>
                      {TODO_STATUS_LABELS[todo.status]}
                    </span>
                    <span className={`min-w-0 truncate text-sm font-semibold ${todo.status === 'done' ? 'line-through text-outline' : 'text-on-surface'}`}>{todo.text}</span>
                  </div>
                );
              })}
            </div>
          </section>
          );
        })}
      </div>
    </div>
  );
}
