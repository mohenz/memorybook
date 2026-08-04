import { useState } from 'react';
import { CalendarClock, LayoutGrid, Table2, X } from 'lucide-react';
import { PopupScheduleData } from '../utils/scheduleFilter';
import PopupCardView from './PopupCardView';
import PopupTableView from './PopupTableView';

export default function SchedulePopupModal({ data, onClose }: { data: PopupScheduleData; onClose: (dontShowToday: boolean) => void }) {
  const [view, setView] = useState<'table' | 'card'>('table');
  const [dontShowToday, setDontShowToday] = useState(false);
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-labelledby="schedule-popup-title" className="flex max-h-[90vh] w-[920px] max-w-full flex-col overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-grid-line px-5 py-4">
          <div className="flex items-center gap-3"><span className="rounded-xl bg-primary/10 p-2 text-primary"><CalendarClock className="h-5 w-5" /></span><div><h2 id="schedule-popup-title" className="text-lg font-extrabold text-on-surface">오늘의 주요 일정</h2><p className="text-xs text-on-surface-variant">오늘부터 3일간의 일정을 확인하세요.</p></div></div>
          <button type="button" aria-label="주요 일정 팝업 닫기" onClick={() => onClose(dontShowToday)} className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high"><X className="h-5 w-5" /></button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-5">
          <div className="mb-4 flex w-fit rounded-xl bg-surface-container-low p-1">
            <button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold ${view === 'table' ? 'bg-primary text-white shadow-soft' : 'text-on-surface-variant'}`}><Table2 className="h-4 w-4" />표 보기</button>
            <button type="button" aria-pressed={view === 'card'} onClick={() => setView('card')} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold ${view === 'card' ? 'bg-primary text-white shadow-soft' : 'text-on-surface-variant'}`}><LayoutGrid className="h-4 w-4" />카드 보기</button>
          </div>
          {view === 'table' ? <PopupTableView data={data} /> : <PopupCardView data={data} />}
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-grid-line bg-surface-container-low px-5 py-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-on-surface-variant"><input type="checkbox" checked={dontShowToday} onChange={(event) => setDontShowToday(event.target.checked)} className="h-4 w-4 accent-primary" />오늘 그만보기</label>
          <button type="button" onClick={() => onClose(dontShowToday)} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-soft">닫기</button>
        </footer>
      </section>
    </div>
  );
}
