# memorybook Vercel 배포 절차

1. 독립 Git 저장소와 `main`/`origin/main` 상태를 확인합니다.
2. Vercel 환경변수에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_DATA_BACKEND=supabase`가 등록되어 있는지 확인합니다.
3. `npm.cmd run deploy:check`를 통과시킵니다.
4. 검증된 변경을 커밋하고 `git push origin main`으로 게시합니다.
5. GitHub 연동으로 생성된 Vercel 프로덕션 배포가 `READY`가 될 때까지 확인합니다.
6. `VERCEL_PRODUCTION_URL=https://memorybook-theta.vercel.app` 설정 후 `node scripts/verify-deployment.mjs`로 HTTP 200과 리비전 일치를 확인합니다.

기본 배포 주체는 Vercel Git 연동입니다. `main` 푸시 후에는 별도의 수동 프로덕션 배포를 실행하지 않습니다.

`npm.cmd run deploy:vercel` 또는 `node scripts/deploy-vercel.mjs`는 다음 경우에만 사용합니다.

- GitHub 자동 배포가 실패하거나 시작되지 않은 경우
- 사용자가 수동 배포를 명시적으로 요청한 경우

수동 배포 전에는 `vercel list memorybook --prod` 등으로 자동 배포가 이미 진행되거나 완료되지 않았는지 확인합니다.

중단 조건: 테스트·빌드 실패, 독립 Git/upstream 부재, 환경변수 누락, Supabase 프로젝트 불일치, 번들 비밀정보 포함, 운영 리비전 불일치.

## 리비전 검증 방식

번들 파일명 해시는 배포 검증에 쓸 수 없습니다. Vercel은 의존성을 새로 설치해 빌드하므로
로컬 빌드와 바이트 단위로 달라지고, 정상 배포에도 해시가 어긋납니다.

대신 빌드 시점의 커밋 SHA를 HTML에 새겨 비교합니다.

- `vite.config.ts`의 `build-commit-meta` 플러그인이 `<meta name="build-commit" content="...">`를
  주입합니다. SHA는 `VITE_BUILD_COMMIT` → `VERCEL_GIT_COMMIT_SHA` → `git rev-parse HEAD` 순으로
  결정됩니다.
- 수동 CLI 배포에서는 Vercel이 `.git` 없이 업로드된 소스를 빌드하므로 `scripts/deploy-vercel.mjs`가
  `--build-env VITE_BUILD_COMMIT=<HEAD>`로 SHA를 전달합니다.
- `scripts/check-deployment.mjs`는 배포 전에 로컬 `dist/index.html`의 마커가 HEAD와 같은지 봅니다.
- `scripts/verify-deployment.mjs`는 배포 후 운영 HTML의 마커가 HEAD와 같은지 봅니다.
  다른 리비전을 기대할 때는 `EXPECTED_BUILD_COMMIT`으로 지정합니다.
