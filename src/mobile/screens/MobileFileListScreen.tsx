import React, { useMemo, useState } from 'react';
import {
  File as FileIcon,
  FileQuestion,
  FileText,
  Image as ImageIcon,
  Search,
  Upload,
  X,
} from 'lucide-react';
import MemoryIcon from '../../components/MemoryIcon';
import MobileEmptyState from '../components/MobileEmptyState';
import { formatBytes } from '../../archiveStore/core/fileTypes.js';

export interface ArchiveFile {
  id: string;
  filename: string;
  mimeType?: string;
  size: number;
  category: 'image' | 'text' | 'document' | 'other';
  downloadUrl?: string;
  uploadedAt?: { toDate?: () => Date } | null;
}

const categoryIcons: Record<string, React.ElementType> = {
  image: ImageIcon,
  text: FileText,
  document: FileIcon,
  other: FileQuestion,
};

function formatUploadedAt(file: ArchiveFile) {
  const date = file.uploadedAt?.toDate?.();
  if (!date) return '';
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

interface MobileFileListScreenProps {
  files: ArchiveFile[];
  loading: boolean;
  onSelectFile: (file: ArchiveFile) => void;
  onUploadFile: (file: File) => void;
  uploadingFile: File | null;
  uploadProgress: number;
  uploadFailed: boolean;
  onRetryUpload: () => void;
  profileImage: string;
  onOpenSettings: () => void;
}

export default function MobileFileListScreen({
  files,
  loading,
  onSelectFile,
  onUploadFile,
  uploadingFile,
  uploadProgress,
  uploadFailed,
  onRetryUpload,
  profileImage,
  onOpenSettings,
}: MobileFileListScreenProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const visibleFiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return files;
    return files.filter((file) => file.filename.toLowerCase().includes(q));
  }, [files, query]);

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery('');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
      <header className="flex items-center gap-2 h-14 px-4 border-b border-grid-line bg-background shrink-0">
        {searchOpen ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="파일 검색"
              className="flex-1 h-11 px-3 rounded-lg border border-outline-variant bg-surface text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
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
            <h1 className="flex-1 text-lg font-bold text-primary truncate">파일</h1>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-11 h-11 flex items-center justify-center rounded-full text-primary hover:bg-surface-container"
              aria-label="파일 검색"
            >
              <MemoryIcon name="search" className="w-5 h-5" />
            </button>
          </>
        )}
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-20">
        {!loading && visibleFiles.length === 0 ? (
          <MobileEmptyState message={query.trim() ? '검색 결과가 없습니다' : '파일이 없습니다'} />
        ) : (
          <ul>
            {visibleFiles.map((file) => {
              const Icon = categoryIcons[file.category] ?? FileQuestion;
              return (
                <li key={file.id} className="border-b border-grid-line last:border-b-0">
                  <button
                    type="button"
                    onClick={() => onSelectFile(file)}
                    className="w-full min-h-[64px] px-4 py-3 flex items-center gap-3 text-left active:bg-surface-container transition-colors"
                  >
                    <span className="w-10 h-10 shrink-0 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="flex-1 min-w-0 flex flex-col">
                      <span className="text-sm font-bold text-on-surface truncate">{file.filename}</span>
                      <span className="text-[11px] text-outline">
                        {formatBytes(file.size)} · {formatUploadedAt(file)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {uploadingFile && (
        <div className="absolute bottom-20 left-4 right-4 z-30 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-on-surface truncate">{uploadingFile.name}</span>
            <span className="text-[11px] font-semibold text-on-surface-variant shrink-0">
              {uploadFailed ? '업로드 실패' : '업로드 중'}
            </span>
          </div>
          {!uploadFailed && (
            <div className="h-1.5 rounded-full bg-surface-container overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(Math.max(uploadProgress, 0), 100)}%` }}
              />
            </div>
          )}
          {uploadFailed && (
            <button type="button" onClick={onRetryUpload} className="mt-1 text-xs font-bold text-primary">
              다시 시도
            </button>
          )}
        </div>
      )}

      <label
        className="absolute bottom-4 right-4 z-20 w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-2xl active:scale-95 transition-transform cursor-pointer"
        aria-label="파일 업로드"
      >
        <MemoryIcon name="upload" className="w-6 h-6" />
        <input
          type="file"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUploadFile(file);
            event.target.value = '';
          }}
        />
      </label>
    </div>
  );
}
