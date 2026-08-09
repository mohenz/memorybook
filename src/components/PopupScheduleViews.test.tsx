import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PopupScheduleData } from '../utils/scheduleFilter';
import PopupCardView from './PopupCardView';
import PopupTableView from './PopupTableView';

const data: PopupScheduleData = {
  reminders: [{
    id: 'schedule-1',
    title: '주간회의',
    dateString: '2026-08-03',
    occurrenceDateString: '2026-08-10',
    allDay: false,
    startTime: '10:00',
    endTime: '11:00',
    priority: 'normal',
    recurrence: { frequency: 'weekly', weekdays: ['MO'] },
    createdAt: '2026-08-03T00:00:00.000Z',
    updatedAt: '2026-08-03T00:00:00.000Z',
  }],
  today: [],
  tomorrow: [],
  dayAfter: [],
  dates: ['2026-08-10', '2026-08-11', '2026-08-12'],
};

describe('schedule popup reminder dates', () => {
  it('shows the actual occurrence date in table and card views', () => {
    const tableMarkup = renderToStaticMarkup(<PopupTableView data={data} />);
    const cardMarkup = renderToStaticMarkup(<PopupCardView data={data} />);

    expect(tableMarkup).toContain('8월 10일');
    expect(cardMarkup).toContain('2026년 8월 10일');
    expect(tableMarkup).toContain('10:00 – 11:00');
  });
});
