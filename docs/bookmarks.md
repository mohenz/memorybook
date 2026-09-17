# 북마크

- PC 사이드바와 모바일 하단 메뉴에서 접근합니다.
- `common_codes`의 `BOOKMARK_CATEGORY` 분류를 조회합니다. 초기값은 Tech, Health, Idea입니다.
- 북마크는 로그인 계정별로 `bookmarks`에 저장하며 RLS로 다른 계정의 접근을 차단합니다.
- URL 등록 시 OG 제목, HTML 제목, ‘무제’ 순으로 제목을 결정합니다. 직접 입력한 제목을 우선합니다.
- 사이트 정보 가져오기 버튼 또는 최초 저장 시 OG 정보를 수집합니다. 수집 실패 시에도 직접 입력한 제목 또는 ‘무제’로 저장할 수 있습니다.
- URL 변경 시 기존 사이트 정보를 초기화합니다. 수정 시 최초 등록일자는 유지합니다.

## 실행 및 배포

`npm run dev`는 `/api/bookmark-metadata`를 Vite 미들웨어로 제공합니다. Vercel에서는 `api/bookmark-metadata.ts`가 서버 함수로 실행됩니다. 정적 파일만 제공하는 `vite preview`에는 수집 API가 없습니다.

서버에도 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` 환경변수가 필요합니다. 서비스 역할 키는 사용하지 않습니다. API는 Supabase에서 액세스 토큰을 검증한 뒤 공개 HTTP(S) 주소만 가져옵니다. 내부망 주소, DNS rebinding, 리디렉션 우회를 차단하고 8초/1MiB로 수집을 제한합니다.

기존 DB에 추가할 때:

```sh
node scripts/supabase-db.mjs backup
node scripts/supabase-db.mjs migrate 202609170001_bookmarks.sql
node scripts/supabase-db.mjs verify-bookmarks
```

2026-09-17 연결된 DB에 위 마이그레이션 적용을 완료했습니다. 공통코드 3개, 계정별 CRUD/RLS, 등록일자 불변 조건을 실제 DB에서 확인했습니다. 검증용 데이터는 트랜잭션 롤백으로 남기지 않습니다.

## 검증

- `npm run lint`, `npm run build`
- `npm run test:vitest`, `npm run test:unit`
- `npm run test:e2e`: PC/모바일 등록·분류·검색·재조회·수정·삭제, OG 실패, 저장 실패 시 초안 보존, 요청 중 URL 변경을 검증합니다. 브라우저 테스트의 인증·DB·OG 응답은 가상 서버로 대체하며 실제 계정에 접속하지 않습니다.
- `node scripts/supabase-db.mjs verify-bookmarks`: 실제 DB에서 검증 후 롤백합니다.

운영 프런트엔드와 API는 검증 후 `main`을 푸시하면 Vercel Git 연동으로 함께 배포됩니다. 절차는 `docs/deployment_runbook.md`를 따릅니다.
