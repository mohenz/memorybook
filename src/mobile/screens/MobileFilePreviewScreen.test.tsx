import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MobileFilePreviewScreen from './MobileFilePreviewScreen';
import { ArchiveFile } from './MobileFileListScreen';

const buildFile = (overrides: Partial<ArchiveFile> = {}): ArchiveFile => ({
  id: 'file-1',
  filename: '사진.jpg',
  mimeType: 'image/jpeg',
  size: 120_000,
  category: 'image',
  downloadUrl: 'https://example.com/photo.jpg',
  uploadedAt: null,
  ...overrides,
});

describe('MobileFilePreviewScreen', () => {
  it('renders an image preview for image files', () => {
    const markup = renderToStaticMarkup(<MobileFilePreviewScreen file={buildFile()} onBack={() => undefined} />);

    expect(markup).toContain('<img');
    expect(markup).toContain('사진.jpg');
  });

  it('renders a filename, size and download action for non-previewable files', () => {
    const file = buildFile({
      filename: 'backup.zip',
      mimeType: 'application/zip',
      category: 'other',
      size: 5_000_000,
    });
    const markup = renderToStaticMarkup(<MobileFilePreviewScreen file={file} onBack={() => undefined} />);

    expect(markup).not.toContain('<img');
    expect(markup).toContain('backup.zip');
    expect(markup).toContain('다운로드');
    expect(markup).not.toContain('새 탭에서 열기');
  });

  it('offers an open-in-new-tab action for pdf files', () => {
    const file = buildFile({
      filename: '계약서.pdf',
      mimeType: 'application/pdf',
      category: 'document',
    });
    const markup = renderToStaticMarkup(<MobileFilePreviewScreen file={file} onBack={() => undefined} />);

    expect(markup).toContain('새 탭에서 열기');
  });
});
