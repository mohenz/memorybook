import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import AgendaCalendarScreen from './AgendaCalendarScreen';
import { Schedule } from '../../types';

const buildSchedule = (dateString: string, title: string): Schedule => ({
  id: `schedule-${dateString}`, title, dateString, allDay: true, priority: 'normal',
  createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z',
});

describe('AgendaCalendarScreen', () => {
  it('groups schedules and todos by date with their requested fields', () => {
    const markup = renderToStaticMarkup(
      <AgendaCalendarScreen
        selectedDate={new Date(2026, 7, 10, 12)}
        schedulesByDate={new Map([['2026-08-10', [{
          id: 'schedule-1', title: '주간회의', dateString: '2026-08-10', allDay: true,
          priority: 'normal', createdAt: '2026-08-09T00:00:00.000Z', updatedAt: '2026-08-09T00:00:00.000Z',
        }, {
          id: 'schedule-2', title: '시간회의', dateString: '2026-08-10', allDay: false,
          startTime: '10:00', endTime: '11:00', priority: 'normal',
          createdAt: '2026-08-09T00:00:00.000Z', updatedAt: '2026-08-09T00:00:00.000Z',
        }]]])}
        todos={[{
          id: 'todo-1', text: '회의자료 작성', status: 'in_progress', createdDateString: '2026-08-09',
          targetDateString: '2026-08-10', createdAt: '2026-08-09T00:00:00.000Z', updatedAt: '2026-08-09T00:00:00.000Z',
        }]}
        searchQuery=""
        onSelectSchedule={() => undefined}
      />
    );

    expect(markup).toContain('8월 10일');
    expect(markup).toContain('2026-08-10');
    expect(markup).toContain('>종일<');
    expect(markup.match(/>종일<\/span>/g)).toHaveLength(2);
    expect(markup).not.toContain('시간 일정');
    expect(markup).toContain('bg-primary/10 text-primary');
    expect(markup).toContain('주간회의');
    expect(markup).toContain('>진행<');
    expect(markup).toContain('bg-surface-container-high text-primary');
    expect(markup).toContain('회의자료 작성');
    expect(markup).toContain('목표일');
  });

  it('marks the section for today and exposes a scroll anchor on every day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 10, 12));

    const markup = renderToStaticMarkup(
      <AgendaCalendarScreen
        selectedDate={new Date(2026, 7, 10, 12)}
        schedulesByDate={new Map([
          ['2026-08-03', [buildSchedule('2026-08-03', '지난 회의')]],
          ['2026-08-10', [buildSchedule('2026-08-10', '오늘 회의')]],
        ])}
        todos={[]}
        searchQuery=""
        onSelectSchedule={() => undefined}
      />
    );

    expect(markup).toContain('data-agenda-date="2026-08-03"');
    expect(markup).toContain('data-agenda-date="2026-08-10"');
    expect(markup).toContain('aria-current="date"');
    expect(markup.match(/aria-current="date"/g)).toHaveLength(1);
    expect(markup).toContain('>오늘<');
    expect(markup).toContain('border-primary ring-2 ring-primary/30');

    vi.useRealTimers();
  });

  it('highlights high-priority schedules with the error color', () => {
    const highPrioritySchedule = {
      ...buildSchedule('2026-08-10', '중요 고객 미팅'),
      priority: 'high' as const,
    };
    const markup = renderToStaticMarkup(
      <AgendaCalendarScreen
        selectedDate={new Date(2026, 7, 10, 12)}
        schedulesByDate={new Map([['2026-08-10', [highPrioritySchedule]]])}
        todos={[]}
        searchQuery=""
        onSelectSchedule={() => undefined}
      />
    );

    expect(markup).toContain('data-schedule-priority="high"');
    expect(markup).toContain('border-l-4 border-error bg-error/10');
    expect(markup).toContain('text-error');
    expect(markup).toContain('중요 고객 미팅');
  });

  it('does not mark any section when today falls outside the shown month', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 2, 12));

    const markup = renderToStaticMarkup(
      <AgendaCalendarScreen
        selectedDate={new Date(2026, 7, 10, 12)}
        schedulesByDate={new Map([['2026-08-10', [buildSchedule('2026-08-10', '지난달 회의')]]])}
        todos={[]}
        searchQuery=""
        onSelectSchedule={() => undefined}
      />
    );

    expect(markup).toContain('지난달 회의');
    expect(markup).not.toContain('aria-current="date"');
    expect(markup).not.toContain('>오늘<');

    vi.useRealTimers();
  });
});
