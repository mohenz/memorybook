import { Schedule } from '../../types';
import HolidayBadges from '../../features/holidays/HolidayBadges';
import { KoreanHoliday } from '../../features/holidays/koreanHolidayTypes';
import { getHolidayNames } from '../../features/holidays/koreanHolidayUtils';
import { getMonthCells, isSameLocalDate } from './calendarUtils';
import { PRIORITY_COLORS, PRIORITY_ORDER } from './scheduleUtils';

interface MonthCalendarScreenProps {
  selectedDate: Date;
  schedulesByDate: Map<string, Schedule[]>;
  holidaysByDate: Map<string, KoreanHoliday[]>;
  onSelectDate: (date: Date) => void;
  onSelectSchedule: (schedule: Schedule) => void;
}

function highestPriority(schedules: Schedule[]) {
  return PRIORITY_ORDER.find((priority) => schedules.some((schedule) => schedule.priority === priority));
}

export default function MonthCalendarScreen({
  selectedDate,
  schedulesByDate,
  holidaysByDate,
  onSelectDate,
  onSelectSchedule,
}: MonthCalendarScreenProps) {
  const cells = getMonthCells(selectedDate);
  const today = new Date();

  return (
    <div className="h-full overflow-auto p-4 md:p-6 no-scrollbar">
      <div className="bg-surface-container-lowest rounded-xl notebook-shadow border border-grid-line overflow-hidden md:min-w-[680px]">
        <div className="grid grid-cols-7 border-b border-grid-line bg-surface-container-low text-xs font-bold py-3 text-center text-on-surface-variant">
          <div className="text-error">일</div>
          <div>월</div>
          <div>화</div>
          <div>수</div>
          <div>목</div>
          <div>금</div>
          <div className="text-primary">토</div>
        </div>

        <div className="grid grid-cols-7 auto-rows-[minmax(56px,1fr)] md:auto-rows-[minmax(112px,1fr)]">
          {cells.map((cell) => {
            const daySchedules = schedulesByDate.get(cell.dateString) || [];
            const dayHolidays = holidaysByDate.get(cell.dateString) || [];
            const selected = isSameLocalDate(cell.date, selectedDate);
            const currentDay = isSameLocalDate(cell.date, today);
            const weekday = cell.date.getDay();
            const topSchedulePriority = highestPriority(daySchedules);

            return (
              <div
                key={cell.dateString}
                className={`border-r border-b border-grid-line p-1.5 md:p-3 flex flex-col text-left hover:bg-primary/5 cursor-pointer transition-colors relative group ${selected ? 'bg-primary/5' : ''} ${cell.isCurrentMonth ? '' : 'bg-slate-50/50 opacity-45'}`}
              >
                <button
                  type="button"
                  onClick={() => onSelectDate(cell.date)}
                  className="flex justify-between items-start w-full cursor-pointer"
                  aria-label={`${cell.date.getMonth() + 1}월 ${cell.date.getDate()}일${dayHolidays.length > 0 ? `, ${getHolidayNames(dayHolidays)}` : ''}, 일정 ${daySchedules.length}개`}
                >
                  <span className={`w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full text-[10px] md:text-xs font-bold ${selected ? 'bg-primary text-white shadow-soft' : currentDay ? 'ring-2 ring-primary text-primary' : weekday === 0 ? 'text-error' : weekday === 6 ? 'text-primary' : 'text-on-surface'}`}>
                    {cell.date.getDate()}
                  </span>
                  <span className="flex items-center gap-1 shrink-0 mt-1">
                    {topSchedulePriority && (
                      <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_COLORS[topSchedulePriority].dot}`} />
                    )}
                  </span>
                </button>

                <HolidayBadges holidays={dayHolidays} compact />

                <div className="hidden md:mt-auto md:pt-2 md:flex flex-col gap-1 w-full overflow-hidden">
                  {daySchedules.slice(0, 2).map((schedule) => (
                    <button
                      type="button"
                      key={schedule.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectSchedule(schedule);
                      }}
                      className={`border-l-2 flex items-baseline gap-1 overflow-hidden px-1.5 py-0.5 rounded shadow-2xs max-w-full text-left ${PRIORITY_COLORS[schedule.priority].bg} ${PRIORITY_COLORS[schedule.priority].border}`}
                    >
                      <span className="text-[10px] font-semibold tabular-nums shrink-0 text-on-surface-variant">
                        {schedule.allDay ? '종일' : schedule.startTime}
                      </span>
                      <span className={`text-xs font-bold truncate min-w-0 ${PRIORITY_COLORS[schedule.priority].text}`}>
                        {schedule.title}
                      </span>
                    </button>
                  ))}
                  {daySchedules.length > 2 && (
                    <span className="text-[9px] text-outline font-bold pl-1">+{daySchedules.length - 2}개</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
