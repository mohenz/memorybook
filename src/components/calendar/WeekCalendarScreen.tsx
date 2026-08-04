import { Schedule } from '../../types';
import HolidayBadges from '../../features/holidays/HolidayBadges';
import { KoreanHoliday } from '../../features/holidays/koreanHolidayTypes';
import { getHolidayNames } from '../../features/holidays/koreanHolidayUtils';
import { toLocalDateString } from '../../utils/date';
import TimeGrid from './TimeGrid';
import { getWeekDates, isSameLocalDate } from './calendarUtils';

interface WeekCalendarScreenProps {
  selectedDate: Date;
  schedulesByDate: Map<string, Schedule[]>;
  holidaysByDate: Map<string, KoreanHoliday[]>;
  onSelectDate: (date: Date) => void;
  onSelectSchedule: (schedule: Schedule) => void;
  onCreateSchedule: (dateString: string, startTime: string) => void;
}

export default function WeekCalendarScreen({
  selectedDate,
  schedulesByDate,
  holidaysByDate,
  onSelectDate,
  onSelectSchedule,
  onCreateSchedule,
}: WeekCalendarScreenProps) {
  const today = new Date();
  const weekDates = getWeekDates(selectedDate);

  return (
    <div className="h-full flex flex-col min-h-0 p-2 md:p-4 gap-2">
      <div className="flex bg-surface-container-lowest rounded-xl notebook-shadow border border-grid-line overflow-hidden shrink-0">
        {/* TimeGrid 아래 시간축 레일(w-10 md:w-14)과 폭을 맞춰 요일 칸과 시간 그리드 칸을 정렬 */}
        <div className="w-10 md:w-14 shrink-0" />
        <div className="flex-1 grid grid-cols-7">
          {weekDates.map((date) => {
            const dateString = toLocalDateString(date);
            const dayHolidays = holidaysByDate.get(dateString) || [];
            const selected = isSameLocalDate(date, selectedDate);
            const currentDay = isSameLocalDate(date, today);

            return (
              <button
                key={dateString}
                type="button"
                onClick={() => onSelectDate(date)}
                className={`px-2 py-2 border-r border-grid-line last:border-r-0 text-center cursor-pointer transition-colors ${selected ? 'bg-primary/5' : 'hover:bg-surface-container-low'}`}
                aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일${dayHolidays.length > 0 ? `, ${getHolidayNames(dayHolidays)}` : ''} 선택`}
              >
                <span className="block text-[10px] font-bold text-on-surface-variant">
                  {['일', '월', '화', '수', '목', '금', '토'][date.getDay()]}
                </span>
                <span className={`mt-1 mx-auto w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${selected ? 'bg-primary text-white' : currentDay ? 'ring-2 ring-primary text-primary' : 'text-on-surface'}`}>
                  {date.getDate()}
                </span>
                <HolidayBadges holidays={dayHolidays} compact />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-surface-container-lowest rounded-xl notebook-shadow border border-grid-line overflow-hidden">
        <TimeGrid
          days={weekDates}
          schedulesByDate={schedulesByDate}
          onSelectSchedule={onSelectSchedule}
          onCreateSchedule={onCreateSchedule}
        />
      </div>
    </div>
  );
}
