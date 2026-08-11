import React from 'react';
import { Calendar, FileText, Folder, ListTodo, Search } from 'lucide-react';

export type MobileTab = 'NOTES' | 'CALENDAR' | 'TODOS' | 'FILES' | 'SEARCH';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onChangeTab: (tab: MobileTab) => void;
}

const TABS: Array<{ id: MobileTab; label: string; Icon: React.ElementType }> = [
  { id: 'NOTES', label: '메모', Icon: FileText },
  { id: 'CALENDAR', label: '캘린더', Icon: Calendar },
  { id: 'TODOS', label: 'TO-DO', Icon: ListTodo },
  { id: 'FILES', label: '파일', Icon: Folder },
  { id: 'SEARCH', label: '검색', Icon: Search },
];

export default function MobileBottomNav({ activeTab, onChangeTab }: MobileBottomNavProps) {
  return (
    <nav
      className="relative z-50 grid w-full min-w-0 max-w-full shrink-0 grid-cols-5 overflow-hidden border-t border-grid-line bg-background"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChangeTab(id)}
          className={`flex h-14 min-h-[44px] w-full min-w-0 flex-col items-center justify-center gap-1 overflow-hidden transition-colors ${
            activeTab === id ? 'text-primary' : 'text-on-surface-variant'
          }`}
          aria-current={activeTab === id}
        >
          <Icon className="w-5 h-5" />
          <span className="max-w-full truncate text-[11px] font-semibold">{label}</span>
        </button>
      ))}
    </nav>
  );
}
