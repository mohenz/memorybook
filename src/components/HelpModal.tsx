import { Archive, Calendar, FileText, Folder, ListTodo, Tag, X } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

const HELP_ITEMS = [
  { icon: FileText, title: '메모', description: '새 메모를 작성하고 이미지와 체크리스트를 함께 기록할 수 있습니다.' },
  { icon: Folder, title: '그룹', description: '메모 작성·수정 시 그룹을 선택하고 폴더별로 모아볼 수 있습니다.' },
  { icon: Calendar, title: '캘린더', description: '월간·주간·일간 화면에서 일정을 등록하고 시간대별로 확인할 수 있습니다.' },
  { icon: ListTodo, title: 'TO-DO LIST', description: '메모에 등록한 할 일을 예정·진행·완료 상태로 관리할 수 있습니다.' },
  { icon: Tag, title: '태그 및 검색', description: '검색어와 그룹, 이미지, 즐겨찾기 조건으로 필요한 메모를 찾을 수 있습니다.' },
  { icon: Archive, title: '자료실', description: '계정에 연결된 파일을 업로드하고 필요한 자료를 확인할 수 있습니다.' },
];

export default function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[calc(100dvh-2rem)] w-[560px] max-w-full flex-col overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest shadow-2xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-grid-line px-5 py-4">
          <div>
            <h2 id="help-title" className="text-lg font-extrabold text-on-surface">도움말</h2>
            <p className="mt-0.5 text-xs text-on-surface-variant">MEMOry의 주요 기능을 간단히 안내합니다.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="도움말 닫기" className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-high">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-5 custom-scrollbar sm:grid-cols-2">
          {HELP_ITEMS.map(({ icon: Icon, title, description }) => (
            <article key={title} className="rounded-2xl border border-outline-variant/40 bg-surface p-4">
              <div className="mb-2 flex items-center gap-2 text-primary">
                <Icon className="h-4.5 w-4.5" />
                <h3 className="text-sm font-bold">{title}</h3>
              </div>
              <p className="text-xs leading-5 text-on-surface-variant">{description}</p>
            </article>
          ))}
        </div>

        <footer className="flex shrink-0 justify-end border-t border-grid-line px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white shadow-soft">
            확인
          </button>
        </footer>
      </section>
    </div>
  );
}
