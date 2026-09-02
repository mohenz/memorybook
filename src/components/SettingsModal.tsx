import React, { useState } from 'react';
import { X, Sun, Moon, Check, User, Sparkles, Upload, Download, Smartphone, Cloud, LogOut, Folder, Bell, ChevronUp, ChevronDown } from 'lucide-react';
import MemoryIcon from './MemoryIcon';
import { Group, NotificationSettings } from '../types';

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  browserPermission: false,
  dailyDigest: { enabled: false, time: '08:00' },
  weeklyDigest: { enabled: false, dayOfWeek: 1, time: '08:00' },
};

interface SettingsModalProps {
  onClose: () => void;
  profileImage: string;
  onUpdateProfileImage: (file: File) => Promise<void>;
  darkMode: boolean;
  onToggleDarkMode: (enabled: boolean) => void;
  groups: Group[];
  onRenameGroup: (groupId: string, newName: string) => void;
  onReorderGroup: (groupId: string, direction: 'up' | 'down') => void;
  archiveUserEmail: string;
  archiveStatus: string;
  supabaseConfigured: boolean;
  onArchiveLogin: (email: string, password: string) => Promise<void>;
  onArchiveLogout: () => Promise<void>;
  onArchivePasswordReset: (email: string) => Promise<void>;
  notificationSettings?: NotificationSettings;
  onNotificationSettingsChange?: (settings: NotificationSettings) => void;
  onRequestNotificationPermission?: () => Promise<boolean>;
  notificationsSupported?: boolean;
  isInstallable?: boolean;
  onInstall?: () => void;
}

