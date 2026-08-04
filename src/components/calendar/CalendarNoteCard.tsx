import { CheckSquare } from 'lucide-react';
import { Group, Note } from '../../types';

interface CalendarNoteCardProps {
  note: Note;
  groups: Group[];
  onSelectNote: (noteId: string) => void;
  compact?: boolean;
}

export default function CalendarNoteCard({
  note,
  groups,
  onSelectNote,
  compact = false,
}: CalendarNoteCardProps) {
  const groupName = groups.find((group) => group.id === note.groupId)?.name || '개인';
  const completedCount = note.checklist.filter((item) => item.done).length;

  return (
    <button
      type="button"
      onClick={() => onSelectNote(note.id)}
      className={`w-full text-left bg-surface-container-lowest rounded-xl shadow-soft border border-transparent hover:border-primary transition-all cursor-pointer group ${compact ? 'p-3' : 'p-4'}`}
    >
      <h3 className="font-sans text-sm font-bold text-primary group-hover:text-primary-container truncate">
        {note.title}
      </h3>
      {!compact && note.content && (
        <p className="mt-2 text-xs text-text-secondary line-clamp-2 leading-relaxed">
          {note.content}
        </p>
      )}
      <div className="flex flex-wrap gap-2 mt-2">
        <span className="bg-surface-container-high text-[10px] px-2 py-0.5 rounded text-on-surface-variant font-bold">
          #{groupName}
        </span>
        {note.checklist.length > 0 && (
          <span className="inline-flex items-center gap-1 bg-primary/5 text-primary text-[10px] px-2 py-0.5 rounded font-bold">
            <CheckSquare className="w-3 h-3" />
            {completedCount}/{note.checklist.length}
          </span>
        )}
      </div>
    </button>
  );
}
