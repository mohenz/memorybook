import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import CalendarView, { clampDayToMonth } from './CalendarView';
import { Note, Schedule, TodoItem } from '../types';

const renderCalendar = (date: Date, schedules: Schedule[] = [], notes: Note[] = [], todos: TodoItem[] = []) => {
  vi.setSystemTime(date);
  return renderToStaticMarkup(
    <CalendarView
      notes={notes}
      schedules={schedules}
      todos={todos}
      groups={[]}
      onSelectNote={() => undefined}
      onAddNote={() => undefined}
      onAddSchedule={() => undefined}
      onUpdateSchedule={() => undefined}
      onDeleteSchedule={() => undefined}
    />
  );
};

describe('CalendarView current date', () => {
  afterEach(() => vi.useRealTimers());

  it('uses the fixed 18px period title in the single-line toolbar', () => {
    vi.useFakeTimers();
    const markup = renderCalendar(new Date(2026, 6, 14, 12));

    expect(markup).toContain(
      'class="w-[22rem] shrink-0 whitespace-nowrap font-sans text-[18px] font-bold tabular-nums text-on-background">2026년 7월',
    );
  });

  it.each([
    [new Date(2026, 0, 1, 12), '2026년 1월', '1월 1일'],
    [new Date(2026, 1, 28, 12), '2026년 2월', '2월 28일'],
    [new Date(2028, 1, 29, 12), '2028년 2월', '2월 29일'],
    [new Date(2026, 6, 14, 12), '2026년 7월', '7월 14일'],
    [new Date(2026, 11, 31, 12), '2026년 12월', '12월 31일'],
  ])('uses the system date %#', (date, monthLabel, dayLabel) => {
    vi.useFakeTimers();
    const markup = renderCalendar(date);

    expect(markup).toContain(monthLabel);
    expect(markup).toContain(dayLabel);
  });
});

describe('CalendarView selected-day panel', () => {
  it('shows selected-date creation controls with the schedules and notes', () => {
    vi.useFakeTimers();
    const markup = renderCalendar(new Date(2026, 6, 23, 12), [], [{
      id: 'note-1',
      title: '인터뷰 회의록',
      content: '요구사항 정리',
      groupId: 'personal',
      createdAt: '2026년 7월 23일',
      updatedAt: '2026년 7월 23일',
      dateString: '2026-07-23',
      isFavorite: false,
      isDeleted: false,
      images: [],
      checklist: [],
    }]);

    expect(markup).toContain('>일정<');
    expect(markup).toContain('>메모<');
    expect(markup).toContain('인터뷰 회의록');
    expect(markup).toContain('일정 추가');
    expect(markup).toContain('메모 추가');
    expect(markup).not.toContain('캘린더 메모 검색');

    vi.useRealTimers();
  });

  it('places the schedule time before its title', () => {
    vi.useFakeTimers();
    const markup = renderCalendar(new Date(2026, 6, 23, 12), [{
      id: 'schedule-1',
      title: '이마트앱팀 미팅',
      dateString: '2026-07-23',
      allDay: false,
      startTime: '13:00',
      endTime: '15:00',
      priority: 'high',
      createdAt: '2026-07-23T00:00:00.000Z',
      updatedAt: '2026-07-23T00:00:00.000Z',
    }]);

    const scheduleContent = markup.match(
      /aria-label="13:00–15:00 이마트앱팀 미팅"[^>]*>(.*?)<\/button>/,
    )?.[1];

    expect(scheduleContent).toBeDefined();
    expect(scheduleContent!.indexOf('13:00–15:00')).toBeLessThan(
      scheduleContent!.indexOf('이마트앱팀 미팅'),
    );
    expect(markup).toContain(
      'class="text-[10px] font-semibold tabular-nums shrink-0 text-on-surface-variant">13:00',
    );
    expect(markup).toContain(
      'class="text-xs font-bold truncate min-w-0 text-error">이마트앱팀 미팅',
    );

    vi.useRealTimers();
  });

  it('shows date-linked todos below schedules in the selected-day panel', () => {
    vi.useFakeTimers();
    const markup = renderCalendar(new Date(2026, 6, 23, 12), [], [], [{
      id: 'todo-1',
      text: '요구사항 확인',
      status: 'in_progress' as const,
      createdDateString: '2026-07-22',
      targetDateString: '2026-07-23',
      createdAt: '2026-07-22T00:00:00.000Z',
      updatedAt: '2026-07-22T00:00:00.000Z',
    }]);

    expect(markup.indexOf('>일정<')).toBeLessThan(markup.indexOf('>TO-DO<'));
    expect(markup.indexOf('>TO-DO<')).toBeLessThan(markup.indexOf('>메모<'));
    expect(markup).toContain('요구사항 확인');
    expect(markup).toContain('>진행<');
    expect(markup).toContain('목표 2026-07-23');
    vi.useRealTimers();
  });

  it('shows the requested empty message when the selected date has no active due todos', () => {
    vi.useFakeTimers();
    const markup = renderCalendar(new Date(2026, 6, 23, 12));
    expect(markup).toContain('오늘 예정 및 진행인 할일이 없습니다');
    vi.useRealTimers();
  });

  it('shows incomplete past-target todos as delayed', () => {
    vi.useFakeTimers();
    const markup = renderCalendar(new Date(2026, 6, 23, 12), [], [], [{
      id: 'todo-overdue',
      text: '지연된 확인 작업',
      status: 'in_progress',
      createdDateString: '2026-07-20',
      targetDateString: '2026-07-22',
      createdAt: '2026-07-20T00:00:00.000Z',
      updatedAt: '2026-07-20T00:00:00.000Z',
    }]);

    expect(markup).toContain('지연된 확인 작업');
    expect(markup).toContain('>지연<');
    expect(markup).toContain('bg-error/10 text-error');
    vi.useRealTimers();
  });

  it('shows a weekly schedule on each configured weekday', () => {
    vi.useFakeTimers();
    const markup = renderCalendar(new Date(2026, 6, 23, 12), [{
      id: 'weekly-schedule',
      title: '주간 정기 미팅',
      dateString: '2026-07-21',
      allDay: false,
      startTime: '09:30',
      endTime: '10:30',
      priority: 'normal',
      recurrence: { frequency: 'weekly', weekdays: ['TU', 'TH'] },
      createdAt: '2026-07-21T00:00:00.000Z',
      updatedAt: '2026-07-21T00:00:00.000Z',
    }]);

    expect(markup).toContain('aria-label="09:30–10:30 주간 정기 미팅"');

    vi.useRealTimers();
  });
});

