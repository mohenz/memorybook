import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Link, Plus, Search, X, Pencil, Trash2 } from 'lucide-react';
import { deleteBookmark, fetchSiteInfo, loadBookmarks, normalizeBookmarkUrl, saveBookmark, subscribeBookmarkCodes } from './service';
import type { Bookmark, BookmarkCategory, BookmarkCode, BookmarkDraft, SiteInfo } from './types';

const fieldClass = 'w-full rounded-xl border border-outline-variant bg-background px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary';
const primaryClass = 'rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-50';

function SitePreview({ info }: { info: SiteInfo }) {
  return (
    <div className="overflow-hidden rounded-xl border border-grid-line bg-surface-container-low">
      {info.image && /^https?:\/\//i.test(info.image) && (
        <img key={info.image} src={info.image} alt="" loading="lazy" referrerPolicy="no-referrer"
          className="h-32 w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
      )}
      <div className="space-y-1 p-3">
        {info.siteName && <p className="text-xs font-semibold text-outline break-words">{info.siteName}</p>}
        {info.description && <p className="line-clamp-3 break-words text-sm text-on-surface-variant">{info.description}</p>}
        {!info.description && !info.siteName && <p className="text-xs text-outline">수집된 사이트 정보가 없습니다.</p>}
      </div>
    </div>
  );
}

