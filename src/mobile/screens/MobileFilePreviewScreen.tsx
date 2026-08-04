import React from 'react';
import { ArrowLeft, Download, ExternalLink, FileQuestion } from 'lucide-react';
import { formatBytes } from '../../archiveStore/core/fileTypes.js';
import { ArchiveFile } from './MobileFileListScreen';

interface MobileFilePreviewScreenProps {
  file: ArchiveFile;
  onBack: () => void;
}

const newTabMimeTypes = new Set(['application/pdf']);

export default function MobileFilePreviewScreen({ file, onBack }: MobileFilePreviewScreenProps) {
  const canOpenInNewTab = file.category === 'text' || newTabMimeTypes.has(file.mimeType || '');

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="flex items-center justify-between h-14 px-2 border-b border-grid-line bg-background shrink-0">
        <div className="flex items-center min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container shrink-0"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-on-surface truncate">{file.filename}</span>
        </div>

        {file.downloadUrl && (
          <a
            href={file.downloadUrl}
            download={file.filename}
            className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container shrink-0"
            aria-label="다운로드"
            title="다운로드"
          >
            <Download className="w-5 h-5" />
          </a>
        )}
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col items-center justify-center p-4 gap-4">
        {file.category === 'image' && file.downloadUrl ? (
          <img
            src={file.downloadUrl}
            alt={file.filename}
            className="max-w-full max-h-full object-contain rounded-xl"
          />
        ) : (
          <>
            <span className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-primary">
              <FileQuestion className="w-8 h-8" />
            </span>
            <div className="text-center">
              <p className="text-sm font-bold text-on-surface">{file.filename}</p>
              <p className="text-xs text-outline mt-1">{formatBytes(file.size)}</p>
            </div>
            {canOpenInNewTab && file.downloadUrl && (
              <a
                href={file.downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 h-11 px-4 rounded-xl bg-surface text-primary text-sm font-bold"
              >
                <ExternalLink className="w-4 h-4" />
                <span>새 탭에서 열기</span>
              </a>
            )}
            {file.downloadUrl && (
              <a
                href={file.downloadUrl}
                download={file.filename}
                className="flex items-center gap-2 h-11 px-4 rounded-xl bg-primary text-white text-sm font-bold"
              >
                <Download className="w-4 h-4" />
                <span>다운로드</span>
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}
