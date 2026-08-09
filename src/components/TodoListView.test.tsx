import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import TodoListView from './TodoListView';

describe('TodoListView', () => {
  it('renders an independent todo form with a target date and remaining days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 9, 12));
    const markup = renderToStaticMarkup(
      <TodoListView
        todos={[{
          id: 'todo-1',
          text: '가까운 항목',
          status: 'in_progress',
          createdDateString: '2026-08-09',
          targetDateString: '2026-08-10',
          createdAt: '2026-08-09T00:00:00.000Z',
          updatedAt: '2026-08-09T00:00:00.000Z',
        }, {
          id: 'todo-2',
          text: '먼 항목',
          status: 'in_progress',
          createdDateString: '2026-08-09',
          targetDateString: '2026-08-20',
          createdAt: '2026-08-09T01:00:00.000Z',
          updatedAt: '2026-08-09T01:00:00.000Z',
        }]}
        onAddItem={() => undefined}
        onUpdateItem={() => undefined}
        onDeleteItem={() => undefined}
        onSetItemStatus={() => undefined}
      />
    );

    expect(markup).toContain('aria-label="할 일 내용"');
    expect(markup).toContain('aria-label="목표일"');
    expect(markup).toContain('가까운 항목');
    expect(markup).toContain('D-1');
    expect(markup).toContain('가까운 항목 수정');
    expect(markup).toContain('가까운 항목 삭제');
    expect(markup.indexOf('가까운 항목')).toBeLessThan(markup.indexOf('먼 항목'));
    vi.useRealTimers();
  });
});
