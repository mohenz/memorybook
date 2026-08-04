import React, { useEffect, useMemo, useState } from 'react';
import { Group, Note, Schedule } from '../types';
import MobileBottomNav, { MobileTab } from './MobileBottomNav';
import MobileNoteListScreen from './screens/MobileNoteListScreen';
import MobileNoteDetailScreen from './screens/MobileNoteDetailScreen';
import MobileFileListScreen, { ArchiveFile } from './screens/MobileFileListScreen';
import MobileFilePreviewScreen from './screens/MobileFilePreviewScreen';
import MobileTrashScreen from './screens/MobileTrashScreen';
import CalendarView from '../components/CalendarView';
import { ScheduleDraft } from '../components/calendar/ScheduleFormModal';
import { useArchiveFiles } from '../archiveStore/features/archive/useArchiveFiles.js';
import { useArchiveMutations } from '../archiveStore/features/archive/useArchiveMutations.js';

type NoteView = 'LIST' | 'DETAIL';
type FileView = 'LIST' | 'PREVIEW';

// Non-terminal mutationStatus shapes produced by useArchiveMutations while an upload is running.
function isUploadInProgressStatus(status: string) {
  return status.endsWith('업로드 준비') || /\d+%$/.test(status);
}

interface MobileAppShellProps {
  notes: Note[];
  groups: Group[];
  schedules: Schedule[];
  selectedNote: Note | null;
  onSelectNote: (id: string) => void;
  onAddNote: () => void;
  onEditNote: (note: Note) => void;
  onAddSchedule: (draft: ScheduleDraft) => void;
  onUpdateSchedule: (scheduleId: string, draft: ScheduleDraft) => void;
  onDeleteSchedule: (scheduleId: string) => void;
  trashedSchedules?: Schedule[];
  onRestoreNote?: (noteId: string) => void;
  onPermanentlyDeleteNote?: (noteId: string) => void;
  onRestoreSchedule?: (scheduleId: string) => void;
  onPermanentlyDeleteSchedule?: (scheduleId: string) => void;
  userId: string;
  profileImage: string;
  onOpenSettings: () => void;
}

export default function MobileAppShell({
  notes,
  groups,
  schedules,
  selectedNote,
  onSelectNote,
  onAddNote,
  onEditNote,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  trashedSchedules = [],
  onRestoreNote = () => undefined,
  onPermanentlyDeleteNote = () => undefined,
  onRestoreSchedule = () => undefined,
  onPermanentlyDeleteSchedule = () => undefined,
  userId,
  profileImage,
  onOpenSettings,
}: MobileAppShellProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>('NOTES');
  const [noteView, setNoteView] = useState<NoteView>('LIST');
  const [fileView, setFileView] = useState<FileView>('LIST');
  const [selectedFile, setSelectedFile] = useState<ArchiveFile | null>(null);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadFailed, setUploadFailed] = useState(false);

  const { files, setFiles, usedBytes, loading, supabaseReady } = useArchiveFiles(userId, 'supabase');
  const mutations = useArchiveMutations({
    dataBackend: 'supabase',
    supabaseReady,
    selectedFile: null,
    setFiles,
    setSelectedFile: () => undefined,
    setSelectedIds: () => undefined,
    usedBytes,
    userId,
  });

  useEffect(() => {
    if (!uploadingFile) return;
    const status: string = mutations.mutationStatus;
    if (!status) return;

    if (status === '업로드 완료') {
      setUploadingFile(null);
      setUploadFailed(false);
      return;
    }

    if (!isUploadInProgressStatus(status)) {
      setUploadFailed(true);
    }
  }, [mutations.mutationStatus, uploadingFile]);

  const uploadProgress = useMemo(() => {
    if (!uploadingFile) return 0;
    const match = (mutations.mutationStatus as string).match(/(\d+)%$/);
    return match ? Number(match[1]) : 0;
  }, [mutations.mutationStatus, uploadingFile]);

  const handleSelectNote = (id: string) => {
    onSelectNote(id);
    setNoteView('DETAIL');
  };

  const handleSelectNoteFromCalendar = (id: string) => {
    onSelectNote(id);
    setActiveTab('NOTES');
    setNoteView('DETAIL');
  };

  const handleUploadFile = (file: File) => {
    setUploadingFile(file);
    setUploadFailed(false);
    mutations.handleFiles([file]);
  };

  const handleRetryUpload = () => {
    if (!uploadingFile) return;
    setUploadFailed(false);
    mutations.handleFiles([uploadingFile]);
  };

  const handleSelectFile = (file: ArchiveFile) => {
    setSelectedFile(file);
    setFileView('PREVIEW');
  };

  return (
    <div className="flex-1 flex min-h-0 min-w-0 w-full max-w-full flex-col overflow-hidden bg-background">
      {activeTab === 'NOTES' &&
        (noteView === 'LIST' ? (
          <MobileNoteListScreen
            notes={notes}
            onSelectNote={handleSelectNote}
            onAddNote={onAddNote}
            profileImage={profileImage}
            onOpenSettings={onOpenSettings}
          />
        ) : (
          <MobileNoteDetailScreen
            note={selectedNote}
            groups={groups}
            onBack={() => setNoteView('LIST')}
            onEdit={() => selectedNote && onEditNote(selectedNote)}
          />
        ))}

      {activeTab === 'CALENDAR' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center h-11 px-4 border-b border-grid-line bg-background shrink-0">
            <button
              type="button"
              onClick={onOpenSettings}
              className="w-9 h-9 shrink-0 rounded-full overflow-hidden border border-outline-variant"
              aria-label="설정"
              title="설정"
            >
              <img src={profileImage} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <CalendarView
              notes={notes}
              schedules={schedules}
              groups={groups}
              onSelectNote={handleSelectNoteFromCalendar}
              onAddSchedule={onAddSchedule}
              onUpdateSchedule={onUpdateSchedule}
              onDeleteSchedule={onDeleteSchedule}
            />
          </div>
        </div>
      )}

      {activeTab === 'FILES' &&
        (fileView === 'LIST' || !selectedFile ? (
          <MobileFileListScreen
            files={files}
            loading={loading}
            onSelectFile={handleSelectFile}
            onUploadFile={handleUploadFile}
            uploadingFile={uploadingFile}
            uploadProgress={uploadProgress}
            uploadFailed={uploadFailed}
            onRetryUpload={handleRetryUpload}
            profileImage={profileImage}
            onOpenSettings={onOpenSettings}
          />
        ) : (
          <MobileFilePreviewScreen file={selectedFile} onBack={() => setFileView('LIST')} />
        ))}

      {activeTab === 'TRASH' && (
        <MobileTrashScreen
          notes={notes.filter(note => note.isDeleted)}
          schedules={trashedSchedules}
          onRestoreNote={onRestoreNote}
          onPermanentlyDeleteNote={onPermanentlyDeleteNote}
          onRestoreSchedule={onRestoreSchedule}
          onPermanentlyDeleteSchedule={onPermanentlyDeleteSchedule}
        />
      )}

      <MobileBottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
}
