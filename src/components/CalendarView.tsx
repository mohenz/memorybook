import { useMemo, useState } from 'react';
import { CalendarPlus, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Group, Note, Schedule } from '../types';
import { toLocalDateString } from '../utils/date';
import { koreanHolidays } from '../features/holidays/koreanHolidays.generated';
import { groupKoreanHolidays } from '../features/holidays/koreanHolidayUtils';
import DayCalendarScreen from './calendar/DayCalendarScreen';
import MonthCalendarScreen from './calendar/MonthCalendarScreen';
import ScheduleFormModal, { ScheduleDraft } from './calendar/ScheduleFormModal';
import SelectedDayPanel from './calendar/SelectedDayPanel';
import WeekCalendarScreen from './calendar/WeekCalendarScreen';
import {
  CalendarViewMode,
  formatCalendarPeriod,
  getMonthCells,
  getWeekDates,
  groupCalendarNotes,
  shiftCalendarDate,
} from './calendar/calendarUtils';
import { groupSchedulesByDate } from './calendar/scheduleUtils';

export { clampDayToMonth } from './calendar/calendarUtils';

type ScheduleModalState =
  | { mode: 'closed' }
  | { mode: 'create'; dateString: string; startTime: string }
  | { mode: 'edit'; schedule: Schedule };

interface CalendarViewProps {
  notes: Note[];
  schedules: Schedule[];
  groups: Group[];
  onSelectNote: (noteId: string) => void;
  onAddSchedule: (draft: ScheduleDraft) => void;
  onUpdateSchedule: (scheduleId: string, draft: ScheduleDraft) => void;
  onDeleteSchedule: (scheduleId: string) => void;
}

const VIEW_OPTIONS: Array<{ value: CalendarViewMode; label: string }> = [
  { value: 'month', label: '월간' },
  { value: 'week', label: '주간' },
  { value: 'day', label: '일간' },
];

const MOVE_LABEL: Record<CalendarViewMode, string> = {
  month: '달',
  week: '주',
  day: '일',
};

