import React, { useState } from 'react';
import { 
  Archive, 
  FileText, 
  Calendar, 
  Star, 
  Tag, 
  Trash2, 
  FolderPlus, 
  HelpCircle, 
  Settings, 
  Briefcase, 
  User, 
  Compass, 
  Folder,
  Plus,
  ListTodo
} from 'lucide-react';
import { Group, ScreenType } from '../types';

interface SidebarProps {
  currentScreen: ScreenType;
  setScreen: (screen: ScreenType) => void;
  groups: Group[];
  activeGroupId: string; // "all", "starred", "trash", or specific group id
  setActiveGroupId: (id: string) => void;
  onAddGroup: (name: string) => void;
  totalNotesCount: number;
  profileImage: string;
  onOpenArchive: () => void;
  onOpenSettings: () => void;
}

export default function Sidebar({
  currentScreen,
  setScreen,
  groups,
  activeGroupId,
  setActiveGroupId,
  onAddGroup,
  totalNotesCount,
  profileImage,
  onOpenArchive,
  onOpenSettings
}: SidebarProps) {
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onAddGroup(newFolderName.trim());
      setNewFolderName('');
      setShowAddFolderModal(false);
    }
  };

  const getGroupIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Briefcase': return <Briefcase className="w-5 h-5" />;
      case 'User': return <User className="w-5 h-5" />;
      case 'Compass': return <Compass className="w-5 h-5" />;
      default: return <Folder className="w-5 h-5" />;
    }
  };

  return (
    <aside className="w-full lg:w-[280px] max-h-[44vh] lg:max-h-none lg:h-full flex flex-col border-b lg:border-b-0 lg:border-r border-outline-variant bg-surface-container-low shrink-0 z-30">
      {/* Profile Header */}
      <div className="p-4 lg:p-6 lg:pb-4 min-h-0">
        <div className="flex items-center justify-center lg:justify-start mb-4 lg:mb-6">
          <button
            type="button"
            onClick={() => {
              setScreen('DASHBOARD');
              setActiveGroupId('all');
            }}
            title="첫 화면으로 이동"
            aria-label="첫 화면으로 이동"
            className="w-16 h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant shadow-sm shrink-0 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <img 
              className="w-full h-full object-cover" 
              src={profileImage} 
              alt="프로필 이미지"
              referrerPolicy="no-referrer"
            />
          </button>
        </div>

        {/* Primary Screen Navigation */}
        <nav className="flex flex-row lg:flex-col gap-2 lg:gap-1 overflow-x-auto lg:overflow-x-visible no-scrollbar pb-1 lg:pb-0">
          <button
            onClick={() => setScreen('CALENDAR')}
            className={`min-w-max lg:w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition-all font-medium ${
              currentScreen === 'CALENDAR'
                ? 'bg-primary text-white shadow-soft font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span>캘린더</span>
          </button>

          <button
            onClick={() => {
              setScreen('DASHBOARD');
              setActiveGroupId('all');
            }}
            className={`min-w-max lg:w-full flex items-center justify-between gap-3 px-4 py-2 rounded-xl text-sm transition-all font-medium ${
              currentScreen === 'DASHBOARD' && activeGroupId === 'all'
                ? 'bg-primary text-white shadow-soft font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5" />
              <span>모든 메모</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              currentScreen === 'DASHBOARD' && activeGroupId === 'all'
                ? 'bg-white/20 text-white'
                : 'bg-surface-container-high text-on-surface-variant'
            }`}>
              {totalNotesCount}
            </span>
          </button>

          <button
            onClick={() => {
              setScreen('DASHBOARD');
              setActiveGroupId('starred');
            }}
            className={`min-w-max lg:w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition-all font-medium ${
              currentScreen === 'DASHBOARD' && activeGroupId === 'starred'
                ? 'bg-primary text-white shadow-soft font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <Star className={`w-5 h-5 ${currentScreen === 'DASHBOARD' && activeGroupId === 'starred' ? 'fill-current' : ''}`} />
            <span>중요 메모</span>
          </button>

          <button
            onClick={() => setScreen('TODOS')}
            className={`min-w-max lg:w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition-all font-medium ${
              currentScreen === 'TODOS'
                ? 'bg-primary text-white shadow-soft font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <ListTodo className="w-5 h-5" />
            <span>TO-DO LIST</span>
          </button>

          {/* Group Folder Divider */}
          <div className="flex pt-1 lg:pt-5 pb-2 px-4 items-center justify-between min-w-max lg:min-w-0">
            <span className="text-[11px] font-bold text-outline uppercase tracking-wider">그룹 폴더</span>
            <button
              onClick={() => setShowAddFolderModal(true)}
              className="p-1 rounded-md hover:bg-surface-container-high text-primary transition-colors"
              title="새 폴더 추가"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Dynamic Folder Items */}
          <div className="hidden lg:flex max-h-[220px] overflow-y-auto custom-scrollbar flex-col gap-0.5">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => {
                  setScreen('DASHBOARD');
                  setActiveGroupId(group.id);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition-all font-medium ${
                  currentScreen === 'DASHBOARD' && activeGroupId === group.id
                    ? 'bg-primary-container text-on-primary-container font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                {getGroupIcon(group.icon)}
                <span className="truncate">{group.name}</span>
              </button>
            ))}
          </div>

          <div className="hidden lg:block my-1 border-t border-outline-variant/30" />

          <button
            onClick={onOpenArchive}
            className="min-w-max lg:w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition-all font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            title="자료실 열기"
          >
            <Archive className="w-5 h-5" />
            <span>자료실</span>
          </button>

          <button
            onClick={() => setScreen('SEARCH')}
            className={`min-w-max lg:w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition-all font-medium ${
              currentScreen === 'SEARCH'
                ? 'bg-primary text-white shadow-soft font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <Tag className="w-5 h-5" />
            <span>태그 및 검색</span>
          </button>

          <div className="hidden lg:block my-1 border-t border-outline-variant/30" />

          {/* Trash Navigation */}
          <button
            onClick={() => {
              setScreen('DASHBOARD');
              setActiveGroupId('trash');
            }}
            className={`min-w-max lg:w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition-all font-medium ${
              currentScreen === 'DASHBOARD' && activeGroupId === 'trash'
                ? 'bg-red-50 text-red-700 font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <Trash2 className="w-5 h-5" />
            <span>휴지통</span>
          </button>
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="hidden lg:flex mt-auto p-4 border-t border-outline-variant/30 flex-col gap-1">
        <button 
          onClick={() => setShowAddFolderModal(true)}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-dashed border-outline text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface hover:border-primary transition-all active:scale-95 text-sm font-semibold cursor-pointer"
        >
          <FolderPlus className="w-4.5 h-4.5 text-primary" />
          <span>새 폴더 추가</span>
        </button>
        
        <div className="flex items-center justify-between px-2 pt-2 text-xs text-outline font-semibold">
          <button 
            onClick={() => alert("도움말: 이 앱은 태블릿 환경에 맞춰진 프리미엄 노팅 다이어리입니다.\n왼쪽 사이드바에서 노트 카테고리를 필터링하고, 달력을 클릭하여 특정 날짜에 노트를 기록해 보세요!")}
            className="flex items-center gap-1.5 py-1 px-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>도움말</span>
          </button>
          
          <button 
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 py-1 px-1.5 hover:bg-surface-container-high rounded-lg text-primary"
            title="설정 및 테마 변경"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>설정</span>
          </button>

        </div>
      </div>

      {/* Add Folder Modal Popover */}
      {showAddFolderModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[200] animate-fade-in-scale p-4">
          <form 
            onSubmit={handleCreateFolder}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-folder-title"
            className="bg-surface-container-lowest text-on-surface p-6 rounded-2xl w-80 max-w-full shadow-2xl border border-outline-variant flex flex-col gap-4 select-text"
          >
            <h3 id="add-folder-title" className="font-bold text-lg text-on-surface flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-primary" />
              <span>새 폴더 추가</span>
            </h3>
            <p className="text-xs text-on-surface-variant">
              노트를 체계적으로 정리할 새로운 폴더 이름을 입력하세요.
            </p>
            <input
              type="text"
              autoFocus
              required
              maxLength={40}
              aria-label="새 폴더 이름"
              placeholder="예: 아이디어, 영감, 미팅록"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full h-11 px-3 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-medium text-on-surface placeholder:text-outline caret-primary bg-surface-container-low select-text"
            />
            <div className="flex items-center justify-end gap-2 text-sm font-semibold">
              <button
                type="button"
                onClick={() => {
                  setShowAddFolderModal(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 hover:bg-surface-container-high rounded-xl text-on-surface-variant transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={!newFolderName.trim()}
                className="px-4 py-2 bg-primary text-white rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-soft disabled:opacity-40"
              >
                생성
              </button>
            </div>
          </form>
        </div>
      )}
    </aside>
  );
}
