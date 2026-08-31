import React from 'react';
import { ArrowLeft, Download, Pencil } from 'lucide-react';
import { Group, Note, TodoItem, TodoStatus } from '../../types';
import { downloadMarkdownFile } from '../../utils/markdownExport';
import { renderMarkdownToHtml } from '../../utils/markdown';
import TodoItemCard from '../../components/TodoItemCard';

interface MobileNoteDetailScreenProps {
  note: Note | null;
  groups: Group[];
  todos: TodoItem[];
  onUpdateTodo: (todoId: string, fields: Pick<TodoItem, 'text' | 'targetDateString'>) => void;
  onDeleteTodo: (todoId: string) => void;
  onSetTodoStatus: (todoId: string, status: TodoStatus) => void;
  onBack: () => void;
  onEdit: () => void;
}

export default function MobileNoteDetailScreen({ note, groups, todos, onUpdateTodo, onDeleteTodo, onSetTodoStatus, onBack, onEdit }: MobileNoteDetailScreenProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="flex items-center justify-between h-14 px-2 border-b border-grid-line bg-background shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {note && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => downloadMarkdownFile(note, groups)}
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
              aria-label="Markdown 다운로드"
              title="다운로드"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="w-11 h-11 flex items-center justify-center rounded-full text-primary hover:bg-surface-container"
              aria-label="메모 수정"
              title="수정"
            >
              <Pencil className="w-5 h-5" />
            </button>
          </div>
        )}
      </header>

      {!note ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <p className="text-sm font-medium text-on-surface-variant text-center">메모를 선택해 주세요</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 py-5">
          <p className="text-xs text-outline mb-2">{note.updatedAt}</p>
          <h2 className="text-xl font-bold text-on-background mb-4 break-words">{note.title}</h2>
          <div
            className="prose prose-sm prose-slate max-w-none break-words text-sm leading-7 text-on-surface-variant"
            dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(note.content) }}
          />

          {note.images && note.images.length > 0 && (
            <div className="flex flex-col gap-3 mt-6">
              {note.images.map((imgUrl, index) => (
                <img
                  key={imgUrl + index}
                  src={imgUrl}
                  alt={`첨부 이미지 ${index + 1}`}
                  className="w-full rounded-xl border border-outline-variant object-cover"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
          )}

          {todos.length > 0 && (
            <section className="mt-6 space-y-3 border-t border-grid-line pt-4">
              <div>
                <h3 className="text-sm font-bold text-on-surface">이 날짜의 TO-DO</h3>
                <p className="mt-1 text-[11px] text-outline">등록일 또는 목표일이 메모 날짜와 같은 항목</p>
              </div>
              {todos.map(todo => (
                <TodoItemCard
                  key={todo.id}
                  todo={todo}
                  accentClass={todo.status === 'done' ? 'border-l-primary' : todo.status === 'in_progress' ? 'border-l-amber-400' : 'border-l-outline-variant'}
                  onUpdate={onUpdateTodo}
                  onDelete={onDeleteTodo}
                  onSetStatus={onSetTodoStatus}
                />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
