import { execFileSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const productionUrl = process.env.VERCEL_PRODUCTION_URL?.replace(/\/$/, '');
if (!productionUrl) throw new Error('VERCEL_PRODUCTION_URL이 없어 사후검증을 중단합니다.');

// Bundle hashes cannot be compared: Vercel installs dependencies afresh, so its build
// legitimately differs from the local one byte for byte. The commit stamped into the
// HTML at build time identifies the deployed revision without that false negative.
const expectedCommit = process.env.EXPECTED_BUILD_COMMIT?.trim()
  || execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();

const response = await fetch(`${productionUrl}/?v=${Date.now()}`);
if (!response.ok) throw new Error(`운영 HTML 확인 실패: HTTP ${response.status}`);

const remoteHtml = await response.text();
const remoteCommit = remoteHtml.match(/<meta[^>]+name="build-commit"[^>]+content="([^"]*)"/)?.[1];

if (!remoteCommit) throw new Error('운영 HTML에 build-commit 마커가 없습니다. 배포가 갱신되지 않았을 수 있습니다.');
if (remoteCommit !== expectedCommit) {
  throw new Error(`운영 리비전 불일치: expected=${expectedCommit}, remote=${remoteCommit}`);
}

console.log(`Vercel 운영 배포 검증 통과: HTTP 200, commit=${remoteCommit}`);
