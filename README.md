# memorybook

React/Vite + TypeScript 기반 개인 메모·일정·자료실 프로그램입니다. Supabase Auth, Postgres, Storage를 데이터 계층으로 사용하고 Vercel 배포를 기준으로 합니다.

## 구성

- 인증: Supabase Auth 이메일/비밀번호
- 메모·일정·설정: `public.memo_states` 사용자별 JSONB 상태
- 자료실 메타데이터: `public.archive_files`
- 이미지·파일: 비공개 Supabase Storage `memorybook-files`
- 권한: `auth.uid()` 기준 RLS
- 배포: Vercel, `dist` 정적 산출물

## 로컬 실행

```powershell
npm.cmd install
npm.cmd run dev
```

기본 주소는 `http://127.0.0.1:3030`입니다. `.env.local`에는 아래 공개 클라이언트 값만 둡니다.

```text
VITE_SUPABASE_URL=https://bmvyiwnokuhbkjtimygy.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
VITE_DATA_BACKEND=supabase
```

Secret key와 PostgreSQL 비밀번호는 프런트엔드 환경변수에 넣지 않습니다.

## 데이터베이스

```powershell
npm.cmd run db:backup
npm.cmd run db:migrate
npm.cmd run db:verify
```

마이그레이션: `supabase/migrations/202608050001_initial_memorybook.sql`

## 검증

```powershell
npm.cmd run lint
npm.cmd run test:vitest
npm.cmd run test:unit
npm.cmd run test:e2e
npm.cmd run build
node scripts/check-deployment.mjs --allow-no-git
```

## 배포

독립 Git 저장소와 Vercel 프로젝트를 연결한 뒤 `npm.cmd run deploy:vercel`을 사용합니다. 운영 배포 후 `VERCEL_PRODUCTION_URL`을 지정하고 `node scripts/verify-deployment.mjs`로 확인합니다.
