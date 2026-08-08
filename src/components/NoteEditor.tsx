import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  ArrowLeft, 
  Clipboard,
  Save, 
  Image as ImageIcon, 
  MoreVertical, 
  Plus, 
  X, 
  Upload,
  PlusCircle, 
  CheckSquare, 
  Trash2,
  FolderOpen
} from 'lucide-react';
import { Note, Group, ChecklistItem } from '../types';
import { PREMIUM_IMAGES } from '../data';
import GroupButtonSelector from './GroupButtonSelector';

interface NoteEditorProps {
  note: Note | null; // null if creating a new note
  groups: Group[];
  onSave: (noteData: Partial<Note>) => void;
  onAutoSave?: (noteData: Partial<Note>) => void;
  onUploadImage?: (file: File) => Promise<string>;
  onCancel: () => void;
}

export default function NoteEditor({
  note,
  groups,
  onSave,
  onAutoSave,
  onUploadImage,
  onCancel
}: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [groupId, setGroupId] = useState(note?.groupId || groups[0]?.id || 'personal');
  const [images, setImages] = useState<string[]>(note?.images || []);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(note?.checklist || []);
  const [newTodoText, setNewTodoText] = useState('');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const initialSnapshotRef = useRef('');
  const lastAutoSavedSnapshotRef = useRef('');

  const buildNotePayload = (): Partial<Note> => ({
    title: title.trim() || '제목 없는 메모',
    content: content,
    groupId: groupId,
    images: images,
    checklist: checklist,
    updatedAt: new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) + ' ' + new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  });

  const autoSaveSnapshot = useMemo(() => JSON.stringify({
    title,
    content,
    groupId,
    images,
    checklist
  }), [title, content, groupId, images, checklist]);

  useEffect(() => {
    initialSnapshotRef.current = autoSaveSnapshot;
    lastAutoSavedSnapshotRef.current = autoSaveSnapshot;
  }, [note?.id]);

  useEffect(() => {
    if (!onAutoSave) return;
    if (autoSaveSnapshot === initialSnapshotRef.current) return;
    if (autoSaveSnapshot === lastAutoSavedSnapshotRef.current) return;
    if (!title.trim() && !content.trim() && checklist.length === 0 && images.length === 0) return;

    const timer = window.setTimeout(() => {
      lastAutoSavedSnapshotRef.current = autoSaveSnapshot;
      onAutoSave(buildNotePayload());
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [autoSaveSnapshot, onAutoSave, title, content, groupId, images, checklist]);

  const handleSave = () => {
    onSave(buildNotePayload());
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoText.trim()) {
      const newItem: ChecklistItem = {
        id: 'todo-' + Date.now(),
        text: newTodoText.trim(),
        done: false
      };
      setChecklist(currentChecklist => [...currentChecklist, newItem]);
      setNewTodoText('');
    }
  };

  const handleRemoveTodo = (id: string) => {
    setChecklist(currentChecklist => currentChecklist.filter(item => item.id !== id));
  };

  const handleAddImage = (url: string) => {
    if (!images.includes(url)) {
      setImages(currentImages => [...currentImages, url]);
    }
    setShowImagePicker(false);
  };

  const handleUploadImageFile = async (file: File | undefined) => {
    if (!file) return;
    if (!onUploadImage) {
      setUploadStatus('자료실 계정 로그인 후 Supabase Storage에 업로드할 수 있습니다.');
      return;
    }

    setUploadStatus('자료실 Storage에 업로드하는 중입니다.');
    try {
      const url = await onUploadImage(file);
      handleAddImage(url);
      setUploadStatus('자료실 Storage에 업로드했습니다.');
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.');
    }
  };

  const buildClipboardImageFile = (blob: Blob) => {
    const extension = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
    return new File([blob], `clipboard-image-${Date.now()}.${extension}`, {
      type: blob.type || 'image/png'
    });
  };

  const uploadClipboardBlob = async (blob: Blob | null) => {
    if (!blob || !blob.type.startsWith('image/')) {
      setUploadStatus('클립보드에서 이미지 파일을 찾을 수 없습니다.');
      return;
    }

    await handleUploadImageFile(buildClipboardImageFile(blob));
  };

  const handleUploadClipboardImage = async () => {
    if (!navigator.clipboard?.read) {
      setUploadStatus('이 브라우저에서는 클립보드 이미지 읽기를 지원하지 않습니다. Ctrl+V 붙여넣기를 사용해 주세요.');
      return;
    }

    setUploadStatus('클립보드 이미지를 확인하는 중입니다.');
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          await uploadClipboardBlob(await item.getType(imageType));
          return;
        }
      }
      setUploadStatus('클립보드에서 이미지 파일을 찾을 수 없습니다.');
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : '클립보드 이미지를 읽지 못했습니다. 브라우저 권한을 확인해 주세요.');
    }
  };

  const handlePasteImage = async (event: React.ClipboardEvent<HTMLDivElement>) => {
    const pastedFiles = Array.from(event.clipboardData.files) as File[];
    const imageFile = pastedFiles.find(file => file.type.startsWith('image/'));
    if (imageFile) {
      event.preventDefault();
      await handleUploadImageFile(imageFile);
      return;
    }

    const pastedItems = Array.from(event.clipboardData.items) as DataTransferItem[];
    const imageItem = pastedItems.find(item => item.type.startsWith('image/'));
    if (imageItem) {
      event.preventDefault();
      await uploadClipboardBlob(imageItem.getAsFile());
    }
  };

  const handleRemoveImage = (url: string) => {
    setImages(currentImages => currentImages.filter(img => img !== url));
  };

  return (
    <section className="flex-1 bg-background flex flex-col overflow-hidden h-full relative">
      
      {/* Editor Top App Bar */}
      <header className="sticky top-0 w-full flex flex-col gap-3 px-4 md:px-6 py-3 z-20 bg-background/95 backdrop-blur-md border-b border-grid-line shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <div className="flex min-w-0 flex-1 items-center gap-4">
          <button 
            onClick={onCancel}
            className="hover:bg-surface-container rounded-full p-2 transition-all active:scale-95 text-on-surface"
            title="돌아가기 (취소)"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <input 
            type="text"
            className="bg-transparent border-none focus:outline-none focus:ring-0 font-sans text-lg md:text-xl font-bold text-on-background w-full max-w-lg placeholder:text-outline-variant"
            placeholder="제목을 입력하세요..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <GroupButtonSelector groups={groups} value={groupId} onChange={setGroupId} layout="wrap" />
            <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:brightness-115 active:scale-95 transition-all text-sm font-semibold shadow-soft cursor-pointer shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>저장</span>
          </button>

          <button 
            onClick={() => setShowImagePicker(true)}
            className="hover:bg-surface-container rounded-full p-2 transition-all text-on-surface-variant cursor-pointer"
            title="이미지 첨부"
          >
            <ImageIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Notebook Grid Canvas */}
      <div className="flex-1 overflow-y-auto custom-scrollbar notebook-grid p-3 md:p-4">
        <div className="w-full min-h-full max-w-none mx-auto space-y-6 bg-surface-container-lowest/80 backdrop-blur-xs p-5 md:p-8 rounded-xl border border-outline-variant/30 shadow-soft">
          
          {/* Core Content Textarea */}
          <textarea 
            className="w-full min-h-[40vh] md:min-h-[calc(100vh-360px)] bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-on-surface font-sans text-base leading-8 resize-y"
            placeholder="여기에 내용을 입력하세요..."
            style={{ lineHeight: '28px' }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {/* Inline Todo Checklist Builder */}
          <div className="border-t border-grid-line pt-6">
            <h4 className="font-bold text-sm text-on-surface mb-3 flex items-center gap-2 uppercase tracking-wide text-outline">
              <CheckSquare className="w-4.5 h-4.5 text-primary" />
              <span>할 일 / 체크리스트 등록</span>
            </h4>
            
            {/* Quick Checklist list */}
            {checklist.length > 0 && (
              <div className="flex flex-col gap-2 mb-4 pl-1">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-center justify-between group bg-surface rounded-xl px-3 py-2 border border-outline-variant/30">
                    <span className="text-sm text-on-surface-variant font-medium">
                      {item.text}
                    </span>
                    <button 
                      onClick={() => handleRemoveTodo(item.id)}
                      className="text-outline-variant hover:text-error transition-colors p-1 rounded-lg hover:bg-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Checklist Add Input */}
            <form onSubmit={handleAddTodo} className="flex gap-2">
              <input
                type="text"
                placeholder="새 일정을 입력하고 추가를 누르세요"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                className="flex-1 h-10 px-3 border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              />
              <button 
                type="submit"
                className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 h-10 rounded-xl transition-all font-semibold text-sm flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>추가</span>
              </button>
            </form>
          </div>

          {/* Attachments stay in the document flow so they never cover checklist controls. */}
          <div className="border-t border-grid-line pt-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-outline">
                <ImageIcon className="h-4.5 w-4.5 text-primary" />
                <span>파일 첨부</span>
              </h4>
              <span className="text-xs font-medium text-outline" aria-live="polite">
                {images.length}개
              </span>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface/70 p-3">
              <button
                type="button"
                onClick={() => setShowImagePicker(true)}
                className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-high text-primary transition-colors hover:border-primary hover:bg-surface-container-highest focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                title="이미지 추가"
                aria-label="첨부 이미지 추가"
              >
                <ImageIcon className="h-5 w-5 stroke-[1.5]" />
                <span className="mt-1 text-[10px] font-bold">첨부</span>
              </button>

              {images.length === 0 ? (
                <p className="flex-1 text-xs font-medium text-outline">
                  첨부된 사진이 없습니다. 필요할 때 이미지를 추가하세요.
                </p>
              ) : (
                <div className="flex flex-1 gap-3 overflow-x-auto py-1 no-scrollbar" aria-label="첨부 이미지 목록">
                  {images.map((imgUrl, index) => (
                    <div key={imgUrl} className="group relative shrink-0">
                      <img
                        src={imgUrl}
                        alt={`첨부 이미지 ${index + 1}`}
                        className="h-14 w-14 rounded-xl border border-outline-variant object-cover shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(imgUrl)}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-error text-white shadow-md transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2"
                        aria-label={`첨부 이미지 ${index + 1} 제거`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Premium Digital Stationery Asset Selector Modal */}
      {showImagePicker && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in-scale">
          <div
            className="bg-white p-6 rounded-xl w-[480px] max-w-[calc(100vw-2rem)] shadow-2xl border border-outline-variant flex flex-col gap-4"
            onPaste={handlePasteImage}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                <span>디지털 스테이셔너리 에셋 추가</span>
              </h3>
              <button 
                onClick={() => setShowImagePicker(false)}
                className="text-on-surface-variant hover:bg-surface rounded-full p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs text-on-surface-variant">
              이 메모와 어울리는 고해상도 디자인 라이브러리 일러스트를 선택하여 노트를 더욱 아름답게 장식하세요.
            </p>

            <label className="border-2 border-dashed border-outline-variant rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-primary cursor-pointer hover:bg-primary/5 transition-colors">
              <Upload className="w-5 h-5" />
              <span className="text-xs font-bold">자료실 Storage에 이미지 업로드</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleUploadImageFile(event.target.files?.[0])}
              />
            </label>
            <button
              type="button"
              onClick={handleUploadClipboardImage}
              className="border border-outline-variant rounded-xl p-4 flex items-center justify-center gap-2 text-primary hover:bg-primary/5 transition-colors font-bold text-xs"
              title="클립보드 이미지를 업로드합니다. Ctrl+V로도 붙여넣을 수 있습니다."
            >
              <Clipboard className="w-5 h-5" />
              <span>클립보드 이미지 업로드</span>
            </button>
            {uploadStatus && <p className="text-xs font-semibold text-primary">{uploadStatus}</p>}

            <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-[300px] p-1 custom-scrollbar">
              <button 
                onClick={() => handleAddImage(PREMIUM_IMAGES.jejuSunset)}
                className="border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:scale-[1.02] hover:border-primary transition-all text-left flex flex-col cursor-pointer"
              >
                <div className="h-16 w-full bg-cover bg-center" style={{ backgroundImage: `url(${PREMIUM_IMAGES.jejuSunset})` }} />
                <span className="p-1.5 text-[10px] font-bold text-on-surface-variant truncate">제주 노을 해변</span>
              </button>

              <button 
                onClick={() => handleAddImage(PREMIUM_IMAGES.jejuDesk)}
                className="border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:scale-[1.02] hover:border-primary transition-all text-left flex flex-col cursor-pointer"
              >
                <div className="h-16 w-full bg-cover bg-center" style={{ backgroundImage: `url(${PREMIUM_IMAGES.jejuDesk})` }} />
                <span className="p-1.5 text-[10px] font-bold text-on-surface-variant truncate">여행자 데스크</span>
              </button>

              <button 
                onClick={() => handleAddImage(PREMIUM_IMAGES.office)}
                className="border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:scale-[1.02] hover:border-primary transition-all text-left flex flex-col cursor-pointer"
              >
                <div className="h-16 w-full bg-cover bg-center" style={{ backgroundImage: `url(${PREMIUM_IMAGES.office})` }} />
                <span className="p-1.5 text-[10px] font-bold text-on-surface-variant truncate">미니멀 워크스페이스</span>
              </button>

              <button 
                onClick={() => handleAddImage(PREMIUM_IMAGES.gridPaper)}
                className="border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:scale-[1.02] hover:border-primary transition-all text-left flex flex-col cursor-pointer"
              >
                <div className="h-16 w-full bg-cover bg-center" style={{ backgroundImage: `url(${PREMIUM_IMAGES.gridPaper})` }} />
                <span className="p-1.5 text-[10px] font-bold text-on-surface-variant truncate">태블릿 펜 & 그리드</span>
              </button>

              <button 
                onClick={() => handleAddImage(PREMIUM_IMAGES.azureGradients)}
                className="border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:scale-[1.02] hover:border-primary transition-all text-left flex flex-col cursor-pointer"
              >
                <div className="h-16 w-full bg-cover bg-center" style={{ backgroundImage: `url(${PREMIUM_IMAGES.azureGradients})` }} />
                <span className="p-1.5 text-[10px] font-bold text-on-surface-variant truncate">아쿠아 그래디언트</span>
              </button>

              <button 
                onClick={() => handleAddImage(PREMIUM_IMAGES.moodBoard)}
                className="border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:scale-[1.02] hover:border-primary transition-all text-left flex flex-col cursor-pointer"
              >
                <div className="h-16 w-full bg-cover bg-center" style={{ backgroundImage: `url(${PREMIUM_IMAGES.moodBoard})` }} />
                <span className="p-1.5 text-[10px] font-bold text-on-surface-variant truncate">뮤티드 무드보드</span>
              </button>
            </div>

            <div className="border-t border-grid-line pt-3 flex flex-col gap-2">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider">직접 이미지 URL 입력</span>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  id="custom-img-url"
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 h-9 px-2 text-xs border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                />
                <button 
                  onClick={() => {
                    const el = document.getElementById('custom-img-url') as HTMLInputElement;
                    if (el && el.value.trim()) {
                      handleAddImage(el.value.trim());
                      el.value = '';
                    }
                  }}
                  className="bg-primary text-white text-xs px-3 rounded-lg hover:brightness-110 active:scale-95 transition-all font-semibold cursor-pointer"
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
