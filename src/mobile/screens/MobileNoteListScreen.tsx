import React, { useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { Note } from '../../types';
import MobileEmptyState from '../components/MobileEmptyState';
import { stripMarkdown } from '../../utils/markdown';

interface MobileNoteListScreenProps {
  notes: Note[];
  onSelectNote: (id: string) => void;
  onAddNote: () => void;
  profileImage: string;
  onOpenSettings: () => void;
}

export default function MobileNoteListScreen({
  notes,
  onSelectNote,
  onAddNote,
  profileImage,
  onOpenSettings,
}: MobileNoteListScreenProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const visibleNotes = useMemo(() => {
    const activeNotes = notes
      .filter((note) => !note.isDeleted)
      .slice()
      .sort((a, b) => new Date(b.dateString).getTime() - new Date(a.dateString).getTime());

    const q = query.trim().toLowerCase();
    if (!q) return activeNotes;
    return activeNotes.filter(
      (note) => note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q)
    );
  }, [notes, query]);

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery('');
  };

  return (
    <div className="relative flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col overflow-hidden">
      <header className="flex h-14 min-w-0 shrink-0 items-center gap-2 overflow-hidden border-b border-grid-line bg-background px-4">
        {searchOpen ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="메모 검색"
              className="h-11 min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={closeSearch}
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
              aria-label="검색 닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={onOpenSettings}
              className="w-9 h-9 shrink-0 rounded-full overflow-hidden border border-outline-variant"
              aria-label="설정"
              title="설정"
            >
              <img src={profileImage} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </button>
            <h1 className="min-w-0 flex-1 truncate text-lg font-bold text-primary">MEMOry</h1>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-11 h-11 flex items-center justify-center rounded-full text-primary hover:bg-surface-container"
              aria-label="메모 검색"
            >
              <Search className="w-5 h-5 stroke-[2.5]" />
            </button>
          </>
        )}
      </header>

      <div className="custom-scrollbar min-h-0 min-w-0 w-full flex-1 overflow-x-hidden overflow-y-auto pb-20">
        {visibleNotes.length === 0 ? (
          <MobileEmptyState message={query.trim() ? '검색 결과가 없습니다' : '메모가 없습니다'} />
        ) : (
          <ul className="min-w-0 w-full max-w-full space-y-3 overflow-hidden p-3">
            {visibleNotes.map((note) => (
              <li key={note.id} className="min-w-0 w-full max-w-full overflow-hidden">
                <button
                  type="button"
                  onClick={() => onSelectNote(note.id)}
                  className="flex min-w-0 w-full max-w-full flex-col gap-1.5 overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-left shadow-soft transition-colors active:bg-surface-container"
                >
                  <time className="block w-full min-w-0 truncate text-[10px] font-semibold text-outline">
                    {note.createdAt || note.dateString}
                  </time>
                  <span className="block w-full min-w-0 truncate text-sm font-bold text-on-surface">{note.title}</span>
                  <span
                    className="block w-full min-w-0 break-words text-xs leading-5 text-on-surface-variant"
                    style={{
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 3,
                      overflow: 'hidden',
                    }}
                  >
                    {stripMarkdown(note.content)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

      </div>

      <button
        type="button"
        onClick={onAddNote}
        className="absolute bottom-4 right-4 z-20 flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-bold text-white shadow-2xl transition-transform active:scale-95"
        aria-label="새 메모 작성"
      >
        <Plus className="h-5 w-5" />
        <span>새 메모</span>
      </button>
    </div>
  );
}
