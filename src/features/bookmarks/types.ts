export interface BookmarkCategory {
  code: string;
  label: string;
}

export interface BookmarkCode extends BookmarkCategory {
  sort_order: number;
  is_active: boolean;
}

export type BookmarkCodeDraft = BookmarkCode;

export type BookmarkCodePatch = Omit<BookmarkCode, 'code'>;

export interface SiteInfo {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  type?: string;
  canonicalUrl?: string;
  fetchedAt?: string;
}

export interface Bookmark {
  id: string;
  category_code: string;
  url: string;
  title: string;
  site_info: SiteInfo;
  created_at: string;
}

export type BookmarkDraft = Pick<Bookmark, 'category_code' | 'url' | 'title' | 'site_info'>;
