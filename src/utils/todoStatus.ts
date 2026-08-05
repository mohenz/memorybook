import { ChecklistItem, TodoStatus } from '../types';

export const TODO_STATUS_ORDER: TodoStatus[] = ['todo', 'in_progress', 'done'];

export const TODO_STATUS_LABELS: Record<TodoStatus, string> = {
  todo: '예정',
  in_progress: '진행',
  done: '완료',
};

export function getItemStatus(item: ChecklistItem): TodoStatus {
  return item.status ?? (item.done ? 'done' : 'todo');
}
