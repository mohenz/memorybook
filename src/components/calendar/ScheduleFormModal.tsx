import { FormEvent, useRef, useState } from 'react';
import { Bell, CalendarDays, Trash2, X } from 'lucide-react';
import { Schedule, SchedulePriority, ScheduleRecurrence, ScheduleReminder } from '../../types';
import { PRIORITY_COLORS, PRIORITY_LABELS, PRIORITY_ORDER, SCHEDULE_INPUT_STEP_MINUTES, WEEKDAY_OPTIONS, minutesToTime, snapToStep, timeToMinutes, weekdayFromDateString } from './scheduleUtils';

export interface ScheduleDraft {
  title: string;
  dateString: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  priority: SchedulePriority;
  memo: string;
  recurrence: ScheduleRecurrence | null;
  reminder: ScheduleReminder | null;
}

interface ScheduleFormModalProps {
  schedule: Schedule | null; // null = 신규 등록
  initialDateString: string;
  initialStartTime?: string;
  onSave: (draft: ScheduleDraft) => void;
  onDelete?: (scheduleId: string) => void;
  onClose: () => void;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
const MINUTE_OPTIONS = Array.from(
  { length: 60 / SCHEDULE_INPUT_STEP_MINUTES },
  (_, index) => String(index * SCHEDULE_INPUT_STEP_MINUTES).padStart(2, '0'),
);

interface ScheduleTimeSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ScheduleTimeSelect({ label, value, onChange }: ScheduleTimeSelectProps) {
  const [hour = '00', minute = '00'] = value.split(':');

