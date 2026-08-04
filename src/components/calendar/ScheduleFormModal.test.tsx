import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Schedule } from '../../types';
import ScheduleFormModal from './ScheduleFormModal';

const recurringSchedule: Schedule = {
  id: 'weekly-schedule',
  title: '정기 미팅',
  dateString: '2026-07-21',
  allDay: false,
  startTime: '09:30',
  endTime: '10:30',
  priority: 'normal',
  recurrence: {
    frequency: 'weekly',
    weekdays: ['TU', 'TH'],
    untilDateString: '2026-08-31',
  },
  createdAt: '',
  updatedAt: '',
};

describe('ScheduleFormModal weekly recurrence', () => {
  it('loads the saved weekdays and end date when editing a recurring schedule', () => {
    const markup = renderToStaticMarkup(
      <ScheduleFormModal
        schedule={recurringSchedule}
        initialDateString={recurringSchedule.dateString}
        onSave={() => undefined}
        onDelete={() => undefined}
        onClose={() => undefined}
      />
    );

    expect(markup).toContain('매주 반복');
    expect(markup).toContain('aria-label="화요일" aria-pressed="true"');
    expect(markup).toContain('aria-label="목요일" aria-pressed="true"');
    expect(markup).toContain('value="2026-08-31"');
    expect(markup).toContain('aria-label="반복 종료일 달력 열기"');
    expect(markup).toContain('수정과 삭제는 반복 일정 전체에 적용됩니다.');
  });

  it('starts a one-time schedule without weekday controls', () => {
    const markup = renderToStaticMarkup(
      <ScheduleFormModal
        schedule={null}
        initialDateString="2026-07-21"
        onSave={() => undefined}
        onClose={() => undefined}
      />
    );

    expect(markup).toContain('매주 반복');
    expect(markup).not.toContain('반복 요일');
    expect(markup).not.toContain('type="time"');
    expect(markup).toContain('role="group" aria-label="시작 시간"');
    expect(markup).toContain('role="group" aria-label="종료 시간"');
    expect(markup.match(/schedule-time-select/g)).toHaveLength(4);
    expect(markup).toContain('알림');

    const startMinuteOptions = markup.match(
      /<select aria-label="시작 시간 분"[^>]*>(.*?)<\/select>/,
    )?.[1];
    expect(startMinuteOptions).toBeDefined();
    expect(startMinuteOptions!.match(/<option/g)).toHaveLength(6);
    expect(startMinuteOptions).toContain('value="00"');
    expect(startMinuteOptions).toContain('value="10"');
    expect(startMinuteOptions).toContain('value="20"');
    expect(startMinuteOptions).toContain('value="30"');
    expect(startMinuteOptions).toContain('value="40"');
    expect(startMinuteOptions).toContain('value="50"');
    expect(startMinuteOptions).not.toContain('value="01"');
  });
});