describe('CalendarView month navigation', () => {
  it('keeps the selected day when it exists in the target month', () => {
    expect(clampDayToMonth(15, 2026, 7)).toBe(15);
  });

  it('clamps the selected day for a shorter target month', () => {
    expect(clampDayToMonth(31, 2026, 1)).toBe(28);
  });

  it('keeps leap day in a leap year', () => {
    expect(clampDayToMonth(29, 2028, 1)).toBe(29);
  });
});

describe('CalendarView toolbar layout', () => {
  it('places the view controls before schedule search', () => {
    vi.useFakeTimers();
    const markup = renderCalendar(new Date(2026, 6, 23, 12));

    expect(markup.indexOf('캘린더 보기 방식')).toBeLessThan(markup.indexOf('캘린더 일정 검색'));
    expect(markup).toContain('<select aria-label="캘린더 보기 방식"');
    expect(markup).toContain('<option value="week">주간</option>');
    expect(markup).toContain('<option value="day">일간</option>');
    expect(markup).toContain('<option value="month" selected="">월간</option>');
    expect(markup).toContain('<option value="year">연간</option>');
    expect(markup).toContain('<option value="agenda">일정</option>');
    expect(markup.indexOf('value="week"')).toBeLessThan(markup.indexOf('value="day"'));
    expect(markup.indexOf('value="day"')).toBeLessThan(markup.indexOf('value="month"'));
    expect(markup.indexOf('value="month"')).toBeLessThan(markup.indexOf('value="year"'));
    expect(markup.indexOf('value="year"')).toBeLessThan(markup.indexOf('value="agenda"'));

    vi.useRealTimers();
  });
});

describe('CalendarView Korean holidays', () => {
  it('renders an official public holiday on the selected date', () => {
    vi.useFakeTimers();
    const markup = renderCalendar(new Date(2026, 6, 17, 12));

    expect(markup).toContain('제헌절');
    expect(markup).toContain('대한민국 국경일 및 공휴일');

    vi.useRealTimers();
  });
});
