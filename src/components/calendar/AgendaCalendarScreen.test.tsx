import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import AgendaCalendarScreen from './AgendaCalendarScreen';

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
});
