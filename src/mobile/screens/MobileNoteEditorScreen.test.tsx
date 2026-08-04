import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MobileNoteEditorScreen from './MobileNoteEditorScreen';
import { Note } from '../../types';

const buildNote = (overrides: Partial<Note> = {}): Note => ({
  id: 'note-1',
  title: '회의 아이디어',
  content: '본문 내용',
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

describe('MobileNoteEditorScreen', () => {
  it('shows empty placeholders when creating a new note', () => {
    const markup = renderToStaticMarkup(
      <MobileNoteEditorScreen note={null} onAutoSave={() => undefined} onBack={() => undefined} />
    );

    expect(markup).toContain('제목을 입력하세요');
    expect(markup).toContain('내용을 입력하세요');
  });

  it('pre-fills the title and content fields for an existing note', () => {
    const markup = renderToStaticMarkup(
      <MobileNoteEditorScreen note={buildNote()} onAutoSave={() => undefined} onBack={() => undefined} />
    );

    expect(markup).toContain('회의 아이디어');
    expect(markup).toContain('본문 내용');
  });

  it('does not render a group selector or image attach control', () => {
    const markup = renderToStaticMarkup(
      <MobileNoteEditorScreen note={buildNote()} onAutoSave={() => undefined} onBack={() => undefined} />
    );

    expect(markup).not.toContain('그룹');
    expect(markup).not.toContain('첨부');
  });
});
