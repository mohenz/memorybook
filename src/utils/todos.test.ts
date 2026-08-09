import { describe, expect, it } from 'vitest';
import { Note, TodoItem } from '../types';
import { getOpenTodosWithTargetDate, getRemainingDayLabel, getTodosForDate, migrateLegacyChecklistItems, sortTodosByTargetProximity } from './todos';

const note: Note = {
  id: 'note-1', title: '기존 메모', content: '', groupId: 'personal',
  createdAt: '2026년 8월 9일', updatedAt: '2026년 8월 9일', dateString: '2026-08-09',
  isFavorite: false, isDeleted: false, images: [],
  checklist: [{ id: 'legacy-todo', text: '기존 할 일', done: false }],
};

const todo: TodoItem = {
  id: 'todo-1', text: '독립 할 일', status: 'todo', createdDateString: '2026-08-08',
  targetDateString: '2026-08-10', createdAt: '2026-08-08T00:00:00.000Z', updatedAt: '2026-08-08T00:00:00.000Z',
};

describe('independent todos', () => {
  it('migrates legacy note checklist items and clears note ownership', () => {
    const migrated = migrateLegacyChecklistItems([note], [todo]);
    expect(migrated.notes[0].checklist).toEqual([]);
    expect(migrated.todos).toEqual(expect.arrayContaining([
      todo,
      expect.objectContaining({ id: 'legacy-todo', createdDateString: '2026-08-09', status: 'todo' }),
    ]));
  });

  it('finds todos by either registration date or target date', () => {
    expect(getTodosForDate([todo], '2026-08-08')).toEqual([todo]);
    expect(getTodosForDate([todo], '2026-08-10')).toEqual([todo]);
    expect(getTodosForDate([todo], '2026-08-09')).toEqual([]);
  });

  it('shows every incomplete todo with a target date, including overdue items', () => {
    const scheduled = { ...todo, id: 'scheduled', status: 'todo' as const };
    const inProgress = { ...todo, id: 'progress', status: 'in_progress' as const };
    const completed = { ...todo, id: 'completed', status: 'done' as const };
    const future = { ...todo, id: 'future', targetDateString: '2026-08-12' };
    const past = { ...todo, id: 'past', targetDateString: '2026-08-09' };
    const noTarget = { ...todo, id: 'no-target', targetDateString: undefined };

    expect(getOpenTodosWithTargetDate([scheduled, inProgress, completed, future, past, noTarget]).map(item => item.id)).toEqual([
      'scheduled', 'progress', 'future', 'past',
    ]);
  });

  it('formats remaining and overdue days', () => {
    expect(getRemainingDayLabel('2026-08-10', '2026-08-09')).toBe('D-1');
    expect(getRemainingDayLabel('2026-08-09', '2026-08-09')).toBe('D-Day');
    expect(getRemainingDayLabel('2026-08-07', '2026-08-09')).toBe('2일 지남');
  });

  it('sorts todos by the target date closest to today', () => {
    const today = { ...todo, id: 'today', targetDateString: '2026-08-09' };
    const tomorrow = { ...todo, id: 'tomorrow', targetDateString: '2026-08-10' };
    const later = { ...todo, id: 'later', targetDateString: '2026-08-20' };
    const noTarget = { ...todo, id: 'no-target', targetDateString: undefined };

    expect(sortTodosByTargetProximity([later, noTarget, tomorrow, today], '2026-08-09').map(item => item.id)).toEqual([
      'today', 'tomorrow', 'later', 'no-target',
    ]);
  });
});
