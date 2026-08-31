import { RefObject } from 'react';
import { Bold, Italic, Heading1, List, CheckSquare, LucideIcon } from 'lucide-react';
import { applyMarkdownFormat, MarkdownFormat } from '../utils/markdownFormatting';

interface MarkdownToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (value: string) => void;
}

const BUTTONS: { format: MarkdownFormat; icon: LucideIcon; label: string }[] = [
  { format: 'bold', icon: Bold, label: '굵게' },
  { format: 'italic', icon: Italic, label: '기울임' },
  { format: 'h1', icon: Heading1, label: '제목' },
  { format: 'bullet', icon: List, label: '목록' },
  { format: 'checkbox', icon: CheckSquare, label: '체크박스' },
];

export default function MarkdownToolbar({ textareaRef, value, onChange }: MarkdownToolbarProps) {
  const handleFormat = (format: MarkdownFormat) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const result = applyMarkdownFormat(value, textarea.selectionStart, textarea.selectionEnd, format);
    onChange(result.value);
    // The textarea's own value updates on the next render, so the cursor can only
    // be repositioned once that render has committed.
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  };

  return (
    <div className="flex items-center gap-1 border-b border-grid-line pb-2" role="toolbar" aria-label="서식 도구">
      {BUTTONS.map(({ format, icon: Icon, label }) => (
        <button
          key={format}
          type="button"
          onClick={() => handleFormat(format)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
          title={label}
          aria-label={label}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
