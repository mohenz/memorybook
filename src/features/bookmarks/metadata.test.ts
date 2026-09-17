import { describe, expect, it } from 'vitest';
import { isPublicAddress, parseMetadata, validateTarget } from '../../../server/bookmarkMetadata';
import { normalizeBookmarkUrl } from './service';

describe('bookmark metadata', () => {
  it('prefers OG, decodes entities, and resolves relative images', () => {
    const info = parseMetadata(Buffer.from(`<html><head><title>Fallback</title>
      <meta content='OG &amp; title' property='og:title'>
      <meta property="og:description" content="설명">
      <meta property="og:image" content="/cover.png">
      <meta property="og:site_name" content="Example"></head></html>`), 'https://example.com/article');
    expect(info).toMatchObject({ title: 'OG & title', description: '설명', image: 'https://example.com/cover.png', siteName: 'Example' });
  });
  it('falls back to the HTML title then 무제 and rejects unsafe metadata URLs', () => {
    expect(parseMetadata(Buffer.from('<title>제목</title>'), 'https://example.com').title).toBe('제목');
    expect(parseMetadata(Buffer.from('<meta property="og:image" content="javascript:alert(1)">'), 'https://example.com')).toMatchObject({ title: '무제', image: undefined });
  });
  it.each(['127.0.0.1', '10.0.0.1', '172.16.0.1', '192.168.0.1', '169.254.169.254', '0.0.0.0', '100.64.0.1', '::1', 'fc00::1', 'fe80::1', '::ffff:127.0.0.1', '224.0.0.1'])('blocks non-public address %s', (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });
  it('allows public addresses only and rejects unsupported targets', () => {
    expect(isPublicAddress('8.8.8.8')).toBe(true);
    expect(isPublicAddress('2606:4700:4700::1111')).toBe(true);
    for (const url of ['file:///etc/passwd', 'https://user:pass@example.com', 'http://example.com:8080']) {
      expect(() => validateTarget(url)).toThrow();
    }
  });
  it('validates user input without guessing a scheme', () => {
    expect(normalizeBookmarkUrl(' https://example.com ')).toBe('https://example.com/');
    for (const url of ['example.com', 'javascript:alert(1)', 'ftp://example.com', 'https://user:pass@example.com']) {
      expect(() => normalizeBookmarkUrl(url)).toThrow();
    }
  });
});
