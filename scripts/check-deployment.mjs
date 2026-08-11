import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const expectedProjectRef = 'bmvyiwnokuhbkjtimygy';
const expectedUrl = `https://${expectedProjectRef}.supabase.co`;
const allowNoGit = process.argv.includes('--allow-no-git');
config({ path: path.join(root, '.env.local'), quiet: true });

if (process.env.VITE_SUPABASE_URL !== expectedUrl) throw new Error(`Supabase URL은 ${expectedUrl}이어야 합니다.`);
if (!process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.startsWith('sb_publishable_')) throw new Error('Supabase publishable key가 없습니다.');
if (process.env.VITE_DATA_BACKEND !== 'supabase') throw new Error('VITE_DATA_BACKEND는 supabase여야 합니다.');

const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
if (vercel.outputDirectory !== 'dist' || vercel.framework !== 'vite') throw new Error('Vercel Vite/dist 설정이 올바르지 않습니다.');

const indexHtml = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
const bundlePath = indexHtml.match(/assets\/index-[^"']+\.js/)?.[0];
if (!bundlePath) throw new Error('dist/index.html에서 JavaScript 번들을 찾지 못했습니다.');
const bundle = fs.readFileSync(path.join(root, 'dist', bundlePath), 'utf8');
if (!bundle.includes(expectedProjectRef)) throw new Error('프로덕션 번들에 memorybook Supabase 프로젝트가 없습니다.');
if (/sb_secret_[A-Za-z0-9_-]{20,}/.test(bundle) || bundle.includes('pooler.supabase.com')) {
  throw new Error('프로덕션 번들에 서버 전용 비밀정보가 포함됐습니다.');
}

// The post-deploy check identifies the running revision by this marker, so a build
// without it would leave the deployment unverifiable.
const buildCommit = indexHtml.match(/<meta[^>]+name="build-commit"[^>]+content="([^"]*)"/)?.[1];
if (!buildCommit || buildCommit === 'unknown') throw new Error('dist/index.html에 build-commit 마커가 없습니다.');

if (!allowNoGit) {
  if (!fs.existsSync(path.join(root, '.git'))) throw new Error('독립 Git 저장소가 없어 배포를 중단합니다.');
  const status = execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
  if (status.trim()) throw new Error('커밋되지 않은 변경사항이 있어 배포를 중단합니다.');
  execFileSync('git', ['rev-parse', '--abbrev-ref', '@{u}'], { cwd: root, stdio: 'ignore' });

  const headCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  if (buildCommit !== headCommit) throw new Error(`빌드 리비전이 HEAD와 다릅니다: build=${buildCommit}, HEAD=${headCommit}`);
}

console.log(`Vercel 배포 사전검증 통과: project=${expectedProjectRef}, bundle=${bundlePath}, commit=${buildCommit}`);
