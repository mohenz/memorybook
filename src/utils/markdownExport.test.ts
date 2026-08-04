import { describe, expect, it } from 'vitest';
import { buildNoteMarkdown, getMarkdownFilename } from './markdownExport';
import { Note } from '../types';

const note: Note = {
  id: 'note-1',
  title: '프로젝트 회의록',
  content: '회의 내용입니다.',
  groupId: 'project',
  createdAt: '2026년 7월 22일 오후 2:10',
  updatedAt: '2026년 7월 22일 오후 2:30',
  dateString: '2026-07-22',
  isFavorite: false,
  isDeleted: false,
  images: ['https://example.com/image.png'],
  checklist: [
    { id: 'todo-1', text: '안건 정리', done: false },
    { id: 'todo-2', text: '회의록 공유', done: true },
  ],
};

const groups = [{ id: 'project', name: '프로젝트' }];

describe('buildNoteMarkdown', () => {
  it('exports note metadata, content, checklist, and image links', () => {
    const markdown = buildNoteMarkdown(note, groups);

    expect(markdown).toContain('# 프로젝트 회의록');
    expect(markdown).toContain('- 그룹: 프로젝트');
    expect(markdown).toContain('회의 내용입니다.');
    expect(markdown).toContain('- [ ] 안건 정리');
    expect(markdown).toContain('- [x] 회의록 공유');
    expect(markdown).toContain('- [첨부 이미지 1](https://example.com/image.png)');
  });
});

describe('getMarkdownFilename', () => {
  it('removes characters that are unsafe for filenames', () => {
    expect(getMarkdownFilename({ ...note, title: '회의:자료/정리?' })).toBe('2026-07-22_회의_자료_정리.md');
  });
});
