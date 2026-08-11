import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function git(...args) {
  return execFileSync('git', args, { cwd: projectRoot, encoding: 'utf8' }).trim();
}

const commit = git('rev-parse', 'HEAD');

// A dirty tree would ship code that no commit describes, defeating the marker the
// post-deploy check compares against.
const dirty = git('status', '--porcelain');
if (dirty && process.env.ALLOW_DIRTY_DEPLOY !== '1') {
  console.error('작업 트리에 커밋되지 않은 변경이 있어 배포를 중단합니다:\n' + dirty);
  console.error('의도한 배포라면 ALLOW_DIRTY_DEPLOY=1 로 다시 실행하세요.');
  process.exit(1);
}

console.log(`Vercel 프로덕션 배포를 시작합니다: commit=${commit}`);

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['vercel', '--prod', '--yes', '--build-env', `VITE_BUILD_COMMIT=${commit}`],
  { cwd: projectRoot, stdio: 'inherit', windowsHide: true },
);

process.exitCode = result.status ?? 1;
