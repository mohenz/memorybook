import { Check } from 'lucide-react';
import { TodoStatus } from '../types';
import { TODO_STATUS_LABELS, TODO_STATUS_ORDER } from '../utils/todoStatus';

interface TodoStatusControlProps {
  status: TodoStatus;
  onChange: (status: TodoStatus) => void;
  size?: 'sm' | 'md';
}

const STATUS_ACTIVE_CLASS: Record<TodoStatus, string> = {
  todo: 'bg-surface-container-high text-on-surface-variant',
  in_progress: 'bg-amber-100 text-amber-700',
  done: 'bg-primary text-white shadow-soft',
};

export default function TodoStatusControl({ status, onChange, size = 'md' }: TodoStatusControlProps) {
  const padding = size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1 text-xs';
  return (
    <div
      className="flex items-center gap-1 bg-surface-container-lowest border border-outline-variant rounded-lg p-0.5 shrink-0"
      onClick={(e) => e.stopPropagation()}
    >
      {TODO_STATUS_ORDER.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={`flex items-center gap-1 rounded-md font-bold transition-colors cursor-pointer ${padding} ${
            status === s ? STATUS_ACTIVE_CLASS[s] : 'text-outline hover:bg-surface-container-high'
          }`}
        >
          {s === 'done' && status === 'done' && <Check className="w-3 h-3" />}
          {TODO_STATUS_LABELS[s]}
        </button>
      ))}
    </div>
  );
}
