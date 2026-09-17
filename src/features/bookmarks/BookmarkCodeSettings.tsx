import React, { useEffect, useState } from 'react';
import { Link, Plus } from 'lucide-react';
import { createBookmarkCode, loadBookmarkCodes, updateBookmarkCode } from './service';
import type { BookmarkCode } from './types';

const fieldClass = 'h-9 rounded-lg border border-outline-variant/40 bg-background px-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary';
const primaryClass = 'shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-on-primary disabled:opacity-40';

function message(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function BookmarkCodeRow({ item, onSave }: { key?: string; item: BookmarkCode; onSave: (patch: BookmarkCode) => Promise<void> }) {
  const [label, setLabel] = useState(item.label);
  const [sortOrder, setSortOrder] = useState(String(item.sort_order));
  const [isActive, setIsActive] = useState(item.is_active);
  const [saving, setSaving] = useState(false);
  const dirty = label !== item.label || sortOrder !== String(item.sort_order) || isActive !== item.is_active;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave({ code: item.code, label, sort_order: Number(sortOrder), is_active: isActive });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      aria-label={`${item.code} 분류`}
      className={`flex flex-wrap items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface px-3 py-2 dark:bg-surface-container-lowest ${isActive ? '' : 'opacity-60'}`}
    >
      <span className="shrink-0 rounded-md bg-primary/10 px-2 py-1 font-mono text-[11px] font-bold text-primary">{item.code}</span>
      <input
        aria-label={`${item.code} 표시 이름`}
        value={label}
        maxLength={80}
        disabled={saving}
        onChange={(event) => setLabel(event.target.value)}
        className={`${fieldClass} min-w-0 flex-1 font-semibold`}
      />
      <input
        type="number"
        aria-label={`${item.code} 정렬 순서`}
        value={sortOrder}
        min={0}
        max={9999}
        disabled={saving}
        onChange={(event) => setSortOrder(event.target.value)}
        className={`${fieldClass} w-16 shrink-0`}
      />
      <button
        type="button"
        role="switch"
        aria-checked={isActive}
        aria-label={`${item.code} 사용 여부`}
        disabled={saving}
        onClick={() => setIsActive((value) => !value)}
        className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold ${isActive ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}
      >
        {isActive ? '사용' : '미사용'}
      </button>
      <button type="submit" disabled={saving || !dirty} className={primaryClass}>{saving ? '저장 중…' : '저장'}</button>
    </form>
  );
}

export default function BookmarkCodeSettings() {
  const [codes, setCodes] = useState<BookmarkCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [adding, setAdding] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    loadBookmarkCodes()
      .then((rows) => { if (active) setCodes(rows); })
      .catch(() => { if (active) setError('분류를 불러오지 못했습니다. 연결을 확인하고 다시 시도해 주세요.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);

  // 정렬 순서를 바꾸면 목록도 곧바로 북마크 화면과 같은 순서로 보여준다.
  function sortCodes(rows: BookmarkCode[]) {
    return [...rows].sort((first, second) => first.sort_order - second.sort_order || first.label.localeCompare(second.label, 'ko'));
  }

  const nextSortOrder = codes.length ? Math.min(9999, Math.max(...codes.map((item) => item.sort_order)) + 10) : 10;

  async function add(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setStatus('');
    setAdding(true);
    try {
      const saved = await createBookmarkCode({ code, label, sort_order: Number(sortOrder || nextSortOrder), is_active: true });
      setCodes((previous) => sortCodes([...previous, saved]));
      setCode('');
      setLabel('');
      setSortOrder('');
      setStatus(`‘${saved.label}’ 분류를 추가했습니다.`);
    } catch (cause) {
      setError(message(cause, '분류를 추가하지 못했습니다.'));
    } finally {
      setAdding(false);
    }
  }

  async function save(patch: BookmarkCode) {
    setError('');
    setStatus('');
    try {
      const saved = await updateBookmarkCode(patch.code, patch);
      setCodes((previous) => sortCodes(previous.map((item) => (item.code === saved.code ? saved : item))));
      setStatus(`‘${saved.label}’ 분류를 저장했습니다.`);
    } catch (cause) {
      setError(message(cause, '분류를 저장하지 못했습니다.'));
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-outline-variant/30 bg-surface p-4 text-xs leading-relaxed text-on-surface-variant dark:bg-surface-container-lowest">
        <span className="mb-1 block font-bold text-primary">URL링크분류 공통코드 관리</span>
        북마크 등록 화면의 분류 목록입니다. 정렬 순서가 작을수록 앞에 나옵니다. 코드값은 기존 북마크가 참조하므로 등록 후에는 바꿀 수 없고, 쓰지 않는 분류는 미사용으로 바꾸면 새 북마크에서 선택되지 않습니다. 이미 그 분류로 저장한 북마크는 그대로 남습니다.
      </div>

      <form onSubmit={add} className="space-y-2 rounded-2xl border border-outline-variant/30 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="min-w-0 flex-1 text-[11px] font-bold text-on-surface-variant">코드
            <input
              aria-label="추가할 분류 코드"
              value={code}
              maxLength={40}
              required
              placeholder="TRAVEL"
              disabled={adding}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              className={`${fieldClass} mt-1 w-full font-mono`}
            />
          </label>
          <label className="min-w-0 flex-1 text-[11px] font-bold text-on-surface-variant">표시 이름
            <input
              aria-label="추가할 분류 표시 이름"
              value={label}
              maxLength={80}
              required
              placeholder="여행"
              disabled={adding}
              onChange={(event) => setLabel(event.target.value)}
              className={`${fieldClass} mt-1 w-full font-semibold`}
            />
          </label>
          <label className="w-20 shrink-0 text-[11px] font-bold text-on-surface-variant">정렬 순서
            <input
              type="number"
              aria-label="추가할 분류 정렬 순서"
              value={sortOrder}
              min={0}
              max={9999}
              placeholder={String(nextSortOrder)}
              disabled={adding}
              onChange={(event) => setSortOrder(event.target.value)}
              className={`${fieldClass} mt-1 w-full`}
            />
          </label>
        </div>
        <button type="submit" disabled={adding || loading} className={`${primaryClass} flex w-full items-center justify-center gap-1.5 py-2.5`}>
          <Plus className="h-3.5 w-3.5" />{adding ? '추가하는 중…' : '분류 추가'}
        </button>
      </form>

      <p role="status" className="text-xs font-semibold text-on-surface-variant">{loading ? '분류를 불러오는 중입니다.' : status}</p>
      {error && <p role="alert" className="text-xs font-semibold text-error">{error}</p>}

      {!loading && (codes.length ? (
        <div className="space-y-2">
          {codes.map((item) => <BookmarkCodeRow key={item.code} item={item} onSave={save} />)}
        </div>
      ) : (
        <div className="py-10 text-center opacity-50">
          <Link className="mx-auto mb-2 h-8 w-8 text-outline" />
          <p className="text-xs font-semibold text-on-surface-variant">등록된 분류가 없습니다.</p>
          <button type="button" onClick={() => setRevision((value) => value + 1)} className="mt-3 text-xs font-bold text-primary underline">다시 불러오기</button>
        </div>
      ))}
    </div>
  );
}
