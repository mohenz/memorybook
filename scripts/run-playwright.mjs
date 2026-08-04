import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5180'],
  { cwd: projectRoot, stdio: 'ignore', windowsHide: true },
);

let serverExited = false;
server.once('exit', () => { serverExited = true; });

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (serverExited) throw new Error('Playwright 테스트 서버가 시작 전에 종료되었습니다.');

    try {
      const response = await fetch('http://127.0.0.1:5180');
      if (response.ok) return;
    } catch {
      // ponytail: 짧은 폴링으로 별도 대기 패키지 없이 서버 준비 상태를 확인한다.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error('Playwright 테스트 서버 준비 시간이 초과되었습니다.');
}

try {
  await waitForServer();

  const runner = spawn(
    process.execPath,
    ['node_modules/@playwright/test/cli.js', 'test', '--config', 'config/playwright.config.ts'],
    { cwd: projectRoot, stdio: 'inherit', windowsHide: true },
  );
  const exitCode = await new Promise((resolve) => runner.once('exit', resolve));
  process.exitCode = typeof exitCode === 'number' ? exitCode : 1;
} finally {
  server.kill();
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (!serverExited && server.pid && process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(server.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    });
  }
}
