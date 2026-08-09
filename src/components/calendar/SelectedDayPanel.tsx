import { CalendarPlus, FilePlus2 } from 'lucide-react';
import { Group, Note, Schedule } from '../../types';
import HolidayBadges from '../../features/holidays/HolidayBadges';
import { KoreanHoliday } from '../../features/holidays/koreanHolidayTypes';
import CalendarNoteCard from './CalendarNoteCard';
import { PRIORITY_COLORS } from './scheduleUtils';

interface SelectedDayPanelProps {
  selectedDate: Date;
  notes: Note[];
  schedules: Schedule[];
  holidays: KoreanHoliday[];
  groups: Group[];
  onSelectNote: (noteId: string) => void;
  onSelectSchedule: (schedule: Schedule) => void;
  onAddSchedule: () => void;
  onAddNote: () => void;
}

export default function SelectedDayPanel({
  selectedDate,
  notes,
  schedules,
  holidays,
  groups,
  onSelectNote,
  onSelectSchedule,
  onAddSchedule,
  onAddNote,
}: SelectedDayPanelProps) {
  const dateLabel = `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`;

  return (
    <aside className="w-full xl:w-[360px] max-h-[42vh] xl:max-h-none border-t xl:border-t-0 xl:border-l border-grid-line bg-surface-container-low flex flex-col shrink-0">
      <div className="p-5 md:p-6 flex flex-col h-full gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-sans text-lg font-bold text-on-surface">{dateLabel}</h2>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onAddSchedule}
              className="flex h-8 items-center gap-1 rounded-lg bg-primary px-2.5 text-[11px] font-bold text-white shadow-soft transition-all hover:brightness-110 active:scale-95 cursor-pointer"
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              일정 추가
            </button>
            <button
              type="button"
              onClick={onAddNote}
              className="flex h-8 items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2.5 text-[11px] font-bold text-on-surface transition-all hover:border-primary hover:text-primary active:scale-95 cursor-pointer"
            >
              <FilePlus2 className="h-3.5 w-3.5" />
              메모 추가
            </button>
          </div>
        </div>
        <HolidayBadges holidays={holidays} />

        <div className="space-y-5 overflow-y-auto custom-scrollbar pr-1 flex-1">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">일정</h3>
              <span className="text-xs bg-surface-container-high px-2 py-0.5 rounded-full text-on-surface-variant font-bold">
                {schedules.length}개
              </span>
            </div>
            {schedules.length === 0 ? (
              <p className="text-xs text-outline py-2">등록된 일정이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {schedules.map((schedule) => (
                  <div key={schedule.id}>
                    <button
                      type="button"
                      onClick={() => onSelectSchedule(schedule)}
                      aria-label={`${schedule.allDay ? '종일' : `${schedule.startTime}–${schedule.endTime}`} ${schedule.title}`}
                      className={`w-full text-left rounded-xl border-l-4 px-3 py-2.5 flex items-center gap-2 hover:brightness-95 transition-all cursor-pointer ${PRIORITY_COLORS[schedule.priority].bg} ${PRIORITY_COLORS[schedule.priority].border}`}
                    >
                      <span className="w-[76px] shrink-0 text-[11px] font-semibold tabular-nums text-on-surface-variant">
                        {schedule.allDay ? '종일' : `${schedule.startTime}–${schedule.endTime}`}
                      </span>
                      <span className={`min-w-0 flex-1 text-sm font-bold truncate ${PRIORITY_COLORS[schedule.priority].text}`}>
                        {schedule.title}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-grid-line/60" />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider">메모</h3>
              <span className="text-xs bg-surface-container-high px-2 py-0.5 rounded-full text-on-surface-variant font-bold">
                {notes.length}개
              </span>
            </div>
            {notes.length === 0 ? (
              <p className="text-xs text-outline py-2">등록된 메모가 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id}>
                    <CalendarNoteCard note={note} groups={groups} onSelectNote={onSelectNote} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
