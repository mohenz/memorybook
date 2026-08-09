import React, { useState } from 'react';
import { 
  Edit, 
  Trash2, 
  Star, 
  CheckCircle,
  MoreVertical,
  FolderOpen,
  X,
  RotateCcw,
} from 'lucide-react';
import { Note, Group, TodoItem, TodoStatus } from '../types';
import TodoItemCard from './TodoItemCard';

interface NoteDetailProps {
  note: Note | null;
  groups: Group[];
  todos: TodoItem[];
  onEdit: () => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onUpdateTodo: (todoId: string, fields: Pick<TodoItem, 'text' | 'targetDateString'>) => void;
  onDeleteTodo: (todoId: string) => void;
  onSetTodoStatus: (todoId: string, status: TodoStatus) => void;
}

export default function NoteDetail({
  note,
  groups,
  todos,
  onEdit,
  onDelete,
  onRestore,
  onToggleFavorite,
  onUpdateTodo,
  onDeleteTodo,
  onSetTodoStatus,
}: NoteDetailProps) {
  const [selectedImage, setSelectedImage] = useState<{ url: string; index: number } | null>(null);

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background notebook-pattern p-8 text-center select-none">
        <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4 text-on-surface-variant animate-pulse">
          <FolderOpen className="w-8 h-8" />
        </div>
        <h3 className="font-sans text-lg font-bold text-on-surface mb-1">메모가 선택되지 않았습니다</h3>
        <p className="font-sans text-sm text-text-secondary max-w-xs">
          왼쪽 목록에서 메모를 선택하거나 오른쪽 아래의 추가(+) 버튼을 눌러 새 메모를 작성해 보세요.
        </p>
      </div>
    );
  }

  const groupName = groups.find(g => g.id === note.groupId)?.name || '개인';

  return (
    <section className="flex-1 flex flex-col relative overflow-hidden bg-background">
      
      {/* Top Header Controls / Writing Tools Overlay */}
      <div className="absolute top-4 right-4 md:right-8 flex items-center gap-2 z-20">
        {note.isDeleted ? (
          <button
            onClick={() => onRestore(note.id)}
            className="h-10 px-4 rounded-full bg-primary text-white flex items-center gap-2 hover:brightness-110 transition-all shadow-sm font-semibold text-sm"
            title="메모 복원"
          >
            <RotateCcw className="w-4 h-4" />
            복원
          </button>
        ) : (
          <>
            <button 
              onClick={() => onToggleFavorite(note.id)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                note.isFavorite 
                  ? 'bg-yellow-50 text-yellow-500 shadow-sm' 
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
              }`}
              title={note.isFavorite ? "중요 메모 해제" : "중요 메모 추가"}
            >
              <Star className={`w-5 h-5 ${note.isFavorite ? 'fill-current' : ''}`} />
            </button>

            <button 
              onClick={onEdit}
              className="w-10 h-10 rounded-full bg-surface-container-high text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
              title="수정하기"
            >
              <Edit className="w-5 h-5" />
            </button>
          </>
        )}

        <button 
          onClick={() => {
            if (confirm(note.isDeleted ? "이 메모를 영구 삭제하시겠습니까?" : "이 메모를 휴지통으로 이동하시겠습니까?")) {
              onDelete(note.id);
            }
          }}
          className="w-10 h-10 rounded-full bg-surface-container-high text-error flex items-center justify-center hover:bg-error hover:text-white transition-all shadow-sm"
          title={note.isDeleted ? "영구 삭제" : "휴지통으로 이동"}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Main Reading/Lined Canvas */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 md:p-12 notebook-pattern select-text">
        <div className="max-w-6xl mx-auto space-y-8 pt-12 md:pt-0">
          
          {/* Metadata & Title Block */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase">
                {groupName}
              </span>
              <span className="text-outline text-[10px] font-medium">
                최종 수정: {note.updatedAt}
              </span>
            </div>
            <h2 className="text-[22px] md:text-[28px] font-extrabold text-on-background leading-snug">
              {note.title}
            </h2>
          </div>

          {/* Body Content */}
          <div className="prose prose-slate max-w-none">
            <p className="text-base leading-8 text-on-surface-variant font-medium whitespace-pre-wrap">
              {note.content}
            </p>

            {/* Attached Image Grid (Hotlinks) */}
            {note.images && note.images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8">
                {note.images.map((imgUrl, index) => (
                  <div 
                    key={index} 
                    onClick={() => setSelectedImage({ url: imgUrl, index })}
                    className="group relative overflow-hidden rounded-xl shadow-soft aspect-video cursor-zoom-in border border-outline-variant"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedImage({ url: imgUrl, index });
                      }
                    }}
                    aria-label={`첨부 이미지 ${index + 1} 확대 보기`}
                  >
                    <img 
                      src={imgUrl} 
                      alt={`Attached document asset ${index + 1}`} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                  </div>
                ))}
              </div>
            )}

            {/* Checklist Section */}
            {todos.length > 0 && (
              <div className="space-y-4 my-6">
                <h4 className="font-bold text-base text-on-surface flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>이 날짜의 TO-DO</span>
                </h4>
                <p className="text-xs text-outline">메모 작성일과 TO-DO 등록일 또는 목표일이 같은 항목입니다.</p>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
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
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
          onClick={() => setSelectedImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`첨부 이미지 ${selectedImage.index + 1} 확대 보기`}
        >
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/95 text-on-surface flex items-center justify-center shadow-xl hover:bg-white transition-colors"
            title="닫기"
            aria-label="이미지 확대 보기 닫기"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={selectedImage.url}
            alt={`첨부 이미지 ${selectedImage.index + 1} 확대`}
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            referrerPolicy="no-referrer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
