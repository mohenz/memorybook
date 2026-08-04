import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  ChevronDown, 
  Calendar, 
  Image as ImageIcon, 
  Star, 
  ArrowUpDown, 
  Grid, 
  List,
  Pin,
  CheckSquare,
  Plus
} from 'lucide-react';
import { Note, Group } from '../types';

interface SearchViewProps {
  notes: Note[];
  groups: Group[];
  onSelectNote: (noteId: string) => void;
  onAddNote: () => void;
}

export default function SearchView({
  notes,
  groups,
  onSelectNote,
  onAddNote
}: SearchViewProps) {
  const [query, setQuery] = useState('아이디어');
  const [activeFilters, setActiveFilters] = useState<{
    group: string; // "all" or specific
    hasImageOnly: boolean;
    starredOnly: boolean;
    sortDesc: boolean;
  }>({
    group: 'all',
    hasImageOnly: false,
    starredOnly: false,
    sortDesc: true
  });
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);

  // Filter notes based on Query and Active Filter Chips
  const filteredNotes = useMemo(() => {
    return notes
      .filter(note => !note.isDeleted) // Never show deleted notes in search
      .filter(note => {
        // Query match
        if (!query.trim()) return true;
        const lowerQuery = query.toLowerCase();
        return (
          note.title.toLowerCase().includes(lowerQuery) ||
          note.content.toLowerCase().includes(lowerQuery)
        );
      })
      .filter(note => {
        // Folder group filter
        if (activeFilters.group === 'all') return true;
        return note.groupId === activeFilters.group;
      })
      .filter(note => {
        // Has images filter
        if (!activeFilters.hasImageOnly) return true;
        return note.images && note.images.length > 0;
      })
      .filter(note => {
        // Starred/Favorite filter
        if (!activeFilters.starredOnly) return true;
        return note.isFavorite;
      })
      .sort((a, b) => {
        // Sort order
        const timeA = new Date(a.dateString).getTime() || 0;
        const timeB = new Date(b.dateString).getTime() || 0;
        return activeFilters.sortDesc ? timeB - timeA : timeA - timeB;
      });
  }, [notes, query, activeFilters]);

  // Highlight query keyword matches beautifully
  const renderHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <mark key={i} className="bg-primary/20 text-primary font-bold px-0.5 rounded-sm">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const toggleGroupFilter = (id: string) => {
    setActiveFilters(prev => ({ ...prev, group: id }));
    setShowGroupDropdown(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background select-none">
      
      {/* Search Header Controls */}
      <header className="sticky top-0 w-full z-20 bg-background/80 backdrop-blur-md px-4 md:px-10 py-5 md:py-6 border-b border-grid-line shadow-xs">
        <div className="max-w-5xl mx-auto space-y-5">
          
          {/* Custom Search Box */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-outline" />
            </div>
            <input 
              type="text" 
              className="w-full h-14 pl-12 pr-12 bg-surface rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-primary text-base font-semibold text-on-surface transition-all placeholder:text-outline-variant"
              placeholder="검색어를 입력하여 메모, 일정을 찾아보세요..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="absolute inset-y-0 right-4 flex items-center text-outline-variant hover:text-primary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Dynamic Filter Chips */}
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
            
            {/* Group Filter Chip */}
            <div className="relative">
              <button 
                onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs transition-all cursor-pointer select-none ${
                  activeFilters.group !== 'all' 
                    ? 'bg-primary text-white shadow-soft' 
                    : 'bg-surface border border-outline-variant hover:bg-surface-container-high'
                }`}
              >
                <span>그룹: {activeFilters.group === 'all' ? '전체' : (groups.find(g => g.id === activeFilters.group)?.name || '기타')}</span>
                <ChevronDown className="w-4 h-4 shrink-0" />
              </button>

              {/* Group Dropdown Menu */}
              {showGroupDropdown && (
                <div className="absolute left-0 mt-2 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl w-40 py-2 z-30 animate-fade-in-scale">
                  <button 
                    onClick={() => toggleGroupFilter('all')}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-on-surface hover:bg-surface transition-colors"
                  >
                    전체 그룹
                  </button>
                  {groups.map(g => (
                    <button 
                      key={g.id}
                      onClick={() => toggleGroupFilter(g.id)}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface transition-colors"
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Has Image Filter Chip */}
            <button 
              onClick={() => setActiveFilters(prev => ({ ...prev, hasImageOnly: !prev.hasImageOnly }))}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs transition-all cursor-pointer select-none ${
                activeFilters.hasImageOnly 
                  ? 'bg-primary text-white shadow-soft' 
                  : 'bg-surface border border-outline-variant hover:bg-surface-container-high'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>이미지 첨부</span>
            </button>

            {/* Favorite Filter Chip */}
            <button 
              onClick={() => setActiveFilters(prev => ({ ...prev, starredOnly: !prev.starredOnly }))}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs transition-all cursor-pointer select-none ${
                activeFilters.starredOnly 
                  ? 'bg-primary text-white shadow-soft' 
                  : 'bg-surface border border-outline-variant hover:bg-surface-container-high'
              }`}
            >
              <Star className="w-4 h-4 fill-current" />
              <span>즐겨찾기</span>
            </button>

            <div className="h-6 w-[1px] bg-outline-variant/60 mx-1" />

            {/* Sort Order Chip */}
            <button 
              onClick={() => setActiveFilters(prev => ({ ...prev, sortDesc: !prev.sortDesc }))}
              className="flex items-center gap-1.5 px-4 py-2 bg-surface border border-outline-variant hover:bg-surface-container-high rounded-full font-bold text-xs transition-all cursor-pointer select-none"
            >
              <ArrowUpDown className="w-4 h-4 text-primary" />
              <span>정렬: {activeFilters.sortDesc ? '최신순' : '오래된순'}</span>
            </button>
          </div>

        </div>
      </header>

      {/* Grid / List Result Section */}
      <section className="flex-1 overflow-y-auto px-4 md:px-10 pb-24">
        <div className="max-w-5xl mx-auto py-8">
          
          {/* Section title & Layout toggles */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-sans text-xl font-bold text-on-surface">
              검색 결과 <span className="text-primary ml-1">{filteredNotes.length}</span>
            </h2>
            <div className="flex items-center gap-2 bg-surface p-1 rounded-lg border border-outline-variant/30">
              <button 
                onClick={() => setViewMode('GRID')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'GRID' 
                    ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="그리드 뷰"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('LIST')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'LIST' 
                    ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="리스트 뷰"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Results Grid display */}
          {filteredNotes.length === 0 ? (
            <div className="text-center py-24 select-none">
              <Search className="w-12 h-12 text-outline-variant mx-auto mb-3 stroke-[1.5]" />
              <p className="text-sm font-semibold text-on-surface-variant">일치하는 메모를 찾을 수 없습니다</p>
              <p className="text-xs text-outline mt-1">다른 키워드를 입력하거나 필터 옵션을 리셋해 보세요.</p>
            </div>
          ) : (
            <div className={
              viewMode === 'GRID'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'flex flex-col gap-4'
            }>
              {filteredNotes.map((note) => {
                const groupName = groups.find(g => g.id === note.groupId)?.name || '개인';
                return (
                  <div 
                    key={note.id}
                    onClick={() => onSelectNote(note.id)}
                    className="bg-surface-container-lowest rounded-xl border border-outline-variant hover:border-primary shadow-soft hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer flex flex-col h-full overflow-hidden relative group"
                  >
                    {/* Fixed Pin Badge overlay if starred */}
                    {note.isFavorite && (
                      <div className="absolute top-3 right-3 text-primary bg-primary/5 p-1.5 rounded-full" title="즐겨찾기">
                        <Pin className="w-4 h-4 fill-current transform rotate-45" />
                      </div>
                    )}

                    {/* Thumbnail banner inside card if images exist */}
                    {viewMode === 'GRID' && note.images && note.images.length > 0 && (
                      <div className="h-32 w-full overflow-hidden bg-surface border-b border-grid-line">
                        <img 
                          src={note.images[0]} 
                          alt="Thumbnail" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    <div className="p-5 flex flex-col flex-grow gap-3">
                      {/* Badge / Category and Favorite flag */}
                      <div className="flex justify-between items-center">
                        <span className="px-2.5 py-1 bg-surface-container-high text-[10px] font-bold text-on-surface-variant rounded-md tracking-wider uppercase">
                          {groupName}
                        </span>
                        {!note.isFavorite && (
                          <span className="text-[10px] text-outline font-semibold">
                            {note.dateString}
                          </span>
                        )}
                      </div>

                      {/* Highlighted Title */}
                      <h3 className="font-sans text-base font-bold text-on-surface tracking-tight truncate">
                        {renderHighlightedText(note.title, query)}
                      </h3>

                      {/* Highlighted Snippet */}
                      <p className="text-xs leading-5 text-text-secondary line-clamp-3 flex-grow font-medium">
                        {renderHighlightedText(note.content, query)}
                      </p>

                      {/* Checklist Summary indicator */}
                      {note.checklist && note.checklist.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] text-primary font-semibold py-1 bg-primary/5 rounded-lg px-2 w-max">
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>할 일 {note.checklist.filter(c => c.done).length}/{note.checklist.length}</span>
                        </div>
                      )}

                      {/* Footer block inside card */}
                      <div className="pt-3 border-t border-grid-line flex justify-between items-center mt-2">
                        <span className="text-[10px] text-outline font-semibold">
                          {note.createdAt}
                        </span>
                        
                        {/* Interactive decorative contributors badge circles */}
                        <div className="flex -space-x-1.5">
                          <div className="w-6 h-6 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[9px] text-blue-600 font-bold select-none shadow-xs">
                            SY
                          </div>
                          <div className="w-6 h-6 rounded-full border-2 border-white bg-green-100 flex items-center justify-center text-[9px] text-green-600 font-bold select-none shadow-xs">
                            HJ
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Floating Action Button (FAB) */}
      <button 
        onClick={onAddNote}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 w-14 h-14 md:w-16 md:h-16 bg-primary text-white rounded-xl shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-30 cursor-pointer"
        title="새 메모 쓰기"
      >
        <Plus className="w-8 h-8 text-white stroke-[2]" />
      </button>
    </div>
  );
}
