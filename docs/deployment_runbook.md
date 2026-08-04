# memorybook Vercel 배포 절차

1. 독립 Git 저장소와 upstream 상태를 확인합니다.
2. Vercel 환경변수에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_DATA_BACKEND=supabase`를 등록합니다.
3. `npm.cmd run deploy:check`를 통과시킵니다.
4. `npm.cmd run deploy:vercel`로 운영 배포합니다.
5. `VERCEL_PRODUCTION_URL=https://...` 설정 후 `node scripts/verify-deployment.mjs`로 HTTP 200과 번들 일치를 확인합니다.

중단 조건: 테스트·빌드 실패, 독립 Git/upstream 부재, 환경변수 누락, Supabase 프로젝트 불일치, 번들 비밀정보 포함.
