import { ListTodo, FileText } from 'lucide-react';
import { Note, Group, TodoStatus } from '../types';
import { TODO_STATUS_LABELS, TODO_STATUS_ORDER, getItemStatus } from '../utils/todoStatus';
import TodoStatusControl from './TodoStatusControl';

interface TodoListViewProps {
  notes: Note[];
  groups: Group[];
  onSetItemStatus: (noteId: string, itemId: string, status: TodoStatus) => void;
  onSelectNote: (noteId: string) => void;
}

interface TodoCardData {
  noteId: string;
  noteTitle: string;
  groupName: string;
  itemId: string;
  text: string;
  status: TodoStatus;
}

const COLUMN_ACCENT: Record<TodoStatus, string> = {
  todo: 'border-outline-variant',
  in_progress: 'border-amber-400',
  done: 'border-primary',
};

export default function TodoListView({ notes, groups, onSetItemStatus, onSelectNote }: TodoListViewProps) {
  const cards: TodoCardData[] = notes
    .filter(note => !note.isDeleted)
    .flatMap(note =>
      (note.checklist || []).map(item => ({
        noteId: note.id,
        noteTitle: note.title || '제목 없는 메모',
        groupName: groups.find(g => g.id === note.groupId)?.name || '개인',
        itemId: item.id,
        text: item.text,
        status: getItemStatus(item),
      }))
    );

  const columns = TODO_STATUS_ORDER.map(status => ({
    status,
    items: cards.filter(c => c.status === status),
  }));

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
              전체 {cards.length}개 · 예정 {columns[0].items.length} · 진행 {columns[1].items.length} · 완료 {columns[2].items.length}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar px-4 md:px-10 py-6">
        {cards.length === 0 ? (
          <div className="max-w-6xl mx-auto flex flex-col items-center justify-center text-center py-24 text-on-surface-variant">
            <ListTodo className="w-10 h-10 mb-3 text-outline-variant" />
            <p className="text-sm font-semibold">등록된 할 일이 없습니다</p>
            <p className="text-xs text-outline mt-1">메모에 체크리스트를 추가하면 여기에 표시됩니다.</p>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
            {columns.map(({ status, items }) => (
              <div key={status} className="flex flex-col gap-3 min-h-0">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-bold text-on-surface">{TODO_STATUS_LABELS[status]}</h2>
                  <span className="text-[11px] font-bold text-outline bg-surface-container-high rounded-full px-2 py-0.5">
                    {items.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {items.length === 0 ? (
                    <div className="text-xs text-outline border border-dashed border-outline-variant rounded-xl py-8 text-center">
                      항목 없음
                    </div>
                  ) : (
                    items.map(card => (
                      <div
                        key={`${card.noteId}-${card.itemId}`}
                        onClick={() => onSelectNote(card.noteId)}
                        className={`bg-surface-container-lowest rounded-xl border-l-4 ${COLUMN_ACCENT[status]} border border-outline-variant hover:border-primary shadow-soft hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer p-4 flex flex-col gap-3`}
                      >
                        <p className={`text-sm font-semibold ${status === 'done' ? 'line-through text-outline opacity-70' : 'text-on-surface'}`}>
                          {card.text}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant font-semibold">
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{card.noteTitle}</span>
                          <span className="text-outline">·</span>
                          <span className="text-outline shrink-0">{card.groupName}</span>
                        </div>
                        <TodoStatusControl
                          status={card.status}
                          onChange={(next) => onSetItemStatus(card.noteId, card.itemId, next)}
                          size="sm"
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
