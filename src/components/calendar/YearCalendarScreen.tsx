import { Schedule } from '../../types';
import { toLocalDateString } from '../../utils/date';

interface YearCalendarScreenProps {
  selectedDate: Date;
  schedulesByDate: Map<string, Schedule[]>;
  onSelectMonth: (date: Date) => void;
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function isToday(year: number, month: number, day: number) {
  const today = new Date();
  return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
}

export default function YearCalendarScreen({
  selectedDate,
  schedulesByDate,
  onSelectMonth,
}: YearCalendarScreenProps) {
  const year = selectedDate.getFullYear();

  return (
    <div className="h-full overflow-y-auto p-4 no-scrollbar md:p-6" aria-label={`${year}년 연간 캘린더`}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 12 }, (_, month) => {
          const firstWeekday = new Date(year, month, 1).getDay();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
          const monthScheduleCount = days.reduce((count, day) => {
            const dateString = toLocalDateString(new Date(year, month, day));
            return count + (schedulesByDate.get(dateString)?.length || 0);
          }, 0);
          const selectedMonth = selectedDate.getMonth() === month;

          return (
            <button
              key={month}
              type="button"
              onClick={() => onSelectMonth(new Date(year, month, 1))}
              className={`rounded-2xl border bg-surface-container-lowest p-3 text-left shadow-soft transition-all hover:border-primary hover:shadow-md ${
                selectedMonth ? 'border-primary ring-1 ring-primary/20' : 'border-outline-variant'
              }`}
              aria-label={`${month + 1}월, 일정 ${monthScheduleCount}개, 월간 보기로 이동`}
            >
              <span className="mb-2 flex items-center justify-between">
                <span className="text-sm font-extrabold text-on-surface">{month + 1}월</span>
                <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">
                  일정 {monthScheduleCount}개
                </span>
              </span>

              <span className="grid grid-cols-7 text-center text-[9px] font-bold text-outline">
                {WEEKDAY_LABELS.map((label, index) => (
                  <span key={label} className={index === 0 ? 'text-error' : index === 6 ? 'text-primary' : ''}>{label}</span>
                ))}
              </span>

              <span className="mt-1 grid grid-cols-7 gap-y-1 text-center">
                {Array.from({ length: firstWeekday }, (_, index) => <span key={`blank-${index}`} />)}
                {days.map((day) => {
                  const dateString = toLocalDateString(new Date(year, month, day));
                  const count = schedulesByDate.get(dateString)?.length || 0;
                  const weekday = new Date(year, month, day).getDay();
                  return (
                    <span
                      key={day}
                      className={`relative mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${
                        isToday(year, month, day)
                          ? 'bg-primary text-white'
                          : weekday === 0 ? 'text-error' : weekday === 6 ? 'text-primary' : 'text-on-surface-variant'
                      }`}
                    >
                      {day}
                      {count > 0 && (
                        <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-primary" aria-hidden="true" />
                      )}
                    </span>
                  );
                })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
