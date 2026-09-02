import { useState } from 'react';
import { X } from 'lucide-react';
import { TodoItem, TodoStatus } from '../types';
import { toLocalDateString } from '../utils/date';
import { getRemainingDayLabel } from '../utils/todos';
import TodoStatusControl from './TodoStatusControl';
import MemoryIcon from './MemoryIcon';

interface TodoItemCardProps {
  key?: string;
  todo: TodoItem;
  accentClass: string;
  onUpdate: (todoId: string, fields: Pick<TodoItem, 'text' | 'targetDateString'>) => void;
  onDelete: (todoId: string) => void;
  onSetStatus: (todoId: string, status: TodoStatus) => void;
}

export default function TodoItemCard({ todo, accentClass, onUpdate, onDelete, onSetStatus }: TodoItemCardProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(todo.text);
  const [targetDateString, setTargetDateString] = useState(todo.targetDateString || '');
  const remainingLabel = todo.targetDateString && todo.status !== 'done'
    ? getRemainingDayLabel(todo.targetDateString, toLocalDateString())
    : '';

  const save = () => {
    if (!text.trim()) return;
    onUpdate(todo.id, { text, targetDateString: targetDateString || undefined });
    setEditing(false);
  };

  const cancel = () => {
    setText(todo.text);
    setTargetDateString(todo.targetDateString || '');
    setEditing(false);
  };

  return (
    <article className={`rounded-xl border border-outline-variant border-l-4 ${accentClass} bg-surface-container-lowest p-4 shadow-soft`}>
      {editing ? (
        <div className="space-y-2">
          <input
            type="text"
            aria-label="할 일 내용 수정"
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="h-9 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="date"
            aria-label="목표일 수정"
            value={targetDateString}
            onChange={(event) => setTargetDateString(event.target.value)}
            className="h-9 w-full rounded-lg border border-outline-variant bg-surface px-3 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={cancel} className="flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container cursor-pointer">
              <X className="h-3.5 w-3.5" /> 취소
            </button>
            <button type="button" onClick={save} disabled={!text.trim()} className="flex h-8 items-center gap-1 rounded-lg bg-primary px-2.5 text-xs font-bold text-white disabled:opacity-40 cursor-pointer">
              <MemoryIcon name="completed" className="h-3.5 w-3.5" /> 저장
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <p className={`min-w-0 flex-1 text-sm font-semibold ${todo.status === 'done' ? 'line-through text-outline opacity-70' : 'text-on-surface'}`}>
              {todo.text}
            </p>
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" onClick={() => setEditing(true)} aria-label={`${todo.text} 수정`} className="rounded-lg p-1.5 text-outline hover:bg-surface-container hover:text-primary cursor-pointer">
                <MemoryIcon name="edit" className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('이 할 일을 삭제하시겠습니까?')) onDelete(todo.id);
                }}
                aria-label={`${todo.text} 삭제`}
                className="rounded-lg p-1.5 text-outline hover:bg-error/10 hover:text-error cursor-pointer"
              >
                <MemoryIcon name="delete" className="h-3.5 w-3.5" accentColor="currentColor" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-on-surface-variant">
            <span>등록 {todo.createdDateString}</span>
            {todo.targetDateString && (
              <span className="flex items-center gap-1">
                <MemoryIcon name="calendar" className="h-3.5 w-3.5" />
                목표 {todo.targetDateString}
              </span>
            )}
            {remainingLabel && (
              <span className={`rounded-full px-2 py-0.5 font-extrabold ${remainingLabel.includes('지남') ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
                {remainingLabel}
              </span>
            )}
          </div>
          <TodoStatusControl status={todo.status} onChange={(status) => onSetStatus(todo.id, status)} size="sm" />
        </div>
      )}
    </article>
  );
}
