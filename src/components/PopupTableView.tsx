import { PopupScheduleData, PopupScheduleOccurrence } from '../utils/scheduleFilter';
import SchedulePriorityBadge from './SchedulePriorityBadge';

function ScheduleList({ schedules }: { schedules: PopupScheduleOccurrence[] }) {
  if (!schedules.length) return <p className="py-5 text-center text-xs text-outline">일정 없음</p>;
  return (
    <ul className="space-y-2">
      {schedules.map((schedule) => (
        <li key={`${schedule.id}-${schedule.occurrenceDateString}`} className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-2.5">
          <div className="flex items-start justify-between gap-2">
            <strong className="text-xs text-on-surface">{schedule.title}</strong>
            <SchedulePriorityBadge priority={schedule.priority} />
          </div>
          <p className="mt-1 text-[11px] text-on-surface-variant">{schedule.allDay ? '종일' : `${schedule.startTime || ''}${schedule.endTime ? ` – ${schedule.endTime}` : ''}`}</p>
        </li>
      ))}
    </ul>
  );
}

function formatShortDate(value: string) {
  const [, month, day] = value.split('-');
  return `${Number(month)}/${Number(day)}`;
}

export default function PopupTableView({ data }: { data: PopupScheduleData }) {
  const columns = [
    { label: '리마인드 일정', schedules: data.reminders },
    { label: `오늘 (${formatShortDate(data.dates[0])})`, schedules: data.today },
    { label: `내일 (${formatShortDate(data.dates[1])})`, schedules: data.tomorrow },
    { label: `모레 (${formatShortDate(data.dates[2])})`, schedules: data.dayAfter },
  ];
  return (
    <div className="overflow-x-auto custom-scrollbar">
      <div className="grid min-w-[680px] grid-cols-4 divide-x divide-outline-variant/50 overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-low">
        {columns.map((column) => (
          <section key={column.label} className="min-w-0">
            <h3 className="border-b border-outline-variant/50 bg-surface-container-high px-3 py-2.5 text-center text-xs font-extrabold text-on-surface">{column.label}</h3>
            <div className="p-2"><ScheduleList schedules={column.schedules} /></div>
          </section>
        ))}
      </div>
    </div>
  );
}
