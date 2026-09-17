# 북마크

- PC 사이드바와 모바일 하단 메뉴에서 접근합니다.
- 분류는 `common_codes`의 `BOOKMARK_CATEGORY` 공통코드입니다. 초기값은 Tech, Health, Idea이며 하드코딩하지 않고 설정 화면에서 관리합니다.
- 북마크는 로그인 계정별로 `bookmarks`에 저장하며 RLS로 다른 계정의 접근을 차단합니다.
- URL 등록 시 OG 제목, HTML 제목, ‘무제’ 순으로 제목을 결정합니다. 직접 입력한 제목을 우선합니다.
- 사이트 정보 가져오기 버튼 또는 최초 저장 시 OG 정보를 수집합니다. 수집 실패 시에도 직접 입력한 제목 또는 ‘무제’로 저장할 수 있습니다.
- URL 변경 시 기존 사이트 정보를 초기화합니다. 수정 시 최초 등록일자는 유지합니다.

## URL링크분류 공통코드 관리

- 설정 > 분류 탭(`src/features/bookmarks/BookmarkCodeSettings.tsx`)에서 추가·수정·비활성화합니다. PC와 모바일이 같은 설정 모달을 씁니다.
- 북마크는 코드값(`bookmarks.category_code`)을 저장하고 표시 이름은 공통코드에서 읽습니다. 코드값은 외래키 참조 대상이라 등록 후 바꿀 수 없고, 표시 이름·정렬 순서·사용 여부만 수정합니다.
- 코드값은 영문 대문자로 시작하는 40자 이내의 영문·숫자·밑줄, 표시 이름은 1~80자, 정렬 순서는 0~9999입니다. 화면과 DB 체크 제약에서 함께 검증합니다.
- 삭제 대신 비활성화만 제공합니다. 비활성 분류는 북마크 등록·수정 폼의 선택지에서 빠지지만, 이미 그 분류로 저장한 북마크는 이름과 목록 필터를 그대로 유지합니다.
- 권한은 `BOOKMARK_CATEGORY` 그룹으로 제한하고 update 권한은 `label`, `sort_order`, `is_active` 열에만 부여합니다. delete 권한은 주지 않습니다. Supabase가 테이블 생성 시 anon/authenticated에 기본으로 부여하는 전체 권한(컬럼 제한 없는 update, delete, truncate 포함)은 먼저 회수한 뒤 필요한 권한만 다시 부여합니다 — 컬럼 제한 GRANT는 기존의 더 넓은 GRANT를 좁히지 못하기 때문입니다.
- 설정 화면에서 분류를 저장하면 열려 있는 북마크 화면도 곧바로 같은 목록을 씁니다(`subscribeBookmarkCodes`).

## 실행 및 배포

`npm run dev`는 `/api/bookmark-metadata`를 Vite 미들웨어로 제공합니다. Vercel에서는 `api/bookmark-metadata.ts`가 서버 함수로 실행됩니다. 정적 파일만 제공하는 `vite preview`에는 수집 API가 없습니다.

서버에도 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` 환경변수가 필요합니다. 서비스 역할 키는 사용하지 않습니다. API는 Supabase에서 액세스 토큰을 검증한 뒤 공개 HTTP(S) 주소만 가져옵니다. 내부망 주소, DNS rebinding, 리디렉션 우회를 차단하고 8초/1MiB로 수집을 제한합니다.

기존 DB에 추가할 때:

```sh
node scripts/supabase-db.mjs backup
node scripts/supabase-db.mjs migrate 202609170001_bookmarks.sql
node scripts/supabase-db.mjs migrate 202609170002_bookmark_code_management.sql
node scripts/supabase-db.mjs verify-bookmarks
```

2026-09-17 연결된 DB에 `202609170001_bookmarks.sql`과 `202609170002_bookmark_code_management.sql`을 모두 적용했습니다. 공통코드 조회, 계정별 CRUD/RLS, 등록일자 불변, 분류 추가·수정·비활성화, 코드값 변경·그룹 이동·삭제·형식 위반 차단, anon/authenticated 기본 권한 회수를 실제 DB에서 확인했습니다. 검증용 데이터는 트랜잭션 롤백으로 남기지 않습니다.

`202609170002` 최초 적용 시 컬럼 제한 `grant update`만으로는 Supabase 기본 권한(전체 컬럼 update, delete, truncate)을 좁히지 못해 `code`/`code_group`까지 수정 가능한 상태가 한 차례 있었습니다. `revoke all ... from authenticated/anon` 후 재부여로 수정하고 같은 파일을 재적용(idempotent)해 반영했습니다.

## 검증

- `npm run lint`, `npm run build`
- `npm run test:vitest`, `npm run test:unit`
- `npm run test:e2e`: PC/모바일 등록·분류·검색·재조회·수정·삭제, OG 실패, 저장 실패 시 초안 보존, 요청 중 URL 변경, 설정 화면의 분류 추가·이름 변경·비활성화와 비활성 분류가 기존 북마크에 남는지를 검증합니다. 브라우저 테스트의 인증·DB·OG 응답은 가상 서버로 대체하며 실제 계정에 접속하지 않습니다.
- `node scripts/supabase-db.mjs verify-bookmarks`: 실제 DB에서 활성 분류 조회, 분류 추가·수정·비활성화, 코드값 변경·그룹 이동·삭제·형식 위반 차단, 계정별 CRUD/RLS를 검증한 뒤 롤백합니다.

운영 프런트엔드와 API는 검증 후 `main`을 푸시하면 Vercel Git 연동으로 함께 배포됩니다. 절차는 `docs/deployment_runbook.md`를 따릅니다.
