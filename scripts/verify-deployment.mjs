import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const productionUrl = process.env.VERCEL_PRODUCTION_URL?.replace(/\/$/, '');
if (!productionUrl) throw new Error('VERCEL_PRODUCTION_URL이 없어 사후검증을 중단합니다.');

const localHtml = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
const localBundlePath = localHtml.match(/assets\/index-[^"']+\.js/)?.[0];
const response = await fetch(`${productionUrl}/?v=${Date.now()}`);
if (!response.ok) throw new Error(`운영 HTML 확인 실패: HTTP ${response.status}`);
const remoteHtml = await response.text();
const remoteBundlePath = remoteHtml.match(/assets\/index-[^"']+\.js/)?.[0];
if (!localBundlePath || remoteBundlePath !== localBundlePath) throw new Error(`운영 번들 불일치: local=${localBundlePath}, remote=${remoteBundlePath}`);
console.log(`Vercel 운영 배포 검증 통과: HTTP 200, bundle=${remoteBundlePath}`);
