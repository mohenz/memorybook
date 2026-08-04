import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MobileAppShell from './MobileAppShell';
import MobileNoteListScreen from './screens/MobileNoteListScreen';
import MobileNoteDetailScreen from './screens/MobileNoteDetailScreen';
import { Note } from '../types';

const buildNote = (overrides: Partial<Note> = {}): Note => ({
  id: 'note-1',
  title: '회의 아이디어',
  content: '본문 미리보기 내용',
  groupId: 'personal',
  createdAt: '2026년 7월 25일 오후 3:00',
  updatedAt: '2026년 7월 25일 오후 3:00',
  dateString: '2026-07-25',
  isFavorite: false,
  isDeleted: false,
  images: [],
  checklist: [],
  ...overrides,
});

describe('MobileNoteListScreen', () => {
  it('renders note title, body preview and the add-note action', () => {
    const markup = renderToStaticMarkup(
      <MobileNoteListScreen
        notes={[buildNote()]}
        onSelectNote={() => undefined}
        onAddNote={() => undefined}
        profileImage="https://example.com/avatar.png"
        onOpenSettings={() => undefined}
      />
    );

    expect(markup).toContain('MEMOry');
    expect(markup).toContain('회의 아이디어');
    expect(markup).toContain('본문 미리보기 내용');
    expect(markup).toContain('새 메모 작성');
    expect(markup).toContain('min-h-0 min-w-0 w-full max-w-full flex-1');
    expect(markup).toContain('overflow-x-hidden overflow-y-auto pb-20');
    expect(markup).toContain('absolute bottom-4 right-4 z-20');
    expect(markup).toContain('>새 메모<');
  });

  it('shows the empty-list message when there are no active notes', () => {
    const markup = renderToStaticMarkup(
      <MobileNoteListScreen
        notes={[]}
        onSelectNote={() => undefined}
        onAddNote={() => undefined}
        profileImage="https://example.com/avatar.png"
        onOpenSettings={() => undefined}
      />
    );

    expect(markup).toContain('메모가 없습니다');
  });

  it('excludes deleted notes from the list', () => {
    const markup = renderToStaticMarkup(
      <MobileNoteListScreen
        notes={[buildNote({ isDeleted: true })]}
        onSelectNote={() => undefined}
        onAddNote={() => undefined}
        profileImage="https://example.com/avatar.png"
        onOpenSettings={() => undefined}
      />
    );

    expect(markup).toContain('메모가 없습니다');
    expect(markup).not.toContain('회의 아이디어');
  });
});

describe('MobileNoteDetailScreen', () => {
  it('renders the note title, timestamp and content', () => {
    const markup = renderToStaticMarkup(
      <MobileNoteDetailScreen note={buildNote()} groups={[]} onBack={() => undefined} onEdit={() => undefined} />
    );

    expect(markup).toContain('회의 아이디어');
    expect(markup).toContain('본문 미리보기 내용');
    expect(markup).toContain('2026년 7월 25일 오후 3:00');
  });

  it('shows a fallback message when no note is selected', () => {
    const markup = renderToStaticMarkup(
      <MobileNoteDetailScreen note={null} groups={[]} onBack={() => undefined} onEdit={() => undefined} />
    );

    expect(markup).toContain('메모를 선택해 주세요');
  });

  it('renders the checklist read-only, without a toggle handler', () => {
    const note = buildNote({
      checklist: [{ id: 'todo-1', text: '장보기', done: true }],
    });
    const markup = renderToStaticMarkup(
      <MobileNoteDetailScreen note={note} groups={[]} onBack={() => undefined} onEdit={() => undefined} />
    );

    expect(markup).toContain('장보기');
  });
});

describe('MobileAppShell', () => {
  it('opens on the notes list tab with the bottom navigation visible', () => {
    const markup = renderToStaticMarkup(
      <MobileAppShell
        notes={[buildNote()]}
        groups={[]}
        schedules={[]}
        selectedNote={null}
        onSelectNote={() => undefined}
        onAddNote={() => undefined}
        onEditNote={() => undefined}
        onAddSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        userId="test-user"
        profileImage="https://example.com/avatar.png"
        onOpenSettings={() => undefined}
      />
    );

    expect(markup).toContain('회의 아이디어');
    expect(markup).toContain('메모');
    expect(markup).toContain('캘린더');
    expect(markup).toContain('파일');
    expect(markup).toContain('휴지통');
    expect(markup).toContain('grid-cols-4');
    expect(markup).toContain('min-w-0 max-w-full');
  });
});