export default function CalendarView({
  notes,
  schedules,
  groups,
  onSelectNote,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
}: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [scheduleModal, setScheduleModal] = useState<ScheduleModalState>({ mode: 'closed' });

  const selectedDateString = toLocalDateString(selectedDate);
  const visibleDateStrings = useMemo(() => {
    if (viewMode === 'month') return getMonthCells(selectedDate).map((cell) => cell.dateString);
    if (viewMode === 'week') return getWeekDates(selectedDate).map(toLocalDateString);
    return [selectedDateString];
  }, [selectedDate, selectedDateString, viewMode]);
  const schedulesByDate = useMemo(
    () => groupSchedulesByDate(schedules, searchQuery, visibleDateStrings),
    [schedules, searchQuery, visibleDateStrings],
  );
  const notesByDate = useMemo(() => groupCalendarNotes(notes, ''), [notes]);
  const holidaysByDate = useMemo(() => groupKoreanHolidays(koreanHolidays), []);
  const selectedNotes = notesByDate.get(selectedDateString) || [];
  const selectedSchedules = schedulesByDate.get(selectedDateString) || [];
  const selectedHolidays = holidaysByDate.get(selectedDateString) || [];

  const movePeriod = (offset: number) => {
    setSelectedDate((date) => shiftCalendarDate(date, viewMode, offset));
  };

  const moveToToday = () => setSelectedDate(new Date());

  const closeScheduleModal = () => setScheduleModal({ mode: 'closed' });

  const handleSaveSchedule = (draft: ScheduleDraft) => {
    if (scheduleModal.mode === 'edit') {
      onUpdateSchedule(scheduleModal.schedule.id, draft);
    } else {
      onAddSchedule(draft);
    }
    closeScheduleModal();
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    onDeleteSchedule(scheduleId);
    closeScheduleModal();
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-background select-none relative">
      <header className="sticky top-0 w-full flex flex-col gap-3 px-4 md:px-8 py-3 z-20 bg-background/90 backdrop-blur-md border-b border-grid-line shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 md:gap-5 min-w-0">
            <h1 className="font-sans text-base md:text-lg font-bold text-on-background truncate">
              {formatCalendarPeriod(selectedDate, viewMode)}
            </h1>

            <div className="flex items-center bg-surface-container rounded-full p-1 shrink-0">
              <button
                type="button"
                onClick={() => movePeriod(-1)}
                aria-label={`이전 ${MOVE_LABEL[viewMode]}`}
                className="p-1 hover:bg-surface-dim rounded-full transition-all active:scale-90 text-on-surface-variant cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={moveToToday}
                className="px-3 md:px-4 py-1 font-sans text-xs font-bold text-primary bg-surface-container-lowest rounded-full shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                오늘
              </button>
              <button
                type="button"
                onClick={() => movePeriod(1)}
                aria-label={`다음 ${MOVE_LABEL[viewMode]}`}
                className="p-1 hover:bg-surface-dim rounded-full transition-all active:scale-90 text-on-surface-variant cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:justify-end">
          <div className="flex items-center bg-surface-container rounded-xl p-1 shrink-0" aria-label="캘린더 보기 방식">
            {VIEW_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => setViewMode(option.value)}
                aria-pressed={viewMode === option.value}
                className={`px-3 md:px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === option.value ? 'bg-primary text-white shadow-soft' : 'text-on-surface-variant hover:bg-surface-container-lowest'}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 md:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="search"
              aria-label="캘린더 일정 검색"
              placeholder="일정 검색..."
              className="bg-surface border border-transparent rounded-xl h-10 pl-9 pr-4 w-full md:w-56 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-xs font-medium text-on-surface placeholder:text-outline select-text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={() => setScheduleModal({ mode: 'create', dateString: selectedDateString, startTime: '09:00' })}
            className="bg-primary text-white text-xs font-bold px-4 h-10 rounded-xl flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all shadow-soft cursor-pointer shrink-0"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>새 일정</span>
          </button>

        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden">
        {viewMode === 'day' ? (
          <DayCalendarScreen
            selectedDate={selectedDate}
            schedules={selectedSchedules}
            holidays={selectedHolidays}
            onSelectSchedule={(schedule) => setScheduleModal({ mode: 'edit', schedule })}
            onCreateSchedule={(dateString, startTime) => setScheduleModal({ mode: 'create', dateString, startTime })}
          />
        ) : (
          <div className="h-full flex flex-col xl:flex-row min-h-0 overflow-hidden">
            <div className="flex-1 min-w-0 min-h-0">
              {viewMode === 'month' ? (
                <MonthCalendarScreen
                  selectedDate={selectedDate}
                  schedulesByDate={schedulesByDate}
                  holidaysByDate={holidaysByDate}
                  onSelectDate={setSelectedDate}
                  onSelectSchedule={(schedule) => setScheduleModal({ mode: 'edit', schedule })}
                />
              ) : (
                <WeekCalendarScreen
                  selectedDate={selectedDate}
                  schedulesByDate={schedulesByDate}
                  holidaysByDate={holidaysByDate}
                  onSelectDate={setSelectedDate}
                  onSelectSchedule={(schedule) => setScheduleModal({ mode: 'edit', schedule })}
                  onCreateSchedule={(dateString, startTime) => setScheduleModal({ mode: 'create', dateString, startTime })}
                />
              )}
            </div>

            <SelectedDayPanel
              selectedDate={selectedDate}
              notes={selectedNotes}
              schedules={selectedSchedules}
              holidays={selectedHolidays}
              groups={groups}
              onSelectNote={onSelectNote}
              onSelectSchedule={(schedule) => setScheduleModal({ mode: 'edit', schedule })}
            />
          </div>
        )}
      </div>

      {scheduleModal.mode !== 'closed' && (
        <ScheduleFormModal
          schedule={scheduleModal.mode === 'edit' ? scheduleModal.schedule : null}
          initialDateString={scheduleModal.mode === 'create' ? scheduleModal.dateString : selectedDateString}
          initialStartTime={scheduleModal.mode === 'create' ? scheduleModal.startTime : undefined}
          onSave={handleSaveSchedule}
          onDelete={scheduleModal.mode === 'edit' ? handleDeleteSchedule : undefined}
          onClose={closeScheduleModal}
        />
      )}

      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
    </div>
  );
}
