import { useEffect, useRef } from 'react';
import { Schedule } from '../../types';
import { toLocalDateString } from '../../utils/date';
import {
  DEFAULT_SCROLL_HOUR,
  GRID_END_HOUR,
  GRID_START_HOUR,
  HOUR_HEIGHT_PX,
  PRIORITY_COLORS,
  TIME_STEP_MINUTES,
  minutesToTime,
  scheduleHeightPx,
  scheduleTopPx,
  splitAllDaySchedules,
} from './scheduleUtils';
import { isSameLocalDate } from './calendarUtils';

const HOURS = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, i) => GRID_START_HOUR + i);
const SLOT_HEIGHT_PX = (HOUR_HEIGHT_PX * TIME_STEP_MINUTES) / 60;
const SLOTS = Array.from(
  { length: ((GRID_END_HOUR - GRID_START_HOUR) * 60) / TIME_STEP_MINUTES },
  (_, i) => GRID_START_HOUR * 60 + i * TIME_STEP_MINUTES,
);

interface TimeGridProps {
  days: Date[]; // 길이 1 = 일간, 7 = 주간
  schedulesByDate: Map<string, Schedule[]>;
  onSelectSchedule: (schedule: Schedule) => void;
  onCreateSchedule: (dateString: string, startTime: string) => void;
}

export default function TimeGrid({ days, schedulesByDate, onSelectSchedule, onCreateSchedule }: TimeGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = new Date();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = DEFAULT_SCROLL_HOUR * HOUR_HEIGHT_PX;
    }
  }, []);

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* 종일(고정) 일정 스트립 */}
      <div className="flex border-b border-grid-line shrink-0">
        <div className="w-10 md:w-14 shrink-0" />
        <div className={`flex-1 grid`} style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
          {days.map((date) => {
            const dateString = toLocalDateString(date);
            const { allDay } = splitAllDaySchedules(schedulesByDate.get(dateString) || []);
            return (
              <div key={dateString} className="p-1.5 flex flex-col gap-1 border-r border-grid-line last:border-r-0 min-h-[32px]">
                {allDay.map((schedule) => (
                  <button
                    key={schedule.id}
                    type="button"
                    onClick={() => onSelectSchedule(schedule)}
                    className={`text-left text-xs font-bold px-1.5 py-0.5 rounded truncate border ${PRIORITY_COLORS[schedule.priority].bg} ${PRIORITY_COLORS[schedule.priority].border} ${PRIORITY_COLORS[schedule.priority].text}`}
                    title={schedule.title}
                  >
                    {schedule.title}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* 시간축 + 일정 그리드 */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="flex" style={{ height: HOURS.length * HOUR_HEIGHT_PX }}>
          {/* 왼쪽 시간축 레일 */}
          <div className="w-10 md:w-14 shrink-0 relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 -translate-y-1/2 text-right pr-1.5 md:pr-2 text-[10px] font-semibold text-outline"
                style={{ top: hour * HOUR_HEIGHT_PX }}
              >
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* 날짜별 컬럼 */}
          <div className="flex-1 relative grid" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
            {days.map((date) => {
              const dateString = toLocalDateString(date);
              const { timed } = splitAllDaySchedules(schedulesByDate.get(dateString) || []);
              const currentDay = isSameLocalDate(date, today);

              return (
                <div key={dateString} className="relative border-r border-grid-line last:border-r-0">
                  {SLOTS.map((slotMinutes) => {
                    const isHourStart = slotMinutes % 60 === 0;
                    const slotTime = minutesToTime(slotMinutes);
                    return (
                      <button
                        key={slotMinutes}
                        type="button"
                        onClick={() => onCreateSchedule(dateString, slotTime)}
                        aria-label={`${dateString} ${slotTime}에 새 일정`}
                        className={`absolute left-0 right-0 hover:bg-primary/5 cursor-pointer transition-colors ${isHourStart ? 'border-t border-grid-line' : 'border-t border-dashed border-grid-line/60'} ${currentDay ? 'bg-primary/[0.02]' : ''}`}
                        style={{ top: (slotMinutes / 60) * HOUR_HEIGHT_PX, height: SLOT_HEIGHT_PX }}
                      />
                    );
                  })}

                  {timed.map((schedule) => (
                    <button
                      key={schedule.id}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectSchedule(schedule);
                      }}
                      className={`absolute left-1 right-1 rounded-lg border-l-4 px-1.5 py-1 text-left overflow-hidden shadow-2xs hover:brightness-95 transition-all cursor-pointer ${PRIORITY_COLORS[schedule.priority].bg} ${PRIORITY_COLORS[schedule.priority].border}`}
                      style={{
                        top: scheduleTopPx(schedule.startTime || '00:00'),
                        height: scheduleHeightPx(schedule.startTime || '00:00', schedule.endTime || '01:00'),
                      }}
                      title={`${schedule.startTime}–${schedule.endTime} ${schedule.title}`}
                      aria-label={`${schedule.startTime}–${schedule.endTime} ${schedule.title}`}
                    >
                      <span className="block text-[10px] font-semibold tabular-nums text-on-surface-variant truncate">
                        {schedule.startTime}–{schedule.endTime}
                      </span>
                      <span className={`block text-xs font-bold truncate ${PRIORITY_COLORS[schedule.priority].text}`}>
                        {schedule.title}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
