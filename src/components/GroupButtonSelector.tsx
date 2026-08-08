import { Group } from '../types';

interface GroupButtonSelectorProps {
  groups: Group[];
  value: string;
  onChange: (groupId: string) => void;
  layout?: 'grid' | 'wrap';
}

export default function GroupButtonSelector({
  groups,
  value,
  onChange,
  layout = 'wrap',
}: GroupButtonSelectorProps) {
  if (groups.length === 0) return null;

  return (
    <div
      role="radiogroup"
      aria-label="그룹 선택"
      className={layout === 'grid' ? 'grid w-full grid-cols-3 gap-2' : 'flex max-w-[32rem] flex-wrap justify-end gap-2'}
    >
      {groups.map((group) => {
        const selected = group.id === value;

        return (
          <button
            key={group.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(group.id)}
            className={`flex h-9 items-center justify-center rounded-lg border px-3 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              layout === 'wrap' ? 'min-w-24' : 'min-w-0 truncate'
            } ${
              selected
                ? 'border-primary bg-surface-container-lowest text-primary shadow-soft'
                : 'border-transparent bg-surface-container text-on-surface-variant hover:border-outline-variant hover:text-on-surface'
            }`}
          >
            <span className="truncate">{group.name}</span>
          </button>
        );
      })}
    </div>
  );
}
