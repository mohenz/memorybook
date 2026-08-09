import { Note, TodoItem } from '../types';
import { getItemStatus } from './todoStatus';

export function migrateLegacyChecklistItems(notes: Note[], existingTodos: TodoItem[] = []) {
  const todosById = new Map(existingTodos.map(todo => [todo.id, todo]));

  notes.forEach(note => {
    (note.checklist || []).forEach(item => {
      if (todosById.has(item.id)) return;
      todosById.set(item.id, {
        id: item.id,
        text: item.text,
        status: getItemStatus(item),
        createdDateString: note.dateString,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      });
    });
  });

  return {
    notes: notes.map(note => note.checklist?.length ? { ...note, checklist: [] } : note),
    todos: Array.from(todosById.values()),
  };
}

function dateToUtc(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

export function getRemainingDayLabel(targetDateString: string, todayDateString: string) {
  const dayDifference = Math.round((dateToUtc(targetDateString) - dateToUtc(todayDateString)) / 86_400_000);
  if (dayDifference === 0) return 'D-Day';
  if (dayDifference > 0) return `D-${dayDifference}`;
  return `${Math.abs(dayDifference)}일 지남`;
}

export function getTodosForDate(todos: TodoItem[], dateString: string) {
  return todos.filter(todo => (
    todo.createdDateString === dateString || todo.targetDateString === dateString
  ));
}

export function getOpenTodosWithTargetDate(todos: TodoItem[]) {
  return todos.filter(todo => (
    Boolean(todo.targetDateString)
    && (todo.status === 'todo' || todo.status === 'in_progress')
  ));
}

export function sortTodosByTargetProximity(todos: TodoItem[], todayDateString: string) {
  return [...todos].sort((left, right) => {
    if (!left.targetDateString && right.targetDateString) return 1;
    if (left.targetDateString && !right.targetDateString) return -1;
    if (left.targetDateString && right.targetDateString) {
      const today = dateToUtc(todayDateString);
      const leftDistance = Math.abs(dateToUtc(left.targetDateString) - today);
      const rightDistance = Math.abs(dateToUtc(right.targetDateString) - today);
      if (leftDistance !== rightDistance) return leftDistance - rightDistance;
      const targetDateDifference = left.targetDateString.localeCompare(right.targetDateString);
      if (targetDateDifference) return targetDateDifference;
    }
    return right.updatedAt.localeCompare(left.updatedAt) || right.createdAt.localeCompare(left.createdAt);
  });
}
