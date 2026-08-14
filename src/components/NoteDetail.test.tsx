import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Note } from '../types';
import NoteDetail from './NoteDetail';

const note: Note = {
  id: 'note-1',
  title: 'PC 메모',
  content: '메모 본문',
  groupId: 'personal',
  createdAt: '2026년 8월 9일',
  updatedAt: '2026년 8월 9일',
  dateString: '2026-08-09',
  isFavorite: false,
  isDeleted: false,
  images: [],
  checklist: [],
};

describe('NoteDetail desktop actions', () => {
  it('does not render the mobile-style quick action panel on PC', () => {
    const markup = renderToStaticMarkup(
      <NoteDetail
        note={note}
        groups={[]}
        todos={[]}
        onEdit={() => undefined}
        onDelete={() => undefined}
        onRestore={() => undefined}
        onToggleFavorite={() => undefined}
        onUpdateTodo={() => undefined}
        onDeleteTodo={() => undefined}
        onSetTodoStatus={() => undefined}
      />
    );

    expect(markup).toContain('PC 메모');
    expect(markup).not.toContain('bg-slate-950/95');
    expect(markup).not.toContain('>서식<');
    expect(markup).not.toContain('>그리기<');
    expect(markup).not.toContain('>음성<');
  });

  it('renders the reading area typography two pixels smaller', () => {
    const markup = renderToStaticMarkup(
      <NoteDetail
        note={note}
        groups={[]}
        todos={[{
          id: 'todo-1',
          text: '확인하기',
          status: 'todo',
          createdDateString: '2026-08-09',
          targetDateString: '2026-08-10',
          createdAt: '2026-08-09T00:00:00.000Z',
          updatedAt: '2026-08-09T00:00:00.000Z',
        }]}
        onEdit={() => undefined}
        onDelete={() => undefined}
        onRestore={() => undefined}
        onToggleFavorite={() => undefined}
        onUpdateTodo={() => undefined}
        onDeleteTodo={() => undefined}
        onSetTodoStatus={() => undefined}
      />
    );

    expect(markup).toContain('text-[22px] md:text-[28px]');
    expect(markup).toContain('text-base leading-8');
    expect(markup).toContain('text-[10px] font-medium');
    expect(markup).toContain('이 날짜의 TO-DO');
    expect(markup).toContain('확인하기 수정');
    expect(markup).toContain('확인하기 삭제');
  });

  const renderNote = (overrides: Partial<Note> = {}) => renderToStaticMarkup(
    <NoteDetail
      note={{ ...note, ...overrides }}
      groups={[]}
      todos={[]}
      onEdit={() => undefined}
      onDelete={() => undefined}
      onRestore={() => undefined}
      onToggleFavorite={() => undefined}
      onUpdateTodo={() => undefined}
      onDeleteTodo={() => undefined}
      onSetTodoStatus={() => undefined}
    />
  );

  it('places the fullscreen action between the favorite and edit actions', () => {
    const markup = renderNote();

    expect(markup).toContain('title="전체화면으로 보기"');

    const favorite = markup.indexOf('중요 메모 추가');
    const fullscreen = markup.indexOf('전체화면으로 보기');
    const edit = markup.indexOf('수정하기');

    expect(favorite).toBeGreaterThan(-1);
    expect(fullscreen).toBeGreaterThan(favorite);
    expect(edit).toBeGreaterThan(fullscreen);
  });

  it('starts collapsed so the fullscreen overlay is absent until requested', () => {
    const markup = renderNote();

    expect(markup).not.toContain('전체화면 나가기');
    expect(markup).not.toContain('z-[250]');
    // Toolbar visible, so the reading canvas renders inline rather than in the overlay.
    expect(markup).toContain('items-center gap-2 z-20 flex');
  });

  it('offers restore instead of the fullscreen action for a trashed note', () => {
    const markup = renderNote({ isDeleted: true });

    expect(markup).toContain('title="메모 복원"');
    expect(markup).not.toContain('title="전체화면으로 보기"');
  });
});
