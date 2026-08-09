import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PopupScheduleData, PopupScheduleOccurrence } from '../utils/scheduleFilter';
import SchedulePriorityBadge from './SchedulePriorityBadge';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
    .format(new Date(`${value}T12:00:00`));
}

export default function PopupCardView({ data }: { data: PopupScheduleData }) {
  const cards: Array<{ label: string; date?: string; showItemDate?: boolean; schedules: PopupScheduleOccurrence[] }> = [
    { label: '리마인드 일정', schedules: data.reminders, showItemDate: true },
    { label: '오늘', date: data.dates[0], schedules: data.today },
    { label: '내일', date: data.dates[1], schedules: data.tomorrow },
    { label: '모레', date: data.dates[2], schedules: data.dayAfter },
  ];
  const [index, setIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const move = (offset: number) => setIndex((current) => Math.max(0, Math.min(cards.length - 1, current + offset)));

  return (
    <div
      className="overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-low"
      onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)}
      onTouchEnd={(event) => {
        if (touchStart == null) return;
        const delta = event.changedTouches[0].clientX - touchStart;
        if (Math.abs(delta) > 45) move(delta < 0 ? 1 : -1);
        setTouchStart(null);
      }}
    >
      <div className="flex transition-transform duration-300 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
        {cards.map((card) => (
          <section key={card.label} className="w-full shrink-0 p-4">
            <div className="mb-4 flex items-center justify-between">
              <button type="button" aria-label="이전 카드" onClick={() => move(-1)} disabled={index === 0} className="rounded-full p-2 text-primary hover:bg-primary/10 disabled:opacity-25"><ChevronLeft className="h-5 w-5" /></button>
              <div className="text-center">
                <h3 className="text-sm font-extrabold text-on-surface">{card.label}{card.date ? ` · ${formatDate(card.date)}` : ''}</h3>
                <p className="mt-0.5 text-[10px] font-semibold text-outline">{index + 1}/{cards.length}</p>
              </div>
              <button type="button" aria-label="다음 카드" onClick={() => move(1)} disabled={index === cards.length - 1} className="rounded-full p-2 text-primary hover:bg-primary/10 disabled:opacity-25"><ChevronRight className="h-5 w-5" /></button>
            </div>
            {card.schedules.length ? (
              <ul className="min-h-40 space-y-2">
                {card.schedules.map((schedule) => (
                  <li key={`${schedule.id}-${schedule.occurrenceDateString}`} className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-lowest p-3 shadow-xs">
                    <div className="min-w-0">
                      <strong className="block truncate text-sm text-on-surface">{schedule.title}</strong>
                      <span className="text-xs text-on-surface-variant">
                        {card.showItemDate ? `${formatDate(schedule.occurrenceDateString)} · ` : ''}
                        {schedule.allDay ? '종일' : `${schedule.startTime || ''}${schedule.endTime ? ` – ${schedule.endTime}` : ''}`}
                      </span>
                    </div>
                    <SchedulePriorityBadge priority={schedule.priority} />
                  </li>
                ))}
              </ul>
            ) : <p className="flex min-h-40 items-center justify-center text-sm text-outline">표시할 일정이 없습니다.</p>}
          </section>
        ))}
      </div>
    </div>
  );
}
