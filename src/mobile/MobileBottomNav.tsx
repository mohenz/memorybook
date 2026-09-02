import React from 'react';
import MemoryIcon, { type MemoryIconName } from '../components/MemoryIcon';

export type MobileTab = 'NOTES' | 'CALENDAR' | 'TODOS' | 'FILES' | 'SEARCH';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onChangeTab: (tab: MobileTab) => void;
}

const TABS: Array<{ id: MobileTab; label: string; icon: MemoryIconName }> = [
  { id: 'NOTES', label: '메모', icon: 'memo' },
  { id: 'CALENDAR', label: '캘린더', icon: 'calendar' },
  { id: 'TODOS', label: 'TO-DO', icon: 'todo' },
  { id: 'FILES', label: '파일', icon: 'library' },
  { id: 'SEARCH', label: '검색', icon: 'search' },
];

export default function MobileBottomNav({ activeTab, onChangeTab }: MobileBottomNavProps) {
  return (
    <nav
      className="relative z-50 grid w-full min-w-0 max-w-full shrink-0 grid-cols-5 overflow-hidden border-t border-grid-line bg-background"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map(({ id, label, icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChangeTab(id)}
          className={`flex h-14 min-h-[44px] w-full min-w-0 flex-col items-center justify-center gap-1 overflow-hidden transition-colors ${
            activeTab === id ? 'text-primary' : 'text-on-surface-variant'
          }`}
          aria-current={activeTab === id}
        >
          <MemoryIcon name={icon} className="w-5 h-5" />
          <span className="max-w-full truncate text-[11px] font-semibold">{label}</span>
        </button>
      ))}
    </nav>
  );
}
