export type MarkdownFormat = 'bold' | 'italic' | 'h1' | 'bullet' | 'checkbox';

export interface MarkdownFormatResult {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

const WRAP_MARKERS: Record<'bold' | 'italic', string> = {
  bold: '**',
  italic: '*',
};

const LINE_PREFIXES: Record<'h1' | 'bullet' | 'checkbox', string> = {
  h1: '## ',
  bullet: '- ',
  checkbox: '- [ ] ',
};

export function applyMarkdownFormat(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  format: MarkdownFormat,
): MarkdownFormatResult {
  if (format === 'bold' || format === 'italic') {
    const marker = WRAP_MARKERS[format];
    const selected = value.slice(selectionStart, selectionEnd);
    const next = value.slice(0, selectionStart) + marker + selected + marker + value.slice(selectionEnd);
    const cursor = selectionStart + marker.length;
    return { value: next, selectionStart: cursor, selectionEnd: cursor + selected.length };
  }

  // Line-prefix formats apply to every line touched by the selection, so selecting
  // several lines and clicking "목록" turns them all into list items at once.
  const prefix = LINE_PREFIXES[format];
  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
  const nextNewline = value.indexOf('\n', selectionEnd);
  const lineEnd = nextNewline === -1 ? value.length : nextNewline;

  const block = value.slice(lineStart, lineEnd);
  const lines = block.length ? block.split('\n') : [''];
  const prefixed = lines.map((line) => prefix + line).join('\n');

  const next = value.slice(0, lineStart) + prefixed + value.slice(lineEnd);
  const addedLength = prefixed.length - block.length;

  return {
    value: next,
    selectionStart: selectionStart + prefix.length,
    selectionEnd: selectionEnd + addedLength,
  };
}
