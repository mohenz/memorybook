import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Schedule } from '../../types';
import { toLocalDateString } from '../../utils/date';
import ScheduleFormModal, { ScheduleDraft } from '../../components/calendar/ScheduleFormModal';
import { PRIORITY_COLORS, groupSchedulesByDate } from '../../components/calendar/scheduleUtils';

interface MobileCalendarScreenProps {
  schedules: Schedule[];
  profileImage: string;
  onOpenSettings: () => void;
  onAddSchedule: (draft: ScheduleDraft) => void;
  onUpdateSchedule: (scheduleId: string, draft: ScheduleDraft) => void;
  onDeleteSchedule: (scheduleId: string) => void;
}

function addDays(date: Date, offset: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + offset);
  return next;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
}

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date);
}

function scheduleTime(schedule: Schedule) {
  if (schedule.allDay) return '종일';
  return `${schedule.startTime || '00:00'}–${schedule.endTime || '00:00'}`;
}

export default function MobileCalendarScreen({
  schedules,
  profileImage,
  onOpenSettings,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
}: MobileCalendarScreenProps) {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [scheduleModal, setScheduleModal] = useState<Schedule | null | undefined>(undefined);
  const dates = useMemo(() => [-1, 0, 1].map((offset) => addDays(selectedDate, offset)), [selectedDate]);
  const dateStrings = useMemo(() => dates.map(toLocalDateString), [dates]);
  const schedulesByDate = useMemo(
    () => groupSchedulesByDate(schedules, '', dateStrings),
    [dateStrings, schedules],
  );
  const selectedDateString = toLocalDateString(selectedDate);
  const selectedSchedules = schedulesByDate.get(selectedDateString) || [];
  const todayString = toLocalDateString(new Date());

  const saveSchedule = (draft: ScheduleDraft) => {
    if (scheduleModal) onUpdateSchedule(scheduleModal.id, draft);
    else onAddSchedule(draft);
    setScheduleModal(undefined);
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-grid-line px-4">
        <button
          type="button"
          onClick={onOpenSettings}
          className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-outline-variant"
          aria-label="설정"
        >
          <img src={profileImage} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-on-surface-variant">당일 일정</p>
          <h1 className="truncate !text-base font-bold text-on-surface">{formatFullDate(selectedDate)}</h1>
        </div>
        <button
          type="button"
          onClick={() => setSelectedDate(new Date())}
          className="h-9 rounded-xl bg-primary/10 px-3 text-xs font-bold text-primary"
        >
          오늘
        </button>
      </header>

      <div className="flex items-center justify-between px-4 pb-2 pt-3">
        <button
          type="button"
          aria-label="이전 날짜"
          onClick={() => setSelectedDate((date) => addDays(date, -1))}
          className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant active:bg-surface-container"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-sm font-bold text-on-surface">{formatDate(selectedDate)} 일정</p>
        <button
          type="button"
          aria-label="다음 날짜"
          onClick={() => setSelectedDate((date) => addDays(date, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant active:bg-surface-container"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 px-3 pb-3" aria-label="전날 오늘 다음날 일정 카드">
        {dates.map((date, index) => {
          const dateString = dateStrings[index];
          const daySchedules = schedulesByDate.get(dateString) || [];
          const isSelected = index === 1;
          const label = index === 0 ? '전날' : index === 2 ? '다음날' : dateString === todayString ? '오늘' : '선택일';

          return (
            <button
              key={dateString}
              type="button"
              onClick={() => setSelectedDate(date)}
              className={`min-w-0 rounded-2xl border p-3 text-left shadow-soft transition-colors ${
                isSelected
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-outline-variant bg-surface-container-lowest text-on-surface'
              }`}
              aria-current={isSelected ? 'date' : undefined}
            >
              <span className="block text-[10px] font-bold opacity-70">{label}</span>
              <span className="mt-0.5 block truncate text-xs font-bold">{formatDate(date)}</span>
              <span className="mt-2 block text-[11px] font-semibold">일정 {daySchedules.length}개</span>
              <span className="mt-0.5 block truncate text-[10px] opacity-70">
                {daySchedules[0]?.title || '등록된 일정 없음'}
              </span>
            </button>
          );
        })}
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-20">
        {selectedSchedules.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant text-center text-on-surface-variant">
            <CalendarDays className="mb-3 h-8 w-8 text-outline" />
            <p className="text-sm font-bold">등록된 일정이 없습니다</p>
            <p className="mt-1 text-xs text-outline">아래 버튼으로 이 날짜의 일정을 추가하세요.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {selectedSchedules.map((schedule) => {
              const color = PRIORITY_COLORS[schedule.priority];
              return (
                <li key={`${selectedDateString}-${schedule.id}`}>
                  <button
                    type="button"
                    onClick={() => setScheduleModal(schedule)}
                    className={`w-full rounded-2xl border-l-4 ${color.border} bg-surface-container-lowest p-4 text-left shadow-soft`}
                  >
                    <span className={`block text-xs font-bold ${color.text}`}>{scheduleTime(schedule)}</span>
                    <span className="mt-1 block text-sm font-bold text-on-surface">{schedule.title}</span>
                    {schedule.memo && (
                      <span className="mt-1 block truncate text-xs text-on-surface-variant">{schedule.memo}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={() => setScheduleModal(null)}
        className="absolute bottom-4 right-4 z-20 flex h-12 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-bold text-white shadow-2xl active:scale-95"
        aria-label="새 일정"
      >
        <Plus className="h-5 w-5" />
        <span>새 일정</span>
      </button>

      {scheduleModal !== undefined && (
        <ScheduleFormModal
          schedule={scheduleModal}
          initialDateString={selectedDateString}
          onSave={saveSchedule}
          onDelete={scheduleModal ? (scheduleId) => {
            onDeleteSchedule(scheduleId);
            setScheduleModal(undefined);
          } : undefined}
          onClose={() => setScheduleModal(undefined)}
        />
      )}
    </div>
  );
}
