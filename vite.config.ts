import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {execSync} from 'node:child_process';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

// Vercel builds from an upload without .git, so the SHA has to arrive as an env var.
// scripts/deploy-vercel.mjs passes VITE_BUILD_COMMIT; VERCEL_GIT_COMMIT_SHA covers
// deployments triggered by the Git integration instead of the CLI.
function resolveBuildCommit(): string {
  const fromEnv = process.env.VITE_BUILD_COMMIT || process.env.VERCEL_GIT_COMMIT_SHA;
  if (fromEnv?.trim()) return fromEnv.trim();

  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'unknown';
  }
}

// Stamps the built HTML so a deployment can be identified by source revision rather
// than by bundle hash, which differs between local and Vercel builds.
function buildCommitMeta(): Plugin {
  const commit = resolveBuildCommit();
  return {
    name: 'build-commit-meta',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { name: 'build-commit', content: commit }, injectTo: 'head' },
    ],
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), buildCommitMeta()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