interface FolderRenameRowProps {
  group: Group;
  priority: number;
  onRename: (groupId: string, newName: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  disableUp: boolean;
  disableDown: boolean;
}

function FolderRenameRow({ group, priority, onRename, onMoveUp, onMoveDown, disableUp, disableDown }: FolderRenameRowProps) {
  const [name, setName] = useState(group.name);

  const commit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(group.name);
      return;
    }
    if (trimmed !== group.name) {
      onRename(group.id, trimmed);
    }
  };

  return (
    <div className="flex items-center gap-2.5 bg-surface dark:bg-surface-container-lowest rounded-xl border border-outline-variant/30 px-3 py-2">
      <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
        {priority}
      </span>
      <MemoryIcon name="folder" className="w-4 h-4 text-primary shrink-0" />
      <input
        type="text"
        aria-label={`${group.name} 폴더 이름`}
        value={name}
        maxLength={40}
        onChange={(event) => setName(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur();
          }
        }}
        className="flex-1 h-9 px-2 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary rounded-lg text-sm font-semibold text-on-surface"
      />
      <div className="flex flex-col shrink-0">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={disableUp}
          aria-label={`${group.name} 폴더 우선순위 올리기`}
          className="p-0.5 rounded text-on-surface-variant hover:bg-surface-container-high hover:text-primary disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-on-surface-variant transition-colors"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={disableDown}
          aria-label={`${group.name} 폴더 우선순위 내리기`}
          className="p-0.5 rounded text-on-surface-variant hover:bg-surface-container-high hover:text-primary disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-on-surface-variant transition-colors"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function SettingsModal({
  onClose,
  profileImage,
  onUpdateProfileImage,
  darkMode,
  onToggleDarkMode,
  groups,
  onRenameGroup,
  onReorderGroup,
  archiveUserEmail,
  archiveStatus,
  supabaseConfigured,
  onArchiveLogin,
  onArchiveLogout,
  onArchivePasswordReset,
  isInstallable,
  onInstall,
  notificationSettings = DEFAULT_NOTIFICATION_SETTINGS,
  onNotificationSettingsChange = () => undefined,
  onRequestNotificationPermission = async () => false,
  notificationsSupported = true,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'archive' | 'theme' | 'folders' | 'notifications'>('profile');
  const [dragOver, setDragOver] = useState(false);
  const [archiveEmail, setArchiveEmail] = useState('');
  const [archivePassword, setArchivePassword] = useState('');
  const [profileStatus, setProfileStatus] = useState('');
  const [notificationStatus, setNotificationStatus] = useState('');

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setProfileStatus('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setProfileStatus('프로필 이미지를 저장하는 중입니다.');
    try {
      await onUpdateProfileImage(file);
      setProfileStatus('프로필 이미지가 저장되었습니다.');
    } catch (error) {
      setProfileStatus(error instanceof Error ? error.message : '프로필 이미지 저장에 실패했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in-scale p-4">
      {/* Modal Card */}
      <div className="bg-white dark:bg-surface-container-low border border-outline-variant dark:border-outline/40 rounded-3xl w-[520px] max-w-full h-[720px] max-h-[calc(100dvh-2rem)] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <header className="px-6 py-5 border-b border-grid-line dark:border-outline/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 text-primary rounded-xl dark:bg-primary/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="font-sans text-lg font-bold text-on-background">설정</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-surface dark:hover:bg-surface-container-high rounded-full text-on-surface-variant transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Tab Selection */}
        <div className="flex border-b border-grid-line dark:border-outline/10 px-2 bg-surface-container-low dark:bg-surface-container-lowest shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            title="프로필 이미지 변경"
            aria-label="프로필 이미지 변경"
            className={`flex-1 min-w-0 py-3.5 px-1 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">프로필</span>
          </button>
          <button
            onClick={() => setActiveTab('theme')}
            title="화면 테마 설정"
            aria-label="화면 테마 설정"
            className={`flex-1 min-w-0 py-3.5 px-1 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'theme'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Sun className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">테마</span>
          </button>
          <button
            onClick={() => setActiveTab('folders')}
            title="폴더 이름 관리"
            aria-label="폴더 이름 관리"
            className={`flex-1 min-w-0 py-3.5 px-1 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'folders'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <MemoryIcon name="folder" className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">폴더</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            title="알림 설정"
            aria-label="알림 설정"
            className={`flex-1 min-w-0 py-3.5 px-1 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'notifications'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <MemoryIcon name="reminder" className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">알림</span>
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            title="자료실 계정"
            aria-label="자료실 계정"
            className={`flex-1 min-w-0 py-3.5 px-1 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'archive'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Cloud className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">자료실</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 min-h-0 space-y-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              
              {/* Current Profile Preview */}
              <div className="flex flex-col items-center gap-3 bg-surface dark:bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 text-center">
                <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">현재 프로필</span>
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary shadow-soft bg-white">
                  <img 
                    src={profileImage} 
                    alt="Current profile" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <p className="text-xs text-outline font-medium">상단 사이드바에 표시되는 프로필 사진입니다.</p>
              </div>

              {/* Custom Gallery Upload */}
              <div className="space-y-3">
                <span className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider block">
                  갤러리에서 이미지 업로드
                </span>
                
                <div 
                  className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 transition-all bg-surface dark:bg-surface-container-lowest relative group ${
                    dragOver 
                      ? 'border-primary bg-primary/5 dark:bg-primary/10 scale-[0.99]' 
                      : 'border-outline-variant/60 dark:border-outline/30 hover:border-primary/80'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    handleFileChange(file);
                  }}
                >
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      handleFileChange(file);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    title="갤러리 이미지 선택"
                  />
                  
                  <div className={`p-3 rounded-full transition-transform ${
                    dragOver ? 'bg-primary/20 text-primary scale-110' : 'bg-primary/10 text-primary dark:bg-primary/20 group-hover:scale-110'
                  }`}>
                    <MemoryIcon name="upload" className="w-5 h-5" />
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs font-bold text-on-background">클릭하거나 이미지를 드래그하여 업로드</p>
                    <p className="text-[11px] text-outline mt-1">PNG, JPG, GIF, WebP 지원 (최대 5MB 권장)</p>
                  </div>
                </div>
                {profileStatus && <p className="text-xs font-semibold text-primary">{profileStatus}</p>}
              </div>

            </div>
          )}

          {activeTab === 'theme' && (
            <div className="space-y-5">
              <span className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider block">
                화면 보기 모드 설정
              </span>
              
              <div className="grid grid-cols-2 gap-4">
                
                {/* Light Mode Card */}
                <button
                  onClick={() => onToggleDarkMode(false)}
                  className={`flex flex-col items-center justify-between p-6 rounded-2xl border-2 transition-all text-center gap-4 ${
                    !darkMode
                      ? 'border-primary bg-primary-container/20 ring-2 ring-primary/25 shadow-md'
                      : 'border-outline-variant/40 dark:border-outline/20 bg-slate-50 hover:border-primary text-slate-800'
                  }`}
                >
                  <div className={`p-4 rounded-full ${!darkMode ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-600'}`}>
                    <Sun className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">밝게보기</h3>
                    <p className="text-[11px] text-slate-500 mt-1">낮이나 조명이 있는 공간에서 추천</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    !darkMode ? 'border-primary bg-primary text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {!darkMode && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>

                {/* Dark Mode Card */}
                <button
                  onClick={() => onToggleDarkMode(true)}
                  className={`flex flex-col items-center justify-between p-6 rounded-2xl border-2 transition-all text-center gap-4 ${
                    darkMode
                      ? 'border-primary bg-primary-container/20 ring-2 ring-primary/25 shadow-md'
                      : 'border-outline-variant/40 dark:border-outline/20 bg-slate-900 hover:border-primary text-slate-100'
                  }`}
                >
                  <div className={`p-4 rounded-full ${darkMode ? 'bg-primary/20 text-primary' : 'bg-slate-800 text-slate-400'}`}>
                    <Moon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">어둡게 보기</h3>
                    <p className="text-[11px] text-slate-400 mt-1">밤이나 어두운 장소에서 눈 피로 방지</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    darkMode ? 'border-primary bg-primary text-white' : 'border-slate-600 bg-transparent'
                  }`}>
                    {darkMode && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>

              </div>

              {/* Dynamic notice describing dark theme features */}
              <div className="p-4 bg-surface dark:bg-surface-container-lowest rounded-2xl border border-outline-variant/30 text-xs text-on-surface-variant leading-relaxed">
                <span className="font-bold text-primary block mb-1">다크 모드</span>
                어둡게 보기를 켜면 종이 질감 격자 무늬의 농도와 선 색상이 어두운 밤하늘 테마에 맞춰 안전하게 조절됩니다.
              </div>

              {/* PWA Installation Card */}
              <div className="border-t border-grid-line dark:border-outline/10 pt-5 space-y-3">
                <span className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider block">
                  데스크톱/모바일 전용 앱(PWA) 설치
                </span>
                
                {isInstallable && onInstall ? (
                  <div className="flex items-center justify-between p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 gap-4 animate-fade-in-scale">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0 dark:bg-primary/20">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-on-background">MEMOry 앱 설치하기</h4>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">네트워크가 없어도 오프라인 상태에서 즉시 노트를 작성하고 기록하세요.</p>
                      </div>
                    </div>
                    <button
                      onClick={onInstall}
                      className="flex items-center gap-1.5 bg-primary text-white text-xs px-4 py-2.5 rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all shadow-soft shrink-0 cursor-pointer"
                    >
                      <MemoryIcon name="download" className="w-3.5 h-3.5" />
                      <span>앱 설치</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-surface dark:bg-surface-container-lowest rounded-2xl border border-outline-variant/30 text-xs text-on-surface-variant leading-relaxed">
                    <span className="font-bold text-primary block mb-1">설치 안내</span>
                    <p className="mb-2">브라우저의 주소창 오른쪽 <strong className="text-on-background">‘앱 설치’</strong> 버튼을 누르거나, iOS Safari의 경우 <strong className="text-on-background">‘공유하기’에서 ‘홈 화면에 추가’</strong>를 선택하면 독립 실행형으로 사용할 수 있습니다.</p>
                    <div className="text-[10px] text-outline font-semibold">오프라인 데이터 보존 / 태블릿 최적화 레이아웃 지원</div>
                  </div>
                )}
              </div>

            </div>
          )}

          {activeTab === 'folders' && (
            <div className="space-y-4">
              <div className="p-4 bg-surface dark:bg-surface-container-lowest rounded-2xl border border-outline-variant/30 text-xs text-on-surface-variant leading-relaxed">
                <span className="font-bold text-primary block mb-1">폴더 이름 및 우선순위 관리</span>
                이름은 입력 후 다른 곳을 클릭하거나 Enter를 누르면 저장됩니다. 화살표로 순서를 바꾸면 사이드바, 그룹 선택, 그룹별 정렬 등 앱 전반의 노출 순서에 반영됩니다.
              </div>

              {groups.length === 0 ? (
                <div className="text-center py-10 opacity-50">
                  <MemoryIcon name="folder" className="w-8 h-8 text-outline mx-auto mb-2" />
                  <p className="text-xs font-semibold text-on-surface-variant">등록된 폴더가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {groups.map((group, index) => (
                    <div key={group.id}>
                      <FolderRenameRow
                        group={group}
                        priority={index + 1}
                        onRename={onRenameGroup}
                        onMoveUp={() => onReorderGroup(group.id, 'up')}
                        onMoveDown={() => onReorderGroup(group.id, 'down')}
                        disableUp={index === 0}
                        disableDown={index === groups.length - 1}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-outline-variant/30 bg-surface p-4 text-xs leading-relaxed text-on-surface-variant dark:bg-surface-container-lowest">
                <span className="mb-1 block font-bold text-primary">브라우저 알림</span>
                앱이 열려 있는 동안 일정 리마인드와 다이제스트를 표시합니다.
              </div>

              <label className="flex items-center justify-between gap-4 rounded-2xl border border-outline-variant/30 bg-surface p-4 dark:bg-surface-container-lowest">
                <div><strong className="block text-sm text-on-surface">브라우저 알림 허용</strong><span className="text-[11px] text-outline">처음 활성화할 때 브라우저 권한을 요청합니다.</span></div>
                <input
                  type="checkbox"
                  aria-label="브라우저 알림 허용"
                  checked={notificationSettings.browserPermission}
                  disabled={!notificationsSupported}
                  onChange={async (event) => {
                    if (!event.target.checked) {
                      onNotificationSettingsChange({ ...notificationSettings, browserPermission: false });
                      setNotificationStatus('MEMOry 알림이 꺼졌습니다.');
                      return;
                    }
                    const granted = await onRequestNotificationPermission();
                    onNotificationSettingsChange({ ...notificationSettings, browserPermission: granted });
                    setNotificationStatus(granted ? '브라우저 알림을 허용했습니다.' : '브라우저 알림 권한이 허용되지 않았습니다.');
                  }}
                  className="h-5 w-5 accent-primary"
                />
              </label>
              {!notificationsSupported && <p className="text-xs font-semibold text-error">이 브라우저는 알림 기능을 지원하지 않습니다.</p>}
              {notificationStatus && <p className="text-xs font-semibold text-primary">{notificationStatus}</p>}

              <div className="space-y-3 rounded-2xl border border-outline-variant/30 bg-surface p-4 dark:bg-surface-container-lowest">
                <label className="flex items-center justify-between gap-4 text-sm font-bold text-on-surface">
                  매일 다이제스트
                  <input
                    type="checkbox"
                    checked={notificationSettings.dailyDigest.enabled}
                    onChange={(event) => onNotificationSettingsChange({ ...notificationSettings, dailyDigest: { ...notificationSettings.dailyDigest, enabled: event.target.checked } })}
                    className="h-4 w-4 accent-primary"
                  />
                </label>
                <label className="block text-xs font-bold text-on-surface-variant">알림 시간
                  <input type="time" aria-label="매일 다이제스트 시간" value={notificationSettings.dailyDigest.time} onChange={(event) => onNotificationSettingsChange({ ...notificationSettings, dailyDigest: { ...notificationSettings.dailyDigest, time: event.target.value } })} className="mt-1 h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface" />
                </label>
              </div>

              <div className="space-y-3 rounded-2xl border border-outline-variant/30 bg-surface p-4 dark:bg-surface-container-lowest">
                <label className="flex items-center justify-between gap-4 text-sm font-bold text-on-surface">
                  매주 다이제스트
                  <input
                    type="checkbox"
                    checked={notificationSettings.weeklyDigest.enabled}
                    onChange={(event) => onNotificationSettingsChange({ ...notificationSettings, weeklyDigest: { ...notificationSettings.weeklyDigest, enabled: event.target.checked } })}
                    className="h-4 w-4 accent-primary"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-bold text-on-surface-variant">요일
                    <select aria-label="매주 다이제스트 요일" value={notificationSettings.weeklyDigest.dayOfWeek} onChange={(event) => onNotificationSettingsChange({ ...notificationSettings, weeklyDigest: { ...notificationSettings.weeklyDigest, dayOfWeek: Number(event.target.value) } })} className="mt-1 h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface">
                      <option value={0}>일요일</option><option value={1}>월요일</option><option value={2}>화요일</option><option value={3}>수요일</option><option value={4}>목요일</option><option value={5}>금요일</option><option value={6}>토요일</option>
                    </select>
                  </label>
                  <label className="text-xs font-bold text-on-surface-variant">알림 시간
                    <input type="time" aria-label="매주 다이제스트 시간" value={notificationSettings.weeklyDigest.time} onChange={(event) => onNotificationSettingsChange({ ...notificationSettings, weeklyDigest: { ...notificationSettings.weeklyDigest, time: event.target.value } })} className="mt-1 h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'archive' && (
            <div className="space-y-5">
              <div className="p-4 bg-surface dark:bg-surface-container-lowest rounded-2xl border border-outline-variant/30 text-xs text-on-surface-variant leading-relaxed">
                <span className="font-bold text-primary block mb-1">자료실 통합</span>
                같은 Supabase 계정으로 메모, 폴더, 테마, 첨부 이미지를 저장합니다.
              </div>

              {!supabaseConfigured && (
                <div className="p-4 rounded-2xl border border-error/30 bg-red-50 text-xs text-error font-semibold">
                  Supabase 환경변수가 설정되지 않았습니다. `VITE_SUPABASE_URL`과 `VITE_SUPABASE_PUBLISHABLE_KEY`를 설정해야 합니다.
                </div>
              )}

              {archiveUserEmail ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
                    <span className="text-xs font-bold text-on-surface-variant block mb-1">현재 계정</span>
                    <strong className="text-sm text-on-background">{archiveUserEmail}</strong>
                    {archiveStatus && <p className="text-xs text-primary mt-2">{archiveStatus}</p>}
                  </div>
                  <button
                    onClick={onArchiveLogout}
                    className="w-full h-11 rounded-xl border border-outline-variant text-on-surface font-bold flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>MEMOry 로그아웃</span>
                  </button>
                </div>
              ) : (
                <form
                  className="space-y-3"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    await onArchiveLogin(archiveEmail, archivePassword);
                    setArchivePassword('');
                  }}
                >
                  <label className="block text-xs font-bold text-on-surface-variant">
                    이메일
                    <input
                      value={archiveEmail}
                      onChange={(event) => setArchiveEmail(event.target.value)}
                      className="mt-1 w-full h-11 px-3 rounded-xl border border-outline-variant bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      type="email"
                      autoComplete="email"
                    />
                  </label>
                  <label className="block text-xs font-bold text-on-surface-variant">
                    비밀번호
                    <input
                      value={archivePassword}
                      onChange={(event) => setArchivePassword(event.target.value)}
                      className="mt-1 w-full h-11 px-3 rounded-xl border border-outline-variant bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      type="password"
                      autoComplete="current-password"
                    />
                  </label>
                  {archiveStatus && <p className="text-xs text-primary font-semibold">{archiveStatus}</p>}
                  <button
                    type="submit"
                    disabled={!supabaseConfigured || !archiveEmail.trim() || !archivePassword}
                    className="w-full h-11 rounded-xl bg-primary text-white font-bold disabled:opacity-40"
                  >
                    자료실 계정으로 로그인
                  </button>
                  <button
                    type="button"
                    disabled={!supabaseConfigured || !archiveEmail.trim()}
                    onClick={() => onArchivePasswordReset(archiveEmail)}
                    className="w-full h-10 rounded-xl text-primary font-bold hover:bg-primary/5 disabled:opacity-40"
                  >
                    비밀번호 재설정 메일 보내기
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <footer className="px-6 py-4 bg-surface-container-low dark:bg-surface-container-lowest border-t border-grid-line dark:border-outline/10 flex justify-end shrink-0">
          <button
            type="button"
            className="px-5 py-2.5 bg-primary text-white rounded-full text-sm font-bold hover:brightness-110 active:scale-95 transition-all shadow-soft cursor-pointer"
          >
            확인 및 저장
          </button>
        </footer>

      </div>
    </div>
  );
}
