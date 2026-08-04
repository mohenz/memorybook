const DEFAULT_ARCHIVE_STORE_URL = 'http://localhost:5174/';

export function getArchiveStoreUrl() {
  return (import.meta.env.VITE_ARCHIVE_STORE_URL || DEFAULT_ARCHIVE_STORE_URL).trim();
}

export function openArchiveStore() {
  window.open(getArchiveStoreUrl(), '_blank', 'noopener,noreferrer');
}
