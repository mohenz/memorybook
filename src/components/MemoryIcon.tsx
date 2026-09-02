import type { CSSProperties } from 'react';

type MemoryIconName =
  | 'add_check_item' | 'add_event' | 'add_todo' | 'attachment' | 'calendar'
  | 'check_item' | 'checklist' | 'completed' | 'copy' | 'delete' | 'dev_note'
  | 'diary' | 'document' | 'download' | 'edit' | 'favorite' | 'filter'
  | 'folder' | 'help' | 'home' | 'idea' | 'image' | 'important' | 'incomplete'
  | 'library' | 'link' | 'lock' | 'memo' | 'new_folder' | 'new_memo' | 'pdf'
  | 'pin' | 'progress' | 'project' | 'reminder' | 'reorder' | 'repeat'
  | 'search' | 'settings' | 'share' | 'sketch_note' | 'sort' | 'template'
  | 'today' | 'todo' | 'upload' | 'week';

interface MemoryIconProps {
  name: MemoryIconName;
  className?: string;
  label?: string;
  accentColor?: string;
}

const iconModules = import.meta.glob<string>('../assets/memory-icons/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const icons = Object.fromEntries(
  Object.entries(iconModules).map(([path, source]) => {
    const name = path.split('/').pop()?.replace('.svg', '') ?? '';
    const normalized = source
      .replace(/<style>[\s\S]*?<\/style>/, '')
      .replace('<svg ', '<svg aria-hidden="true" focusable="false" ')
      .replace('fill="none"', 'fill="none" stroke="currentColor"');
    return [name, normalized];
  }),
) as Record<string, string>;

export default function MemoryIcon({
  name,
  className = 'h-5 w-5',
  label,
  accentColor = '#FF8A00',
}: MemoryIconProps) {
  const style = { '--memory-icon-accent': accentColor } as CSSProperties;

  return (
    <span
      className={`memory-icon inline-flex shrink-0 ${className}`}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: icons[name] }}
    />
  );
}

export type { MemoryIconName };
