import { FormEvent, useState } from 'react';
import { ListTodo, Plus } from 'lucide-react';
import { TodoItem, TodoStatus } from '../types';
import { toLocalDateString } from '../utils/date';
import { TODO_STATUS_LABELS, TODO_STATUS_ORDER } from '../utils/todoStatus';
import { sortTodosByTargetProximity } from '../utils/todos';
import TodoItemCard from './TodoItemCard';

interface TodoListViewProps {
  todos: TodoItem[];
  onAddItem: (text: string, targetDateString: string) => void;
  onUpdateItem: (todoId: string, fields: Pick<TodoItem, 'text' | 'targetDateString'>) => void;
  onDeleteItem: (todoId: string) => void;
  onSetItemStatus: (todoId: string, status: TodoStatus) => void;
}

const COLUMN_ACCENT: Record<TodoStatus, string> = {
  todo: 'border-l-outline-variant',
  in_progress: 'border-l-amber-400',
  done: 'border-l-primary',
};

export default function TodoListView({ todos, onAddItem, onUpdateItem, onDeleteItem, onSetItemStatus }: TodoListViewProps) {
  const [newItemText, setNewItemText] = useState('');
  const [targetDateString, setTargetDateString] = useState(toLocalDateString());
  const columns = TODO_STATUS_ORDER.map(status => ({
    status,
    items: sortTodosByTargetProximity(todos.filter(todo => todo.status === status), toLocalDateString()),
  }));

  const handleAddItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = newItemText.trim();
    if (!text || !targetDateString) return;
    onAddItem(text, targetDateString);
    setNewItemText('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background select-none">
      <header className="sticky top-0 w-full z-20 bg-background/80 backdrop-blur-md px-4 md:px-10 py-5 md:py-6 border-b border-grid-line shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <span className="rounded-xl bg-primary/10 p-2 text-primary shrink-0">
            <ListTodo className="w-5 h-5" />
          </span>
          <div>
            <h1 className="font-sans text-xl font-bold text-on-surface">TO-DO LIST</h1>
            <p className="text-xs text-on-surface-variant">
              전체 {todos.length}개 · 예정 {columns[0].items.length} · 진행 {columns[1].items.length} · 완료 {columns[2].items.length}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar px-4 md:px-10 py-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {columns.map(({ status, items }) => (
            <section key={status} className="flex flex-col gap-3 min-h-0">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-bold text-on-surface">{TODO_STATUS_LABELS[status]}</h2>
                <span className="text-[11px] font-bold text-outline bg-surface-container-high rounded-full px-2 py-0.5">{items.length}</span>
              </div>

              {status === 'todo' && (
                <form onSubmit={handleAddItem} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3 shadow-soft">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      aria-label="할 일 내용"
                      placeholder="새 할 일을 입력하세요"
                      value={newItemText}
                      onChange={(event) => setNewItemText(event.target.value)}
                      className="h-9 min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface px-3 text-xs font-medium text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button type="submit" disabled={!newItemText.trim() || !targetDateString} className="flex h-9 shrink-0 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-bold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer">
                      <Plus className="h-3.5 w-3.5" /> 추가
                    </button>
                  </div>
                  <label className="mt-2 flex items-center gap-2 text-[11px] font-bold text-on-surface-variant">
                    <span className="shrink-0">목표일</span>
                    <input
                      type="date"
                      aria-label="목표일"
                      required
                      value={targetDateString}
                      onChange={(event) => setTargetDateString(event.target.value)}
                      className="h-8 min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface px-2 text-[11px] font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </label>
                </form>
              )}

              <div className="flex flex-col gap-3">
                {items.length === 0 ? (
                  <div className="text-xs text-outline border border-dashed border-outline-variant rounded-xl py-8 text-center">항목 없음</div>
                ) : items.map(todo => (
                  <TodoItemCard
                    key={todo.id}
                    todo={todo}
                    accentClass={COLUMN_ACCENT[status]}
                    onUpdate={onUpdateItem}
                    onDelete={onDeleteItem}
                    onSetStatus={onSetItemStatus}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
