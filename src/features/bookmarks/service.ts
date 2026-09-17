import { supabase } from '../../supabase/client';
import type { Bookmark, BookmarkCode, BookmarkCodeDraft, BookmarkCodePatch, BookmarkDraft, SiteInfo } from './types';

export const BOOKMARK_CATEGORY_GROUP = 'BOOKMARK_CATEGORY';
const CODE_COLUMNS = 'code,label,sort_order,is_active';

function client() {
  if (!supabase) throw new Error('로그인이 필요합니다.');
  return supabase;
}

// 분류는 설정 화면에서 바뀌고 북마크 화면에서 쓰이므로, 저장 즉시 두 화면을 맞춘다.
const codeListeners = new Set<() => void>();

export function subscribeBookmarkCodes(listener: () => void) {
  codeListeners.add(listener);
  return () => { codeListeners.delete(listener); };
}

export function normalizeBookmarkUrl(value: string) {
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new Error('http:// 또는 https://로 시작하는 URL을 입력해 주세요.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.href.length > 4096) {
    throw new Error('올바른 HTTP 또는 HTTPS URL을 입력해 주세요.');
  }
  return url.href;
}

// 오래된 행이나 테스트 대역처럼 새 열이 빠진 응답도 활성 분류로 다룬다.
function toBookmarkCode(row: Partial<BookmarkCode>): BookmarkCode {
  return { code: String(row.code), label: String(row.label), sort_order: Number(row.sort_order) || 0, is_active: row.is_active !== false };
}

export async function loadBookmarkCodes() {
  const { data, error } = await client().from('common_codes').select(CODE_COLUMNS).eq('code_group', BOOKMARK_CATEGORY_GROUP).order('sort_order').order('label');
  if (error) throw error;
  return (data || []).map(toBookmarkCode);
}

export async function loadBookmarks(userId: string) {
  const [codes, rows] = await Promise.all([
    client().from('common_codes').select(CODE_COLUMNS).eq('code_group', BOOKMARK_CATEGORY_GROUP).order('sort_order').order('label'),
    client().from('bookmarks').select('id,category_code,url,title,site_info,created_at').eq('user_id', userId).order('created_at', { ascending: false }),
  ]);
  if (codes.error) throw codes.error;
  if (rows.error) throw rows.error;
  return { codes: (codes.data || []).map(toBookmarkCode), bookmarks: rows.data as Bookmark[] };
}

// 코드값은 북마크가 외래키로 참조하므로 등록 후 바꾸지 않는다. 표시 이름과 순서, 사용 여부만 수정한다.
export function normalizeBookmarkCodeDraft(draft: BookmarkCodeDraft): BookmarkCodeDraft {
  const code = draft.code.trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9_]{0,39}$/.test(code)) throw new Error('코드는 영문 대문자로 시작하는 40자 이내의 영문·숫자·밑줄 조합이어야 합니다.');
  return { code, ...normalizeBookmarkCodePatch(draft) };
}

export function normalizeBookmarkCodePatch(patch: BookmarkCodePatch): BookmarkCodePatch {
  const label = patch.label.trim();
  if (!label || label.length > 80) throw new Error('표시 이름은 1자 이상 80자 이하로 입력해 주세요.');
  const sortOrder = Math.round(Number(patch.sort_order));
  if (!Number.isFinite(sortOrder) || sortOrder < 0 || sortOrder > 9999) throw new Error('정렬 순서는 0 이상 9999 이하의 숫자로 입력해 주세요.');
  return { label, sort_order: sortOrder, is_active: Boolean(patch.is_active) };
}

export async function createBookmarkCode(draft: BookmarkCodeDraft) {
  const values = normalizeBookmarkCodeDraft(draft);
  const { data, error } = await client().from('common_codes').insert({ code_group: BOOKMARK_CATEGORY_GROUP, ...values }).select(CODE_COLUMNS).single();
  if (error) throw new Error(error.code === '23505' ? '이미 등록된 코드입니다. 다른 코드를 입력해 주세요.' : '분류를 저장하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.');
  codeListeners.forEach((listener) => listener());
  return toBookmarkCode(data as BookmarkCode);
}

export async function updateBookmarkCode(code: string, patch: BookmarkCodePatch) {
  const values = normalizeBookmarkCodePatch(patch);
  const { data, error } = await client().from('common_codes').update(values).eq('code_group', BOOKMARK_CATEGORY_GROUP).eq('code', code).select(CODE_COLUMNS).single();
  if (error) throw new Error('분류를 저장하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.');
  codeListeners.forEach((listener) => listener());
  return toBookmarkCode(data as BookmarkCode);
}

export async function saveBookmark(userId: string, draft: BookmarkDraft, id?: string) {
  const values = { ...draft, url: normalizeBookmarkUrl(draft.url), title: draft.title.trim() || '무제' };
  const query = id
    ? client().from('bookmarks').update(values).eq('user_id', userId).eq('id', id)
    : client().from('bookmarks').insert({ ...values, user_id: userId });
  const { data, error } = await query.select('id,category_code,url,title,site_info,created_at').single();
  if (error) throw error;
  return data as Bookmark;
}

export async function deleteBookmark(userId: string, id: string) {
  const { data, error } = await client().from('bookmarks').delete().eq('user_id', userId).eq('id', id).select('id').single();
  if (error) throw error;
  return data;
}

export async function fetchSiteInfo(url: string, signal?: AbortSignal): Promise<SiteInfo> {
  const { data, error } = await client().auth.getSession();
  if (error || !data.session) throw new Error('로그인이 필요합니다.');
  const response = await fetch('/api/bookmark-metadata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
    body: JSON.stringify({ url: normalizeBookmarkUrl(url) }),
    signal,
  });
  if (!response.ok) throw new Error('사이트 정보를 가져오지 못했습니다. 제목을 직접 입력해 저장할 수 있습니다.');
  return response.json();
}
