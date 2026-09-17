import { lookup } from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import ipaddr from 'ipaddr.js';
import { loadBuffer } from 'cheerio';
import type { SiteInfo } from '../src/features/bookmarks/types';

export function isPublicAddress(address: string) {
  try { return ipaddr.process(address).range() === 'unicast'; } catch { return false; }
}

export function validateTarget(value: string) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port || url.href.length > 4096) {
    throw new Error('지원하지 않는 URL입니다.');
  }
  return url;
}

function safeUrl(value: string | undefined, base: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value, base);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return undefined;
    return url.href.slice(0, 4096);
  } catch { return undefined; }
}

export function parseMetadata(html: Buffer, baseUrl: string, charset?: string): SiteInfo {
  const $ = loadBuffer(html, { encoding: { defaultEncoding: 'utf-8', transportLayerEncodingLabel: charset } });
  const meta = new Map<string, string>();
  $('head meta').each((_, element) => {
    const key = ($(element).attr('property') || $(element).attr('name') || '').toLowerCase();
    const value = $(element).attr('content')?.trim();
    if (value && !meta.has(key)) meta.set(key, value);
  });
  return {
    title: (meta.get('og:title') || $('head title').first().text().trim() || '무제').slice(0, 500),
    description: (meta.get('og:description') || meta.get('description') || '').slice(0, 2000),
    image: safeUrl(meta.get('og:image:secure_url') || meta.get('og:image'), baseUrl),
    siteName: (meta.get('og:site_name') || new URL(baseUrl).hostname).slice(0, 300),
    type: (meta.get('og:type') || '').slice(0, 100),
    canonicalUrl: safeUrl(meta.get('og:url'), baseUrl) || baseUrl,
    fetchedAt: new Date().toISOString(),
  };
}

async function requestPage(url: URL, signal: AbortSignal): Promise<{ redirect?: string; html?: Buffer; charset?: string }> {
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = await lookup(host, { all: true });
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) throw new Error('접근할 수 없는 주소입니다.');
  signal.throwIfAborted();
  const chosen = addresses[0];
  return new Promise((resolve, reject) => {
    const request = (url.protocol === 'https:' ? https : http).get(url, {
      agent: false,
      signal,
      // Pin the validated address to this connection to prevent DNS rebinding.
      lookup: (_hostname, options, callback) => {
        if (options.all) callback(null, [chosen]);
        else callback(null, chosen.address, chosen.family);
      },
      headers: { 'User-Agent': 'MEMOryBookmark/1.0', Accept: 'text/html,application/xhtml+xml', 'Accept-Encoding': 'identity' },
    }, (response) => {
      const status = response.statusCode || 0;
      if ([301, 302, 303, 307, 308].includes(status) && response.headers.location) {
        response.destroy();
        resolve({ redirect: response.headers.location });
        return;
      }
      if (status < 200 || status >= 300 || !/^(text\/html|application\/xhtml\+xml)\b/i.test(response.headers['content-type'] || '')) {
        response.destroy();
        reject(new Error('HTML 페이지를 읽을 수 없습니다.'));
        return;
      }
      let size = 0;
      const chunks: Buffer[] = [];
      response.on('data', (chunk: Buffer) => {
        size += chunk.length;
        if (size > 1024 * 1024) {
          response.destroy(new Error('페이지가 너무 큽니다.'));
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => resolve({ html: Buffer.concat(chunks), charset: response.headers['content-type']?.match(/charset=["']?([^\s;"']+)/i)?.[1] }));
      response.on('error', reject);
    });
    request.on('error', reject);
  });
}

export async function crawlMetadata(value: string): Promise<SiteInfo> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { controller.abort(); reject(new Error('사이트 응답 시간이 초과되었습니다.')); }, 8000);
  });
  const crawl = async () => {
    let url = validateTarget(value);
    for (let redirects = 0; redirects <= 4; redirects++) {
      const result = await requestPage(url, controller.signal);
      if (result.html) return parseMetadata(result.html, url.href, result.charset);
      url = validateTarget(new URL(result.redirect!, url).href);
    }
    throw new Error('리디렉션이 너무 많습니다.');
  };
  try { return await Promise.race([crawl(), deadline]); } finally { clearTimeout(timer!); }
}
