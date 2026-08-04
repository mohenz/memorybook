import { Group, Note } from '../types';

const illegalFilenameChars = /[<>:"/\\|?*\u0000-\u001F]/g;

function getGroupName(note: Note, groups: Group[]) {
  return groups.find((group) => group.id === note.groupId)?.name || '개인';
}

function normalizeFilenamePart(value: string) {
  return value
    .trim()
    .replace(illegalFilenameChars, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function getMarkdownFilename(note: Note) {
  const datePart = normalizeFilenamePart(note.dateString || 'memo');
  const titlePart = normalizeFilenamePart(note.title || '제목 없는 메모') || '제목_없는_메모';

  return `${datePart}_${titlePart}.md`;
}

export function buildNoteMarkdown(note: Note, groups: Group[]) {
  const groupName = getGroupName(note, groups);
  const checklist = note.checklist?.length
    ? note.checklist.map((item) => `- [${item.done ? 'x' : ' '}] ${item.text}`).join('\n')
    : '- 없음';
  const images = note.images?.length
    ? note.images.map((url, index) => `- [첨부 이미지 ${index + 1}](${url})`).join('\n')
    : '- 없음';

  return [
    `# ${note.title || '제목 없는 메모'}`,
    '',
    `- 그룹: ${groupName}`,
    `- 작성일: ${note.createdAt || '-'}`,
    `- 수정일: ${note.updatedAt || '-'}`,
    `- 날짜: ${note.dateString || '-'}`,
    '',
    '## 내용',
    '',
    note.content || '',
    '',
    '## 체크리스트',
    '',
    checklist,
    '',
    '## 첨부 이미지',
    '',
    images,
    '',
  ].join('\n');
}

export function downloadMarkdownFile(note: Note, groups: Group[]) {
  const markdown = buildNoteMarkdown(note, groups);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = getMarkdownFilename(note);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
