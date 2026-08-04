import { Note } from '../../types';

interface CalendarNoteDotsProps {
  notes: Note[];
  onSelectNote: (noteId: string) => void;
}

// 메모는 일정과 달리 점(dot)으로만 축소 표시 — 일정이 화면의 시각적 중심이 되도록 함
export default function CalendarNoteDots({ notes, onSelectNote }: CalendarNoteDotsProps) {
  if (notes.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-1" aria-label={`메모 ${notes.length}개`}>
      {notes.map((note) => (
        <button
          key={note.id}
          type="button"
          onClick={() => onSelectNote(note.id)}
          title={note.title}
          aria-label={`메모: ${note.title}`}
          className="w-2 h-2 rounded-full bg-primary hover:scale-150 transition-transform cursor-pointer"
        />
      ))}
    </div>
  );
}
