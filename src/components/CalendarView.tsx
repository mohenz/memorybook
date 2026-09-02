import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, ChevronLeft, ChevronRight, List, Search } from 'lucide-react';
import MemoryIcon from './MemoryIcon';
import { Group, Note, Schedule, TodoItem } from '../types';
import { toLocalDateString } from '../utils/date';
import { koreanHolidays } from '../features/holidays/koreanHolidays.generated';
import { groupKoreanHolidays } from '../features/holidays/koreanHolidayUtils';
import DayCalendarScreen from './calendar/DayCalendarScreen';
import MonthCalendarScreen from './calendar/MonthCalendarScreen';
import ScheduleFormModal, { ScheduleDraft } from './calendar/ScheduleFormModal';
import SelectedDayPanel from './calendar/SelectedDayPanel';
import WeekCalendarScreen from './calendar/WeekCalendarScreen';
import YearCalendarScreen from './calendar/YearCalendarScreen';
import AgendaCalendarScreen from './calendar/AgendaCalendarScreen';
import {
  CalendarViewMode,
  formatCalendarPeriod,
  getMonthCells,
  getWeekDates,
  getYearDates,
  groupCalendarNotes,
  shiftCalendarDate,
} from './calendar/calendarUtils';
import { groupSchedulesByDate } from './calendar/scheduleUtils';
import { getOpenTodosWithTargetDate } from '../utils/todos';

export { clampDayToMonth } from './calendar/calendarUtils';

type ScheduleModalState =
  | { mode: 'closed' }
  | { mode: 'create'; dateString: string; startTime: string }
  | { mode: 'edit'; schedule: Schedule };

interface CalendarViewProps {
  initialViewMode?: CalendarViewMode;
  createScheduleRequested?: boolean;
  onCreateScheduleRequestHandled?: () => void;
  notes: Note[];
  schedules: Schedule[];
  todos: TodoItem[];
  groups: Group[];
  onSelectNote: (noteId: string) => void;
  onAddNote: (dateString: string) => void;
  onAddSchedule: (draft: ScheduleDraft) => void;
  onUpdateSchedule: (scheduleId: string, draft: ScheduleDraft) => void;
  onDeleteSchedule: (scheduleId: string) => void;
}

const VIEW_OPTIONS: Array<{ value: Exclude<CalendarViewMode, 'agenda'>; label: string }> = [
  { value: 'day', label: '일' },
  { value: 'week', label: '주' },
  { value: 'month', label: '월' },
  { value: 'year', label: '년' },
];

const MOVE_LABEL: Record<CalendarViewMode, string> = {
  month: '달',
  week: '주',
  day: '일',
  year: '년',
  agenda: '달',
};