export function BookmarkForm({ bookmark, categories, onSave, onClose }: {
  key?: string;
  bookmark: Bookmark | null;
  categories: BookmarkCategory[];
  onSave: (draft: BookmarkDraft, id?: string) => Promise<void>;
  onClose: () => void;
}) {
  const [url, setUrl] = useState(bookmark?.url || '');
  const [title, setTitle] = useState(bookmark?.title || '');
  const [category, setCategory] = useState(bookmark?.category_code || categories[0]?.code || '');
  const [info, setInfo] = useState<SiteInfo>(bookmark?.site_info || {});
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const titleRef = useRef(title);
  const manualTitle = useRef(Boolean(bookmark));
  const attemptedUrl = useRef(bookmark?.url || '');
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);

  async function collect(target: string) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setFetching(true);
    setMessage('사이트 정보를 가져오는 중입니다.');
    try {
      const result = await fetchSiteInfo(target, controller.signal);
      if (controller.signal.aborted) return {};
      setInfo(result);
      attemptedUrl.current = target;
      if (!manualTitle.current) {
        titleRef.current = result.title || '무제';
        setTitle(titleRef.current);
      }
      setMessage('사이트 정보를 가져왔습니다. 제목은 직접 수정할 수 있습니다.');
      return result;
    } catch {
      if (!controller.signal.aborted) {
        attemptedUrl.current = target;
        setMessage('사이트 정보를 가져오지 못했습니다. 제목을 직접 입력해 저장할 수 있습니다.');
      }
      return {};
    } finally {
      if (request.current === controller) setFetching(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving || fetching) return;
    setError('');
    try {
      const target = normalizeBookmarkUrl(url);
      if (!categories.some((item) => item.code === category)) throw new Error('분류를 선택해 주세요.');
      setSaving(true);
      const siteInfo = attemptedUrl.current === target ? info : await collect(target);
      await onSave({ url: target, title: titleRef.current.trim() || '무제', category_code: category, site_info: siteInfo }, bookmark?.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '저장하지 못했습니다. 다시 시도해 주세요.');
    } finally { setSaving(false); }
  }

  return (
    <section aria-label={bookmark ? '북마크 수정' : '북마크 등록'} className="w-full shrink-0 border-b border-grid-line bg-background p-5 lg:w-80 lg:border-b-0 lg:border-l xl:w-96">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-bold">{bookmark ? '북마크 수정' : '북마크 등록'}</h2>
        <button type="button" aria-label="북마크 폼 닫기" disabled={saving} onClick={onClose} className="rounded-lg p-2 hover:bg-surface"><X size={18} /></button>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block space-y-1.5 text-sm font-semibold">URL링크분류
          <select value={category} onChange={(event) => setCategory(event.target.value)} disabled={saving} required className={fieldClass}>
            {categories.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
          </select>
        </label>
        <label className="block space-y-1.5 text-sm font-semibold">URL
          <input type="url" required maxLength={4096} value={url} disabled={saving} placeholder="https://example.com" autoFocus
            onChange={(event) => {
              request.current?.abort();
              setFetching(false);
              setUrl(event.target.value);
              setInfo({});
              setMessage('');
              attemptedUrl.current = '';
              if (!manualTitle.current) { setTitle(''); titleRef.current = ''; }
            }} className={fieldClass} />
        </label>
        <button type="button" disabled={saving || fetching || !url.trim()} className="w-full rounded-xl border border-outline-variant px-3 py-2 text-sm font-semibold disabled:opacity-50"
          onClick={() => { setError(''); try { void collect(normalizeBookmarkUrl(url)); } catch (cause) { setError((cause as Error).message); } }}>
          {fetching ? '사이트 정보 가져오는 중…' : '사이트 정보 가져오기'}
        </button>
        <label className="block space-y-1.5 text-sm font-semibold">TITLE
          <input value={title} maxLength={500} disabled={saving} placeholder="자동으로 입력됩니다. 없으면 무제" onChange={(event) => {
            manualTitle.current = true;
            titleRef.current = event.target.value;
            setTitle(event.target.value);
          }} className={fieldClass} />
        </label>
        <p className="text-xs text-outline">제목을 직접 입력할 수 있습니다. 제목이 없으면 ‘무제’로 저장합니다.</p>
        <div className="space-y-2"><h3 className="text-sm font-semibold">사이트정보</h3><SitePreview info={info} /></div>
        <p role="status" className="text-xs text-on-surface-variant">{message}</p>
        {error && <p role="alert" className="text-sm text-error">{error}</p>}
        {bookmark && <p className="text-xs text-outline">등록일자 {new Date(bookmark.created_at).toLocaleString('ko-KR')}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" disabled={saving} onClick={onClose} className="rounded-xl px-4 py-2 text-sm">취소</button>
          <button disabled={saving || fetching || !categories.length} className={primaryClass}>{saving ? '저장 중…' : '저장'}</button>
        </div>
      </form>
    </section>
  );
}

export default function BookmarkView({ userId }: { key?: string; userId: string }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [codes, setCodes] = useState<BookmarkCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState<{ bookmark: Bookmark | null } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);
    setEditor(null);
    loadBookmarks(userId).then((result) => {
      if (!active) return;
      setBookmarks(result.bookmarks);
      setCodes(result.codes);
    }).catch(() => { if (active) setLoadError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId, revision]);
  // 설정 화면에서 분류를 바꾸면 다시 열지 않아도 목록과 등록 폼에 반영한다.
  useEffect(() => subscribeBookmarkCodes(() => setRevision((value) => value + 1)), []);
  // 미사용 분류라도 이미 그 분류로 저장한 북마크가 있으면 이름과 필터를 남겨 둔다.
  const used = new Set(bookmarks.map((item) => item.category_code));
  const activeCategories: BookmarkCategory[] = codes.filter((item) => item.is_active);
  const filterCategories: BookmarkCategory[] = codes.filter((item) => item.is_active || used.has(item.code));
  const visible = bookmarks.filter((item) => (!category || item.category_code === category)
    && `${item.title} ${item.url} ${item.site_info?.description || ''}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));

  // 수정 중인 북마크의 분류가 미사용으로 바뀌었어도 저장만으로 분류가 바뀌지 않게 선택지에 남긴다.
  function formCategories(bookmark: Bookmark | null): BookmarkCategory[] {
    const current = bookmark && codes.find((item) => item.code === bookmark.category_code && !item.is_active);
    return current ? [...activeCategories, current] : activeCategories;
  }

  async function save(draft: BookmarkDraft, id?: string) {
    try {
      const saved = await saveBookmark(userId, draft, id);
      setBookmarks((previous) => id ? previous.map((item) => item.id === id ? saved : item) : [saved, ...previous]);
      setEditor(null);
      setCategory('');
      setQuery('');
      setStatus('북마크를 저장했습니다.');
    } catch { throw new Error('북마크를 저장하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.'); }
  }

  async function remove(item: Bookmark) {
    if (!window.confirm(`‘${item.title}’ 북마크를 삭제하시겠습니까?`)) return;
    setDeleting(item.id);
    try {
      await deleteBookmark(userId, item.id);
      setBookmarks((previous) => previous.filter((row) => row.id !== item.id));
      setStatus('북마크를 삭제했습니다.');
    } catch { setStatus('삭제하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.'); }
    finally { setDeleting(null); }
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background text-on-surface">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-grid-line p-4 md:px-6">
        <h1 className="text-xl font-bold">북마크</h1>
        <button className={`${primaryClass} flex items-center gap-1.5`} disabled={loading || loadError || !activeCategories.length || Boolean(editor)} onClick={() => { setStatus(''); setEditor({ bookmark: null }); }}><Plus size={17} />북마크 등록</button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        {editor && <div className="shrink-0 lg:order-2 lg:overflow-y-auto"><BookmarkForm key={editor.bookmark?.id || 'new'} bookmark={editor.bookmark} categories={formCategories(editor.bookmark)} onSave={save} onClose={() => setEditor(null)} /></div>}
        <section aria-label="북마크 목록" className="min-w-0 flex-1 p-4 lg:overflow-y-auto md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2" aria-label="북마크 분류 필터">
              {[{ code: '', label: '전체' }, ...filterCategories].map((item) => <button key={item.code} aria-pressed={category === item.code} onClick={() => setCategory(item.code)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${category === item.code ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface-variant'}`}>{item.label}</button>)}
            </div>
            <label className="relative w-full sm:w-64"><Search size={16} className="absolute left-3 top-3 text-outline" /><input aria-label="북마크 검색" placeholder="URL 또는 제목 검색" value={query} onChange={(event) => setQuery(event.target.value)} className={`${fieldClass} pl-9`} /></label>
          </div>
          <p role="status" className="mb-3 text-sm text-on-surface-variant">{loading ? '북마크를 불러오는 중입니다.' : status}</p>
          {loadError ? <div role="alert" className="rounded-xl border border-grid-line p-6"><p>북마크를 불러오지 못했습니다.</p><button className={`${primaryClass} mt-3`} onClick={() => setRevision((value) => value + 1)}>다시 시도</button></div>
            : !loading && <>
              {!activeCategories.length && <p role="alert" className="mb-4 text-sm text-error">사용 중인 북마크 분류가 없습니다. 설정 &gt; 분류에서 URL링크분류를 추가해 주세요.</p>}
              <p className="mb-4 text-xs text-outline">{visible.length}개의 북마크 · 등록일 최신순</p>
              {!visible.length ? <div className="rounded-xl border border-dashed border-outline-variant px-4 py-16 text-center text-on-surface-variant"><Link className="mx-auto mb-3" /><p>{query || category ? '검색 조건에 맞는 북마크가 없습니다.' : '저장된 북마크가 없습니다.'}</p><p className="mt-2 text-sm">{query || category ? '검색어나 분류를 변경해 보세요.' : '다시 보고 싶은 URL을 등록해 보세요.'}</p></div>
                : <div className={`grid grid-cols-1 gap-4 ${editor ? 'xl:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-3'}`}>
                  {visible.map((item) => <article key={item.id} className="flex min-w-0 flex-col gap-3 rounded-xl border border-grid-line bg-surface-container-lowest p-4">
                    <span className="w-fit rounded-md bg-surface px-2 py-1 text-xs font-semibold">{codes.find((value) => value.code === item.category_code)?.label || item.category_code}</span>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="group break-words"><h2 className="font-bold group-hover:underline">{item.title} <ExternalLink size={13} className="inline" /></h2><p className="mt-1 truncate text-xs text-outline">{item.url}</p></a>
                    <SitePreview info={item.site_info || {}} />
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-grid-line pt-3">
                      <time dateTime={item.created_at} className="text-[11px] text-outline">등록일자 {new Date(item.created_at).toLocaleString('ko-KR')}</time>
                      <div className="flex gap-1"><button aria-label={`${item.title} 수정`} disabled={Boolean(editor) || Boolean(deleting)} onClick={() => setEditor({ bookmark: item })} className="rounded-lg p-2 hover:bg-surface disabled:opacity-40"><Pencil size={15} /></button><button aria-label={`${item.title} 삭제`} disabled={Boolean(deleting) || Boolean(editor)} onClick={() => void remove(item)} className="rounded-lg p-2 text-error hover:bg-surface disabled:opacity-40"><Trash2 size={15} /></button></div>
                    </div>
                  </article>)}
                </div>}
            </>}
        </section>
      </div>
    </div>
  );
}
