import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Group, Note } from '../../types';
import GroupButtonSelector from '../../components/GroupButtonSelector';

interface MobileNoteEditorScreenProps {
  note: Note | null; // null when creating a new note
  groups: Group[];
  onAutoSave: (fields: Partial<Note>) => void;
  onBack: () => void;
}

const AUTOSAVE_DELAY_MS = 1200;

function formatUpdatedAt() {
  return (
    new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) +
    ' ' +
    new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  );
}

export default function MobileNoteEditorScreen({ note, groups, onAutoSave, onBack }: MobileNoteEditorScreenProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [groupId, setGroupId] = useState(note?.groupId || groups[0]?.id || '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const lastSavedSnapshotRef = useRef('');

  const snapshot = useMemo(() => JSON.stringify({ title, content, groupId }), [title, content, groupId]);

  useEffect(() => {
    lastSavedSnapshotRef.current = snapshot;
    // Only re-sync the baseline when the underlying note identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.id]);

  const buildPayload = (): Partial<Note> => ({
    title: title.trim() || '제목 없는 메모',
    content,
    ...(groupId ? { groupId } : {}),
    updatedAt: formatUpdatedAt(),
  });

  useEffect(() => {
    if (snapshot === lastSavedSnapshotRef.current) return;
    if (!title.trim() && !content.trim()) return;

    setStatus('saving');
    const timer = window.setTimeout(() => {
      lastSavedSnapshotRef.current = snapshot;
      onAutoSave(buildPayload());
      setStatus('saved');
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);

  const handleBack = () => {
    if (snapshot !== lastSavedSnapshotRef.current && (title.trim() || content.trim())) {
      lastSavedSnapshotRef.current = snapshot;
      onAutoSave(buildPayload());
    }
    onBack();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="flex items-center justify-between h-14 px-2 border-b border-grid-line bg-background shrink-0">
        <button
          type="button"
          onClick={handleBack}
          className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 pr-2 min-w-0">
          <span className="text-xs font-semibold text-on-surface-variant shrink-0" aria-live="polite">
            {status === 'saving' ? '저장 중' : status === 'saved' ? '저장됨' : ''}
          </span>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 py-4 flex flex-col gap-3">
        <GroupButtonSelector groups={groups} value={groupId} onChange={setGroupId} layout="grid" />
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="제목을 입력하세요"
          className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-lg font-bold text-on-background placeholder:text-outline-variant"
        />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="내용을 입력하세요"
          className="flex-1 w-full bg-transparent border-none focus:outline-none focus:ring-0 resize-none text-sm leading-7 text-on-surface placeholder:text-outline-variant"
        />
      </div>
    </div>
  );
}
