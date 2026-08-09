import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Schedule } from '../../types';
import YearCalendarScreen from './YearCalendarScreen';

describe('YearCalendarScreen', () => {
  it('renders twelve months and yearly schedule counts', () => {
    const schedule: Schedule = {
      id: 'schedule-1',
      title: '연간 계획',
      dateString: '2026-08-09',
      allDay: true,
      priority: 'normal',
      createdAt: '2026-08-01',
      updatedAt: '2026-08-01',
    };
    const schedulesByDate = new Map([[schedule.dateString, [schedule]]]);
    const markup = renderToStaticMarkup(
      <YearCalendarScreen
        selectedDate={new Date(2026, 7, 9)}
        schedulesByDate={schedulesByDate}
        onSelectMonth={() => undefined}
      />
    );

    expect(markup).toContain('aria-label="2026년 연간 캘린더"');
    expect(markup).toContain('aria-label="1월, 일정 0개, 월간 보기로 이동"');
    expect(markup).toContain('aria-label="8월, 일정 1개, 월간 보기로 이동"');
    expect(markup).toContain('aria-label="12월, 일정 0개, 월간 보기로 이동"');
  });
});