export default function CalendarView({
  initialViewMode = 'month',
  createScheduleRequested = false,
  onCreateScheduleRequestHandled,
  notes,
  schedules,
  todos,
  groups,
  onSelectNote,
  onAddNote,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
}: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>(initialViewMode);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [scheduleModal, setScheduleModal] = useState<ScheduleModalState>({ mode: 'closed' });

  const selectedDateString = toLocalDateString(selectedDate);
  const visibleDateStrings = useMemo(() => {
    if (viewMode === 'year') return getYearDates(selectedDate).map(toLocalDateString);
    if (viewMode === 'agenda') return getMonthCells(selectedDate).filter(cell => cell.isCurrentMonth).map(cell => cell.dateString);
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
  const selectedTodos = useMemo(() => getOpenTodosWithTargetDate(todos), [todos]);
  const selectedHolidays = holidaysByDate.get(selectedDateString) || [];

  const movePeriod = (offset: number) => {
    setSelectedDate((date) => shiftCalendarDate(date, viewMode, offset));
  };

  const moveToToday = () => setSelectedDate(new Date());

  const closeScheduleModal = () => setScheduleModal({ mode: 'closed' });

  useEffect(() => {
    if (createScheduleRequested) {
      setScheduleModal({ mode: 'create', dateString: selectedDateString, startTime: '09:00' });
      onCreateScheduleRequestHandled?.();
    }
  }, [createScheduleRequested, onCreateScheduleRequestHandled, selectedDateString]);

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
      <header className="sticky top-0 z-20 flex w-full shrink-0 items-center gap-2 overflow-x-auto border-b border-grid-line bg-background/90 px-3 py-2 backdrop-blur-md no-scrollbar md:px-4">
        <div className="flex shrink-0 items-center gap-2">
            <h1 className="w-[22rem] shrink-0 whitespace-nowrap font-sans text-[18px] font-bold tabular-nums text-on-background">
              {formatCalendarPeriod(selectedDate, viewMode)}
            </h1>

            <div className="flex shrink-0 items-center rounded-full bg-surface-container p-0.5">
              <button
                type="button"
                onClick={() => movePeriod(-1)}
                aria-label={`이전 ${MOVE_LABEL[viewMode]}`}
                className="rounded-full p-1 text-on-surface-variant transition-all hover:bg-surface-dim active:scale-90 cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={moveToToday}
                className="rounded-full bg-surface-container-lowest px-2.5 py-1 font-sans text-[11px] font-bold text-primary shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                오늘
              </button>
              <button
                type="button"
                onClick={() => movePeriod(1)}
                aria-label={`다음 ${MOVE_LABEL[viewMode]}`}
                className="rounded-full p-1 text-on-surface-variant transition-all hover:bg-surface-dim active:scale-90 cursor-pointer"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
        </div>

          <div role="group" aria-label="캘린더 보기 방식" className="flex shrink-0 items-center gap-1">
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setViewMode(option.value)}
                aria-pressed={viewMode === option.value}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold transition-all active:scale-95 cursor-pointer ${
                  viewMode === option.value
                    ? 'bg-primary text-white shadow-soft hover:brightness-110'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-dim'
                }`}
              >
                {option.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              aria-label="일정 목록"
              aria-pressed={viewMode === 'agenda'}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all active:scale-95 cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-primary text-white shadow-soft hover:brightness-110'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-dim'
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="relative w-48 shrink-0">
            <MemoryIcon name="search" className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-outline" />
            <input
              type="search"
              aria-label="캘린더 일정 검색"
              placeholder="일정 검색..."
              className="h-8 w-full rounded-xl border border-transparent bg-surface pl-8 pr-2 text-[11px] font-medium text-on-surface transition-all placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary select-text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={() => setScheduleModal({ mode: 'create', dateString: selectedDateString, startTime: '09:00' })}
            className="flex h-8 shrink-0 items-center gap-1 rounded-xl bg-primary px-3 text-[11px] font-bold text-white shadow-soft transition-all hover:brightness-110 active:scale-95 cursor-pointer"
          >
            <MemoryIcon name="add_event" className="h-3.5 w-3.5" />
            <span>새 일정</span>
          </button>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden">
        {viewMode === 'agenda' ? (
          <AgendaCalendarScreen
            selectedDate={selectedDate}
            schedulesByDate={schedulesByDate}
            todos={todos}
            searchQuery={searchQuery}
            onSelectSchedule={(schedule) => setScheduleModal({ mode: 'edit', schedule })}
          />
        ) : viewMode === 'year' ? (
          <YearCalendarScreen
            selectedDate={selectedDate}
            schedulesByDate={schedulesByDate}
            onSelectMonth={(date) => {
              setSelectedDate(date);
              setViewMode('month');
            }}
          />
        ) : viewMode === 'day' ? (
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
              todos={selectedTodos}
              todayDateString={toLocalDateString()}
              holidays={selectedHolidays}
              groups={groups}
              onSelectNote={onSelectNote}
              onSelectSchedule={(schedule) => setScheduleModal({ mode: 'edit', schedule })}
              onAddSchedule={() => setScheduleModal({ mode: 'create', dateString: selectedDateString, startTime: '09:00' })}
              onAddNote={() => onAddNote(selectedDateString)}
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
