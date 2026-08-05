import React, { useState } from 'react';
import { 
  Edit, 
  Trash2, 
  Star, 
  CheckCircle, 
  Type, 
  Image as ImageIcon, 
  Paintbrush, 
  Mic, 
  Share2, 
  MoreVertical,
  FolderOpen,
  X,
  Download,
  RotateCcw,
} from 'lucide-react';
import { Note, Group, TodoStatus } from '../types';
import { downloadMarkdownFile } from '../utils/markdownExport';
import { getItemStatus } from '../utils/todoStatus';
import TodoStatusControl from './TodoStatusControl';

interface NoteDetailProps {
  note: Note | null;
  groups: Group[];
  onEdit: () => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onSetChecklistItemStatus: (noteId: string, itemId: string, status: TodoStatus) => void;
}

export default function NoteDetail({
  note,
  groups,
  onEdit,
  onDelete,
  onRestore,
  onToggleFavorite,
  onSetChecklistItemStatus
}: NoteDetailProps) {
  const [showShareToast, setShowShareToast] = useState(false);
  const [showFormatToast, setShowFormatToast] = useState(false);
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

  const handleShare = () => {
    // Mimic share behavior
    const shareUrl = `${window.location.origin}/notes/${note.id}`;
    navigator.clipboard?.writeText(shareUrl);
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2000);
  };

  const handleMarkdownDownload = () => {
    downloadMarkdownFile(note, groups);
  };

  const handleDrawing = () => {
    alert("그리기 모드: S-Pen 그리기 도구가 연결되었습니다. (데모 시뮬레이션: 격자 무늬 배경 위에서 필기가 활성화됩니다.)");
  };

  const handleVoice = () => {
    alert("음성 녹음: 메모에 첨부할 보이스 레코딩 세션이 시작되었습니다.");
  };

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
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                {groupName}
              </span>
              <span className="text-outline text-xs font-medium">
                최종 수정: {note.updatedAt}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-on-background leading-snug">
              {note.title}
            </h2>
          </div>

          {/* Body Content */}
          <div className="prose prose-slate max-w-none">
            <p className="text-lg leading-8 text-on-surface-variant font-medium whitespace-pre-wrap">
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
            {note.checklist && note.checklist.length > 0 && (
              <div className="space-y-4 my-6">
                <h4 className="font-bold text-lg text-on-surface flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>TO-DO LIST</span>
                </h4>
                <ul className="space-y-2 pl-1 border-l-4 border-primary/20">
                  {note.checklist.map((item) => {
                    const status = getItemStatus(item);
                    return (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-2 pl-4 py-1"
                      >
                        <span className={`text-base font-medium transition-all ${
                          status === 'done'
                            ? 'line-through text-outline font-normal opacity-60'
                            : 'text-on-surface-variant'
                        }`}>
                          {item.text}
                        </span>
                        <TodoStatusControl
                          status={status}
                          onChange={(next) => onSetChecklistItemStatus(note.id, item.id, next)}
                          size="sm"
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Bottom Toolbar Bar (own layout row, never overlaps the scroll area) */}
      <div className="relative shrink-0 flex justify-center px-4 py-3 md:py-4 bg-background/80 backdrop-blur-sm border-t border-outline-variant/50" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        {showShareToast && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-4 py-2 rounded-full shadow-lg font-semibold animate-fade-in-scale z-30 whitespace-nowrap">
            공유 링크가 클립보드에 복사되었습니다.
          </div>
        )}

        {showFormatToast && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-4 py-2 rounded-full shadow-lg font-semibold animate-fade-in-scale z-30 whitespace-nowrap">
            서식 도구: Manrope 폰트가 적용되었습니다.
          </div>
        )}

        <div className="bg-slate-950/95 text-slate-50 border border-white/10 px-4 md:px-6 py-3 rounded-xl flex items-center gap-4 md:gap-6 shadow-2xl backdrop-blur-md z-20">
          {!note.isDeleted && <button
            onClick={() => {
              setShowFormatToast(true);
              setTimeout(() => setShowFormatToast(false), 2000);
            }}
            className="flex flex-col items-center gap-1 text-slate-50 hover:text-primary-fixed-dim transition-colors cursor-pointer"
          >
            <Type className="w-5 h-5" />
            <span className="text-[10px] font-bold">서식</span>
          </button>}

          {!note.isDeleted && <button
            onClick={onEdit}
            className="flex flex-col items-center gap-1 text-slate-50 hover:text-primary-fixed-dim transition-colors cursor-pointer"
          >
            <ImageIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold">사진</span>
          </button>}

          <button
            onClick={handleDrawing}
            className="flex flex-col items-center gap-1 text-slate-50 hover:text-primary-fixed-dim transition-colors cursor-pointer"
          >
            <Paintbrush className="w-5 h-5" />
            <span className="text-[10px] font-bold">그리기</span>
          </button>

          <button
            onClick={handleVoice}
            className="flex flex-col items-center gap-1 text-slate-50 hover:text-primary-fixed-dim transition-colors cursor-pointer"
          >
            <Mic className="w-5 h-5" />
            <span className="text-[10px] font-bold">음성</span>
          </button>

          <div className="w-[1px] h-6 bg-white/20" />

          <button
            onClick={handleMarkdownDownload}
            className="flex flex-col items-center gap-1 text-slate-50 hover:text-primary-fixed-dim transition-colors cursor-pointer"
            title="Markdown 다운로드"
          >
            <Download className="w-5 h-5" />
            <span className="text-[10px] font-bold">다운로드</span>
          </button>

          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1 text-slate-50 hover:text-primary-fixed-dim transition-colors cursor-pointer"
          >
            <Share2 className="w-5 h-5" />
            <span className="text-[10px] font-bold">공유</span>
          </button>
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
