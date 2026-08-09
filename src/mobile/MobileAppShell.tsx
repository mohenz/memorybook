import React, { useEffect, useMemo, useState } from 'react';
import { Group, Note, Schedule, TodoItem, TodoStatus } from '../types';
import MobileBottomNav, { MobileTab } from './MobileBottomNav';
import MobileNoteListScreen from './screens/MobileNoteListScreen';
import MobileNoteDetailScreen from './screens/MobileNoteDetailScreen';
import MobileFileListScreen, { ArchiveFile } from './screens/MobileFileListScreen';
import MobileFilePreviewScreen from './screens/MobileFilePreviewScreen';
import MobileTrashScreen from './screens/MobileTrashScreen';
import { ScheduleDraft } from '../components/calendar/ScheduleFormModal';
import TodoListView from '../components/TodoListView';
import MobileCalendarScreen from './screens/MobileCalendarScreen';
import { useArchiveFiles } from '../archiveStore/features/archive/useArchiveFiles.js';
import { useArchiveMutations } from '../archiveStore/features/archive/useArchiveMutations.js';
import { getTodosForDate } from '../utils/todos';

type NoteView = 'LIST' | 'DETAIL';
type FileView = 'LIST' | 'PREVIEW';

// Non-terminal mutationStatus shapes produced by useArchiveMutations while an upload is running.
function isUploadInProgressStatus(status: string) {
  return status.endsWith('업로드 준비') || /\d+%$/.test(status);
}

interface MobileAppShellProps {
  initialTab?: MobileTab;
  notes: Note[];
  groups: Group[];
  schedules: Schedule[];
  todos: TodoItem[];
  selectedNote: Note | null;
  onSelectNote: (id: string) => void;
  onAddNote: () => void;
  onEditNote: (note: Note) => void;
  onAddSchedule: (draft: ScheduleDraft) => void;
  onUpdateSchedule: (scheduleId: string, draft: ScheduleDraft) => void;
  onDeleteSchedule: (scheduleId: string) => void;
  onAddTodo: (text: string, targetDateString: string) => void;
  onUpdateTodo: (todoId: string, fields: Pick<TodoItem, 'text' | 'targetDateString'>) => void;
  onDeleteTodo: (todoId: string) => void;
  onSetTodoStatus: (todoId: string, status: TodoStatus) => void;
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
  initialTab = 'CALENDAR',
  notes,
  groups,
  schedules,
  todos,
  selectedNote,
  onSelectNote,
  onAddNote,
  onEditNote,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onAddTodo,
  onUpdateTodo,
  onDeleteTodo,
  onSetTodoStatus,
  trashedSchedules = [],
  onRestoreNote = () => undefined,
  onPermanentlyDeleteNote = () => undefined,
  onRestoreSchedule = () => undefined,
  onPermanentlyDeleteSchedule = () => undefined,
  userId,
  profileImage,
  onOpenSettings,
}: MobileAppShellProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>(initialTab);
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
            todos={selectedNote ? getTodosForDate(todos, selectedNote.dateString) : []}
            onUpdateTodo={onUpdateTodo}
            onDeleteTodo={onDeleteTodo}
            onSetTodoStatus={onSetTodoStatus}
            onBack={() => setNoteView('LIST')}
            onEdit={() => selectedNote && onEditNote(selectedNote)}
          />
        ))}

      {activeTab === 'CALENDAR' && (
        <MobileCalendarScreen
          schedules={schedules}
          profileImage={profileImage}
          onOpenSettings={onOpenSettings}
          onAddSchedule={onAddSchedule}
          onUpdateSchedule={onUpdateSchedule}
          onDeleteSchedule={onDeleteSchedule}
        />
      )}

      {activeTab === 'TODOS' && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <TodoListView
            todos={todos}
            onAddItem={onAddTodo}
            onUpdateItem={onUpdateTodo}
            onDeleteItem={onDeleteTodo}
            onSetItemStatus={onSetTodoStatus}
          />
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
