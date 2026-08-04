import { CalendarDays, FileText, RotateCcw, Trash2 } from 'lucide-react';
import { Note, Schedule } from '../../types';
import MobileEmptyState from '../components/MobileEmptyState';

interface MobileTrashScreenProps {
  notes: Note[];
  schedules: Schedule[];
  onRestoreNote: (noteId: string) => void;
  onPermanentlyDeleteNote: (noteId: string) => void;
  onRestoreSchedule: (scheduleId: string) => void;
  onPermanentlyDeleteSchedule: (scheduleId: string) => void;
}

export default function MobileTrashScreen({
  notes,
  schedules,
  onRestoreNote,
  onPermanentlyDeleteNote,
  onRestoreSchedule,
  onPermanentlyDeleteSchedule,
}: MobileTrashScreenProps) {
  const isEmpty = notes.length === 0 && schedules.length === 0;

  const confirmPermanentDelete = (label: string, action: () => void) => {
    if (confirm(`${label}을(를) 영구 삭제하시겠습니까?`)) action();
  };

  return (
    <section className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">
      <header className="h-14 px-4 flex items-center border-b border-grid-line shrink-0">
        <h1 className="text-lg font-bold text-on-surface">휴지통</h1>
        <span className="ml-2 text-xs font-semibold text-outline">{notes.length + schedules.length}개</span>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-20">
        {isEmpty ? <MobileEmptyState message="휴지통이 비어 있습니다" /> : (
          <ul>
            {notes.map(note => (
              <li key={note.id} className="border-b border-grid-line px-4 py-3">
                <div className="flex gap-3">
                  <FileText className="w-5 h-5 mt-0.5 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-primary">메모</p>
                    <p className="text-sm font-bold text-on-surface truncate">{note.title}</p>
                    <p className="text-xs text-on-surface-variant line-clamp-1">{note.content}</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <button type="button" onClick={() => onRestoreNote(note.id)} className="min-h-9 px-3 flex items-center gap-1 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                    <RotateCcw className="w-3.5 h-3.5" /> 복원
                  </button>
                  <button type="button" onClick={() => confirmPermanentDelete('메모', () => onPermanentlyDeleteNote(note.id))} className="min-h-9 px-3 flex items-center gap-1 rounded-lg bg-error/10 text-error text-xs font-bold">
                    <Trash2 className="w-3.5 h-3.5" /> 영구 삭제
                  </button>
                </div>
              </li>
            ))}

            {schedules.map(schedule => (
              <li key={schedule.id} className="border-b border-grid-line px-4 py-3">
                <div className="flex gap-3">
                  <CalendarDays className="w-5 h-5 mt-0.5 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-primary">일정</p>
                    <p className="text-sm font-bold text-on-surface truncate">{schedule.title}</p>
                    <p className="text-xs text-on-surface-variant">{schedule.dateString}{schedule.allDay ? ' · 종일' : schedule.startTime ? ` · ${schedule.startTime}` : ''}</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <button type="button" onClick={() => onRestoreSchedule(schedule.id)} className="min-h-9 px-3 flex items-center gap-1 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                    <RotateCcw className="w-3.5 h-3.5" /> 복원
                  </button>
                  <button type="button" onClick={() => confirmPermanentDelete('일정', () => onPermanentlyDeleteSchedule(schedule.id))} className="min-h-9 px-3 flex items-center gap-1 rounded-lg bg-error/10 text-error text-xs font-bold">
                    <Trash2 className="w-3.5 h-3.5" /> 영구 삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
