import { Plus } from 'lucide-react';
import { Schedule } from '../../types';
import HolidayBadges from '../../features/holidays/HolidayBadges';
import { KoreanHoliday } from '../../features/holidays/koreanHolidayTypes';
import { toLocalDateString } from '../../utils/date';
import TimeGrid from './TimeGrid';

interface DayCalendarScreenProps {
  selectedDate: Date;
  schedules: Schedule[];
  holidays: KoreanHoliday[];
  onSelectSchedule: (schedule: Schedule) => void;
  onCreateSchedule: (dateString: string, startTime: string) => void;
}

export default function DayCalendarScreen({
  selectedDate,
  schedules,
  holidays,
  onSelectSchedule,
  onCreateSchedule,
}: DayCalendarScreenProps) {
  const dateString = toLocalDateString(selectedDate);
  const schedulesByDate = new Map([[dateString, schedules]]);

  return (
    <div className="h-full flex flex-col min-h-0 p-4 md:p-6 gap-3">
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div>
          <p className="text-xs font-bold text-primary">하루 일정</p>
          <h2 className="mt-1 text-xl font-bold text-on-surface">
            {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
          </h2>
          <HolidayBadges holidays={holidays} />
        </div>
        <button
          type="button"
          onClick={() => onCreateSchedule(dateString, '09:00')}
          className="flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3.5 h-9 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-soft cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          새 일정
        </button>
      </div>

      <div className="flex-1 min-h-0 bg-surface-container-lowest rounded-xl notebook-shadow border border-grid-line overflow-hidden">
        <TimeGrid
          days={[selectedDate]}
          schedulesByDate={schedulesByDate}
          onSelectSchedule={onSelectSchedule}
          onCreateSchedule={onCreateSchedule}
        />
      </div>
    </div>
  );
}
