import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MobileAppShell from './MobileAppShell';
import MobileNoteListScreen from './screens/MobileNoteListScreen';
import MobileNoteDetailScreen from './screens/MobileNoteDetailScreen';
import MobileCalendarScreen from './screens/MobileCalendarScreen';
import { Note, Schedule, TodoItem } from '../types';

const todoCallbacks = {
  onUpdateTodo: () => undefined,
  onDeleteTodo: () => undefined,
  onSetTodoStatus: () => undefined,
};

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
    expect(markup).toContain('2026년 7월 25일 오후 3:00');
    expect(markup).toContain('-webkit-line-clamp:3');
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
      <MobileNoteDetailScreen note={buildNote()} groups={[]} todos={[]} {...todoCallbacks} onBack={() => undefined} onEdit={() => undefined} />
    );

    expect(markup).toContain('회의 아이디어');
    expect(markup).toContain('본문 미리보기 내용');
    expect(markup).toContain('2026년 7월 25일 오후 3:00');
  });

  it('shows a fallback message when no note is selected', () => {
    const markup = renderToStaticMarkup(
      <MobileNoteDetailScreen note={null} groups={[]} todos={[]} {...todoCallbacks} onBack={() => undefined} onEdit={() => undefined} />
    );

    expect(markup).toContain('메모를 선택해 주세요');
  });

  it('renders date-linked todos with management controls', () => {
    const todo: TodoItem = {
      id: 'todo-1', text: '장보기', status: 'todo', createdDateString: '2026-07-25',
      targetDateString: '2026-07-26', createdAt: '2026-07-25T00:00:00.000Z', updatedAt: '2026-07-25T00:00:00.000Z',
    };
    const markup = renderToStaticMarkup(
      <MobileNoteDetailScreen note={buildNote()} groups={[]} todos={[todo]} {...todoCallbacks} onBack={() => undefined} onEdit={() => undefined} />
    );

    expect(markup).toContain('장보기');
  });
});

describe('MobileAppShell', () => {
  it('opens on the calendar tab with the bottom navigation visible', () => {
    const markup = renderToStaticMarkup(
      <MobileAppShell
        notes={[buildNote()]}
        groups={[]}
        schedules={[]}
        todos={[]}
        selectedNote={null}
        onSelectNote={() => undefined}
        onAddNote={() => undefined}
        onEditNote={() => undefined}
        onAddSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onAddTodo={() => undefined}
        {...todoCallbacks}
        userId="test-user"
        profileImage="https://example.com/avatar.png"
        onOpenSettings={() => undefined}
      />
    );

    expect(markup).toContain('당일 일정');
    expect(markup).not.toContain('회의 아이디어');
    expect(markup).toContain('메모');
    expect(markup).toContain('캘린더');
    expect(markup).toContain('TO-DO');
    expect(markup).toContain('파일');
    expect(markup).toContain('휴지통');
    expect(markup).toContain('grid-cols-5');
    expect(markup).toContain('min-w-0 max-w-full');
  });

  it('keeps the bottom navigation visible on the TO-DO screen', () => {
    const markup = renderToStaticMarkup(
      <MobileAppShell
        initialTab="TODOS"
        notes={[buildNote()]}
        groups={[]}
        schedules={[]}
        todos={[{
          id: 'todo-1', text: '할 일', status: 'todo', createdDateString: '2026-07-25',
          targetDateString: '2026-07-26', createdAt: '2026-07-25T00:00:00.000Z', updatedAt: '2026-07-25T00:00:00.000Z',
        }]}
        selectedNote={null}
        onSelectNote={() => undefined}
        onAddNote={() => undefined}
        onEditNote={() => undefined}
        onAddSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
        onAddTodo={() => undefined}
        {...todoCallbacks}
        userId="test-user"
        profileImage="https://example.com/avatar.png"
        onOpenSettings={() => undefined}
      />
    );

    expect(markup).toContain('TO-DO LIST');
    expect(markup).toContain('flex min-h-0 flex-1 flex-col overflow-hidden');
    expect(markup).toContain('relative z-50 grid');
    expect(markup).toContain('>메모<');
    expect(markup).toContain('>캘린더<');
    expect(markup).toContain('>TO-DO<');
    expect(markup).toContain('>파일<');
    expect(markup).toContain('>휴지통<');
  });
});

describe('MobileCalendarScreen', () => {
  it('shows only the selected day details with previous and next day cards', () => {
    const schedule: Schedule = {
      id: 'schedule-1',
      title: '오늘 미팅',
      dateString: '2026-08-09',
      allDay: false,
      startTime: '10:00',
      endTime: '11:00',
      priority: 'normal',
      createdAt: '2026-08-09',
      updatedAt: '2026-08-09',
    };
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 9, 12));

    const markup = renderToStaticMarkup(
      <MobileCalendarScreen
        schedules={[schedule]}
        profileImage="https://example.com/avatar.png"
        onOpenSettings={() => undefined}
        onAddSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
      />
    );

    expect(markup).toContain('당일 일정');
    expect(markup).toContain('모바일 캘린더 보기');
    expect(markup).toContain('전날');
    expect(markup).toContain('오늘');
    expect(markup).toContain('다음날');
    expect(markup).toContain('오늘 미팅');
    expect(markup).toContain('10:00–11:00');
    vi.useRealTimers();
  });

  it('renders a seven-day card strip in weekly mode', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 9, 12));

    const markup = renderToStaticMarkup(
      <MobileCalendarScreen
        initialViewMode="week"
        schedules={[]}
        profileImage="https://example.com/avatar.png"
        onOpenSettings={() => undefined}
        onAddSchedule={() => undefined}
        onUpdateSchedule={() => undefined}
        onDeleteSchedule={() => undefined}
      />
    );

    expect(markup).toContain('주간 일정');
    expect(markup).toContain('aria-label="주간 일정 카드"');
    expect(markup).toContain('aria-label="이전 주"');
    expect(markup).toContain('aria-label="다음 주"');
    expect(markup).toContain('w-[84px] shrink-0');
    expect(markup).toContain('aria-pressed="true"');
    vi.useRealTimers();
  });
});
