import { supabase } from '../../supabase/client';
import type { Bookmark, BookmarkCategory, BookmarkDraft, SiteInfo } from './types';

function client() {
  if (!supabase) throw new Error('로그인이 필요합니다.');
  return supabase;
}

export function normalizeBookmarkUrl(value: string) {
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new Error('http:// 또는 https://로 시작하는 URL을 입력해 주세요.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.href.length > 4096) {
    throw new Error('올바른 HTTP 또는 HTTPS URL을 입력해 주세요.');
  }
  return url.href;
}

export async function loadBookmarks(userId: string) {
  const [codes, rows] = await Promise.all([
    client().from('common_codes').select('code,label').eq('code_group', 'BOOKMARK_CATEGORY').order('sort_order'),
    client().from('bookmarks').select('id,category_code,url,title,site_info,created_at').eq('user_id', userId).order('created_at', { ascending: false }),
  ]);
  if (codes.error) throw codes.error;
  if (rows.error) throw rows.error;
  return { categories: codes.data as BookmarkCategory[], bookmarks: rows.data as Bookmark[] };
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
