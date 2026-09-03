import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  MoreVertical,
} from 'lucide-react';
import { Note, Group } from '../types';
import GroupButtonSelector from './GroupButtonSelector';
import MarkdownToolbar from './MarkdownToolbar';
import MemoryIcon from './MemoryIcon';

interface NoteEditorProps {
  note: Note | null; // null if creating a new note
  groups: Group[];
  onSave: (noteData: Partial<Note>) => void;
  onAutoSave?: (noteData: Partial<Note>) => void;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export default function NoteEditor({
  note,
  groups,
  onSave,
  onAutoSave,
  onCancel,
  onDirtyChange,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [groupId, setGroupId] = useState(note?.groupId || groups[0]?.id || 'personal');
  const images = note?.images || [];
  const initialSnapshotRef = useRef('');
  const lastAutoSavedSnapshotRef = useRef('');
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const buildNotePayload = (): Partial<Note> => ({
    title: title.trim() || '제목 없는 메모',
    content: content,
    groupId: groupId,
    images: images,
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
  }), [title, content, groupId, images]);

  useEffect(() => {
    initialSnapshotRef.current = autoSaveSnapshot;
    lastAutoSavedSnapshotRef.current = autoSaveSnapshot;
    onDirtyChange?.(false);
  }, [note?.id]);

  useEffect(() => {
    onDirtyChange?.(autoSaveSnapshot !== initialSnapshotRef.current);
  }, [autoSaveSnapshot, onDirtyChange]);

  useEffect(() => {
    if (!onAutoSave) return;
    if (autoSaveSnapshot === initialSnapshotRef.current) return;
    if (autoSaveSnapshot === lastAutoSavedSnapshotRef.current) return;
    if (!title.trim() && !content.trim() && images.length === 0) return;

    const timer = window.setTimeout(() => {
      lastAutoSavedSnapshotRef.current = autoSaveSnapshot;
      onAutoSave(buildNotePayload());
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [autoSaveSnapshot, onAutoSave, title, content, groupId, images]);

  const handleSave = () => {
    onSave(buildNotePayload());
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
            <MemoryIcon name="completed" className="w-4 h-4" />
            <span>저장</span>
          </button>
          </div>
        </div>
      </header>

      {/* Main Notebook Grid Canvas */}
      <div className="flex-1 overflow-y-auto custom-scrollbar notebook-grid p-3 md:p-4">
        <div className="w-full min-h-full max-w-none mx-auto space-y-6 bg-surface-container-lowest/80 backdrop-blur-xs p-5 md:p-8 rounded-xl border border-outline-variant/30 shadow-soft">
          
          {/* Core Content Textarea */}
          <MarkdownToolbar textareaRef={contentTextareaRef} value={content} onChange={setContent} />
          <textarea
            ref={contentTextareaRef}
            className="w-full min-h-[40vh] md:min-h-[calc(100vh-360px)] bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-on-surface font-sans text-base leading-8 resize-y"
            placeholder="여기에 내용을 입력하세요..."
            style={{ lineHeight: '28px' }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

        </div>
      </div>
    </section>
  );
}