  return (
    <div
      role="group"
      aria-label={label}
      className="flex-1 min-w-0 h-11 px-2 border border-outline-variant rounded-xl focus-within:ring-2 focus-within:ring-primary text-sm text-on-surface bg-surface-container-low flex items-center gap-1"
    >
      <select
        aria-label={`${label} 시`}
        value={hour}
        onChange={(event) => onChange(`${event.target.value}:${minute}`)}
        className="schedule-time-select min-w-0 flex-1 h-full bg-transparent text-center focus:outline-none cursor-pointer"
      >
        {HOUR_OPTIONS.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <span className="text-outline font-bold">:</span>
      <select
        aria-label={`${label} 분`}
        value={minute}
        onChange={(event) => onChange(`${hour}:${event.target.value}`)}
        className="schedule-time-select min-w-0 flex-1 h-full bg-transparent text-center focus:outline-none cursor-pointer"
      >
        {MINUTE_OPTIONS.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function toDraft(schedule: Schedule | null, initialDateString: string, initialStartTime?: string): ScheduleDraft {
  if (schedule) {
    const startTime = snapToStep(
      schedule.startTime || initialStartTime || '09:00',
      SCHEDULE_INPUT_STEP_MINUTES,
    );
    const endTime = snapToStep(
      schedule.endTime || minutesToTime(timeToMinutes(initialStartTime || '09:00') + 60),
      SCHEDULE_INPUT_STEP_MINUTES,
    );
    return {
      title: schedule.title,
      dateString: schedule.dateString,
      allDay: schedule.allDay,
      startTime,
      endTime,
      priority: schedule.priority,
      memo: schedule.memo || '',
      recurrence: schedule.recurrence
        ? { ...schedule.recurrence, weekdays: [...schedule.recurrence.weekdays] }
        : null,
      reminder: schedule.reminder ? { ...schedule.reminder } : null,
    };
  }

  const startTime = snapToStep(initialStartTime || '09:00', SCHEDULE_INPUT_STEP_MINUTES);
  return {
    title: '',
    dateString: initialDateString,
    allDay: false,
    startTime,
    endTime: minutesToTime(timeToMinutes(startTime) + 60),
    priority: 'normal',
    memo: '',
    recurrence: null,
    reminder: null,
  };
}

export default function ScheduleFormModal({
  schedule,
  initialDateString,
  initialStartTime,
  onSave,
  onDelete,
  onClose,
}: ScheduleFormModalProps) {
  const [draft, setDraft] = useState<ScheduleDraft>(() => toDraft(schedule, initialDateString, initialStartTime));
  const [timeError, setTimeError] = useState<string | null>(null);
  const [recurrenceError, setRecurrenceError] = useState<string | null>(null);
  const recurrenceEndDateRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim()) return;

    if (!draft.allDay && timeToMinutes(draft.endTime) <= timeToMinutes(draft.startTime)) {
      setTimeError('종료 시간은 시작 시간보다 늦어야 합니다.');
      return;
    }

    if (draft.recurrence && draft.recurrence.weekdays.length === 0) {
      setRecurrenceError('반복할 요일을 한 개 이상 선택해 주세요.');
      return;
    }

    if (draft.recurrence?.untilDateString && draft.recurrence.untilDateString < draft.dateString) {
      setRecurrenceError('반복 종료일은 시작일과 같거나 이후여야 합니다.');
      return;
    }

    setTimeError(null);
    setRecurrenceError(null);
    onSave({ ...draft, title: draft.title.trim() });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[200] animate-fade-in-scale p-4">
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-form-title"
        className="bg-surface-container-lowest text-on-surface p-6 rounded-2xl w-96 max-w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl border border-outline-variant flex flex-col gap-4 select-text"
      >
        <div className="flex items-center justify-between">
          <h3 id="schedule-form-title" className="font-bold text-lg text-on-surface">
            {schedule ? '일정확인' : '새 일정'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="p-1.5 hover:bg-surface-container-high rounded-full text-on-surface-variant transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <input
          type="text"
          autoFocus
          required
          maxLength={80}
          aria-label="일정 제목"
          placeholder="일정 제목"
          value={draft.title}
          onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
          className="w-full h-11 px-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-medium text-on-surface placeholder:text-outline caret-primary bg-surface-container-low select-text"
        />

        <input
          type="date"
          required
          aria-label="일정 날짜"
          value={draft.dateString}
          onChange={(event) => setDraft((prev) => ({ ...prev, dateString: event.target.value }))}
          className="w-full h-11 px-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-on-surface bg-surface-container-low"
        />

        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3 space-y-3">
          <label className="flex items-center justify-between gap-3 text-sm font-semibold text-on-surface-variant cursor-pointer">
            <span>매주 반복</span>
            <input
              type="checkbox"
              checked={Boolean(draft.recurrence)}
              onChange={(event) => {
                setRecurrenceError(null);
                setDraft((prev) => ({
                  ...prev,
                  recurrence: event.target.checked
                    ? {
                        frequency: 'weekly',
                        weekdays: [prev.dateString ? weekdayFromDateString(prev.dateString) : 'MO'],
                      }
                    : null,
                }));
              }}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
          </label>

          {draft.recurrence && (
            <div className="space-y-3">
              <fieldset>
                <legend className="mb-2 text-xs font-bold text-on-surface-variant">반복 요일</legend>
                <div className="grid grid-cols-7 gap-1">
                  {WEEKDAY_OPTIONS.map((option) => {
                    const selected = draft.recurrence?.weekdays.includes(option.value) ?? false;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-label={`${option.label}요일`}
                        aria-pressed={selected}
                        onClick={() => {
                          setRecurrenceError(null);
                          setDraft((prev) => {
                            if (!prev.recurrence) return prev;
                            const weekdays = prev.recurrence.weekdays.includes(option.value)
                              ? prev.recurrence.weekdays.filter((weekday) => weekday !== option.value)
                              : [...prev.recurrence.weekdays, option.value];
                            return { ...prev, recurrence: { ...prev.recurrence, weekdays } };
                          });
                        }}
                        className={`h-8 rounded-lg text-xs font-bold transition-colors ${selected ? 'bg-primary text-white' : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high'}`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <label className="block text-xs font-bold text-on-surface-variant">
                반복 종료일 <span className="font-medium text-outline">(선택)</span>
                <div className="relative mt-1">
                  <input
                    ref={recurrenceEndDateRef}
                    type="date"
                    min={draft.dateString}
                    value={draft.recurrence.untilDateString || ''}
                    onChange={(event) => {
                      setRecurrenceError(null);
                      setDraft((prev) => prev.recurrence
                        ? {
                            ...prev,
                            recurrence: {
                              ...prev.recurrence,
                              untilDateString: event.target.value || undefined,
                            },
                          }
                        : prev);
                    }}
                    className="w-full h-10 pl-3 pr-10 border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm text-on-surface bg-surface-container-lowest"
                  />
                  <button
                    type="button"
                    aria-label="반복 종료일 달력 열기"
                    title="달력에서 반복 종료일 선택"
                    onClick={() => {
                      const input = recurrenceEndDateRef.current;
                      if (!input) return;
                      if (typeof input.showPicker === 'function') input.showPicker();
                      else input.focus();
                    }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    <CalendarDays className="w-4 h-4" />
                  </button>
                </div>
              </label>
              <p className="text-[11px] text-outline">수정과 삭제는 반복 일정 전체에 적용됩니다.</p>
            </div>
          )}
        </div>
        {recurrenceError && <p className="text-xs text-error font-semibold">{recurrenceError}</p>}

        <label className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant cursor-pointer">
          <input
            type="checkbox"
            checked={draft.allDay}
            onChange={(event) => setDraft((prev) => ({ ...prev, allDay: event.target.checked }))}
            className="w-4 h-4 accent-primary cursor-pointer"
          />
          종일(고정) — 시간 없이 하루 상단에 고정 표시
        </label>

        {!draft.allDay && (
          <div className="flex items-center gap-2">
            <ScheduleTimeSelect
              label="시작 시간"
              value={draft.startTime}
              onChange={(startTime) => setDraft((prev) => ({ ...prev, startTime }))}
            />
            <span className="text-outline text-sm">–</span>
            <ScheduleTimeSelect
              label="종료 시간"
              value={draft.endTime}
              onChange={(endTime) => setDraft((prev) => ({ ...prev, endTime }))}
            />
          </div>
        )}
        {timeError && <p className="text-xs text-error font-semibold">{timeError}</p>}

        <div className="flex items-center gap-2">
          {PRIORITY_ORDER.map((priority) => (
            <button
              key={priority}
              type="button"
              onClick={() => setDraft((prev) => ({ ...prev, priority }))}
              aria-pressed={draft.priority === priority}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                draft.priority === priority
                  ? `${PRIORITY_COLORS[priority].bg} ${PRIORITY_COLORS[priority].border} ${PRIORITY_COLORS[priority].text}`
                  : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[priority].dot}`} />
              {PRIORITY_LABELS[priority]}
            </button>
          ))}
        </div>

        <textarea
          aria-label="일정 메모"
          placeholder="메모 (선택)"
          rows={2}
          maxLength={300}
          value={draft.memo}
          onChange={(event) => setDraft((prev) => ({ ...prev, memo: event.target.value }))}
          className="w-full px-3 py-2 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-on-surface placeholder:text-outline bg-surface-container-low resize-none select-text"
        />

        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3 space-y-3">
          <label className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-on-surface-variant">
            <span className="flex items-center gap-2"><Bell className="h-4 w-4 text-primary" />알림</span>
            <input
              type="checkbox"
              checked={Boolean(draft.reminder?.enabled)}
              onChange={(event) => setDraft((prev) => ({
                ...prev,
                reminder: event.target.checked
                  ? (prev.reminder || { enabled: true, minutesBefore: 10, frequency: prev.recurrence ? 'weekly' : 'once' })
                  : null,
              }))}
              className="h-4 w-4 cursor-pointer accent-primary"
            />
          </label>

          {draft.reminder?.enabled && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-on-surface-variant">
                알림 시점
                <select
                  aria-label="일정 알림 시점"
                  value={draft.reminder.minutesBefore}
                  onChange={(event) => setDraft((prev) => prev.reminder ? ({ ...prev, reminder: { ...prev.reminder, minutesBefore: Number(event.target.value) as ScheduleReminder['minutesBefore'] } }) : prev)}
                  className="mt-1 h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value={10}>10분 전</option>
                  <option value={30}>30분 전</option>
                  <option value={60}>1시간 전</option>
                  <option value={1440}>전날</option>
                </select>
              </label>
              <label className="text-xs font-bold text-on-surface-variant">
                알림 빈도
                <select
                  aria-label="일정 알림 빈도"
                  value={draft.reminder.frequency}
                  onChange={(event) => setDraft((prev) => prev.reminder ? ({ ...prev, reminder: { ...prev.reminder, frequency: event.target.value as ScheduleReminder['frequency'] } }) : prev)}
                  className="mt-1 h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="once">한 번</option>
                  <option value="daily">매일</option>
                  <option value="weekly">매주</option>
                </select>
              </label>
            </div>
          )}
          <p className="text-[11px] text-outline">브라우저가 열려 있고 설정에서 알림을 허용한 동안 작동합니다.</p>
        </div>

        <div className="flex items-center justify-between gap-2 text-sm font-semibold">
          {schedule && onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (confirm('이 일정을 휴지통으로 이동하시겠습니까?')) onDelete(schedule.id);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-error hover:bg-error/10 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              휴지통으로 이동
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 hover:bg-surface-container-high rounded-xl text-on-surface-variant transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-soft"
            >
              저장
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
