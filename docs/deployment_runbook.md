# memorybook Vercel 배포 절차

1. 독립 Git 저장소와 upstream 상태를 확인합니다.
2. Vercel 환경변수에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_DATA_BACKEND=supabase`를 등록합니다.
3. `npm.cmd run deploy:check`를 통과시킵니다.
4. `npm.cmd run deploy:vercel`로 운영 배포합니다.
5. `VERCEL_PRODUCTION_URL=https://...` 설정 후 `node scripts/verify-deployment.mjs`로 HTTP 200과 리비전 일치를 확인합니다.

중단 조건: 테스트·빌드 실패, 독립 Git/upstream 부재, 환경변수 누락, Supabase 프로젝트 불일치, 번들 비밀정보 포함, 운영 리비전 불일치.

## 리비전 검증 방식

번들 파일명 해시는 배포 검증에 쓸 수 없습니다. Vercel은 의존성을 새로 설치해 빌드하므로
로컬 빌드와 바이트 단위로 달라지고, 정상 배포에도 해시가 어긋납니다.

대신 빌드 시점의 커밋 SHA를 HTML에 새겨 비교합니다.

- `vite.config.ts`의 `build-commit-meta` 플러그인이 `<meta name="build-commit" content="...">`를
  주입합니다. SHA는 `VITE_BUILD_COMMIT` → `VERCEL_GIT_COMMIT_SHA` → `git rev-parse HEAD` 순으로
  결정됩니다.
- Vercel은 `.git` 없이 업로드된 소스를 빌드하므로 `scripts/deploy-vercel.mjs`가
  `--build-env VITE_BUILD_COMMIT=<HEAD>`로 SHA를 전달합니다.
- `scripts/check-deployment.mjs`는 배포 전에 로컬 `dist/index.html`의 마커가 HEAD와 같은지 봅니다.
- `scripts/verify-deployment.mjs`는 배포 후 운영 HTML의 마커가 HEAD와 같은지 봅니다.
  다른 리비전을 기대할 때는 `EXPECTED_BUILD_COMMIT`으로 지정합니다.
