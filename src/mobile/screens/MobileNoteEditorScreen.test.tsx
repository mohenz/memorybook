import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MobileNoteEditorScreen from './MobileNoteEditorScreen';
import { Group, Note } from '../../types';

const mockGroups: Group[] = [
  { id: 'personal', name: '개인' },
  { id: 'work', name: '업무' },
];

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

const render = (note: Note | null, groups: Group[] = mockGroups) =>
  renderToStaticMarkup(
    <MobileNoteEditorScreen
      note={note}
      groups={groups}
      onAutoSave={() => undefined}
      onBack={() => undefined}
    />
  );

describe('MobileNoteEditorScreen', () => {
  it('shows empty placeholders when creating a new note', () => {
    const markup = render(null);

    expect(markup).toContain('제목을 입력하세요');
    expect(markup).toContain('내용을 입력하세요');
  });

  it('pre-fills the title and content fields for an existing note', () => {
    const markup = render(buildNote());

    expect(markup).toContain('회의 아이디어');
    expect(markup).toContain('본문 내용');
  });

  it('renders a group selector listing every group', () => {
    const markup = render(buildNote());

    expect(markup).toContain('aria-label="그룹 선택"');
    expect(markup).toContain('개인');
    expect(markup).toContain('업무');
  });

  it('preselects the group the note already belongs to', () => {
    const markup = render(buildNote({ groupId: 'work' }));

    expect(markup).toContain('<option value="work" selected="">업무</option>');
  });

  it('falls back to the first group when creating a new note', () => {
    const markup = render(null);

    expect(markup).toContain('<option value="personal" selected="">개인</option>');
  });

  it('hides the group selector when there are no groups', () => {
    const markup = render(buildNote(), []);

    expect(markup).not.toContain('그룹 선택');
  });

  it('does not render an image attach control', () => {
    const markup = render(buildNote());

    expect(markup).not.toContain('첨부');
  });
});
