import { Schedule } from '../../types';
import { KoreanHoliday } from '../../features/holidays/koreanHolidayTypes';
import { getHolidayNames } from '../../features/holidays/koreanHolidayUtils';
import { getMonthCells, isSameLocalDate } from '../../components/calendar/calendarUtils';
import { PRIORITY_COLORS, PRIORITY_ORDER } from '../../components/calendar/scheduleUtils';

interface MobileMonthGridProps {
  selectedDate: Date;
  schedulesByDate: Map<string, Schedule[]>;
  holidaysByDate: Map<string, KoreanHoliday[]>;
  onSelectDate: (date: Date) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function MobileMonthGrid({
  selectedDate,
  schedulesByDate,
  holidaysByDate,
  onSelectDate,
}: MobileMonthGridProps) {
  const cells = getMonthCells(selectedDate);
  const today = new Date();

  return (
    <div
      className="overflow-hidden rounded-2xl border border-grid-line bg-surface-container-lowest shadow-soft"
      aria-label={`${selectedDate.getFullYear()}년 ${selectedDate.getMonth() + 1}월 달력`}
    >
      <div className="grid grid-cols-7 border-b border-grid-line bg-surface-container-low py-2 text-center text-[11px] font-bold text-on-surface-variant">
        {WEEKDAYS.map((label, index) => (
          <div key={label} className={index === 0 ? 'text-error' : index === 6 ? 'text-primary' : ''}>{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const daySchedules = schedulesByDate.get(cell.dateString) || [];
          const dayHolidays = holidaysByDate.get(cell.dateString) || [];
          const selected = isSameLocalDate(cell.date, selectedDate);
          const currentDay = isSameLocalDate(cell.date, today);
          const weekday = cell.date.getDay();
          const isDayOff = dayHolidays.some((holiday) => holiday.isDayOff);
          const priorities = PRIORITY_ORDER.filter((priority) => daySchedules.some((schedule) => schedule.priority === priority));

          return (
            <button
              key={cell.dateString}
              type="button"
              onClick={() => onSelectDate(cell.date)}
              aria-current={selected ? 'date' : undefined}
              aria-label={`${cell.date.getMonth() + 1}월 ${cell.date.getDate()}일${dayHolidays.length > 0 ? `, ${getHolidayNames(dayHolidays)}` : ''}, 일정 ${daySchedules.length}개`}
              className={`flex h-[52px] flex-col items-center gap-0.5 border-b border-r border-grid-line pt-1.5 active:bg-primary/10 ${
                cell.isCurrentMonth ? '' : 'opacity-40'
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  selected
                    ? 'bg-primary text-white shadow-soft'
                    : currentDay
                      ? 'text-primary ring-2 ring-primary'
                      : isDayOff || weekday === 0
                        ? 'text-error'
                        : weekday === 6
                          ? 'text-primary'
                          : 'text-on-surface'
                }`}
              >
                {cell.date.getDate()}
              </span>
              <span className="flex h-2 items-center gap-0.5">
                {priorities.map((priority) => (
                  <span key={priority} className={`h-1.5 w-1.5 rounded-full ${PRIORITY_COLORS[priority].dot}`} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
