import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MobileFileListScreen, { ArchiveFile } from './MobileFileListScreen';

const buildFile = (overrides: Partial<ArchiveFile> = {}): ArchiveFile => ({
  id: 'file-1',
  filename: '회의록.pdf',
  mimeType: 'application/pdf',
  size: 245_000,
  category: 'document',
  downloadUrl: 'https://example.com/file.pdf',
  uploadedAt: { toDate: () => new Date(2026, 6, 25) },
  ...overrides,
});

const noop = () => undefined;

describe('MobileFileListScreen', () => {
  it('renders the file name and size', () => {
    const markup = renderToStaticMarkup(
      <MobileFileListScreen
        files={[buildFile()]}
        loading={false}
        onSelectFile={noop}
        onUploadFile={noop}
        uploadingFile={null}
        uploadProgress={0}
        uploadFailed={false}
        onRetryUpload={noop}
        profileImage="https://example.com/avatar.png"
        onOpenSettings={noop}
      />
    );

    expect(markup).toContain('회의록.pdf');
    expect(markup).toContain('KB');
    expect(markup).toContain('flex-1 flex flex-col min-h-0 relative overflow-hidden');
    expect(markup).toContain('overflow-y-auto custom-scrollbar pb-20');
    expect(markup).toContain('absolute bottom-4 right-4 z-20');
  });

  it('shows the empty-list message when there are no files', () => {
    const markup = renderToStaticMarkup(
      <MobileFileListScreen
        files={[]}
        loading={false}
        onSelectFile={noop}
        onUploadFile={noop}
        uploadingFile={null}
        uploadProgress={0}
        uploadFailed={false}
        onRetryUpload={noop}
        profileImage="https://example.com/avatar.png"
        onOpenSettings={noop}
      />
    );

    expect(markup).toContain('파일이 없습니다');
  });

  it('shows an upload progress panel while a file is uploading', () => {
    const uploadingFile = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    const markup = renderToStaticMarkup(
      <MobileFileListScreen
        files={[]}
        loading={false}
        onSelectFile={noop}
        onUploadFile={noop}
        uploadingFile={uploadingFile}
        uploadProgress={40}
        uploadFailed={false}
        onRetryUpload={noop}
        profileImage="https://example.com/avatar.png"
        onOpenSettings={noop}
      />
    );

    expect(markup).toContain('photo.jpg');
    expect(markup).toContain('업로드 중');
  });

  it('shows a retry action when the upload failed', () => {
    const uploadingFile = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    const markup = renderToStaticMarkup(
      <MobileFileListScreen
        files={[]}
        loading={false}
        onSelectFile={noop}
        onUploadFile={noop}
        uploadingFile={uploadingFile}
        uploadProgress={0}
        uploadFailed
        onRetryUpload={noop}
        profileImage="https://example.com/avatar.png"
        onOpenSettings={noop}
      />
    );

    expect(markup).toContain('업로드 실패');
    expect(markup).toContain('다시 시도');
  });
});
