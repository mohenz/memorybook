# memorybook Codex Handover

## 기록 기준
- last_updated: 2026-08-09
- project_root: `D:\workspace\memorybook`
- purpose: `personalMemo` 복제본을 Supabase·Vercel 기반 독립 프로그램으로 전환
- current_phase: Supabase 전환·GitHub 게시·Vercel 프로덕션 배포 완료, 캘린더 추가 개선 작업 진행 중

## Git 상태
- repository: `https://github.com/mohenz/memorybook.git`
- branch/upstream: `main` / `origin/main`
- latest_commit: `dcce186` (`fix: keep mobile navigation visible on todos`)
- 원격 `main` 반영 확인 완료
- 비밀 설정, 백업, 빌드 산출물, 테스트 결과물은 `.gitignore`로 제외

## 애플리케이션
- React 19 + Vite 6 + TypeScript
- 로컬 포트: `http://127.0.0.1:3030`
- 2026-08-05 확인 시 개발 서버 HTTP 200
- 주요 기능: 통합 로그인, 메모·폴더·검색·캘린더·설정, 자료실 업로드/조회/삭제, 모바일 화면
- 인증 로딩 화면과 로그인 화면 분리 적용
- 화면별 UI는 독립 Screen 컴포넌트로 분리

## Supabase 상태
- project_name: `memorybook`
- project_ref: `bmvyiwnokuhbkjtimygy`
- API URL: `https://bmvyiwnokuhbkjtimygy.supabase.co`
- Auth: 초기 로그인 계정 1개, 이메일 확인 및 실제 로그인 검증 완료
- public tables: `memo_states`, `archive_files`
- RLS: 대상 테이블 2개 모두 활성화
- policies: public·storage 합계 11개
- Storage: 비공개 버킷 `memorybook-files`, 파일 제한 50MB
- Realtime: `archive_files` 등록 완료
- 확인 당시 데이터: `memo_states=0`, `archive_files=0`
- migration: `supabase/migrations/202608050001_initial_memorybook.sql`
- REST 사전 백업: `backups/`에 로컬 보관, Git 제외
- CLI DB 연결: `config/memorybook.cfg`의 Transaction Pooler 비밀번호 인증 실패 상태
- Codex MCP: 과거 읽기 전용 Supabase MCP 인증 완료 기록은 있으나, 독립 저장소 초기화 후 현재 `codex mcp list`에는 Supabase 항목이 노출되지 않음

## Supabase 전환 범위
- Firebase SDK와 Firebase Auth/Firestore/Storage 호출 제거
- Supabase Auth `signInWithPassword`, `signOut`, 비밀번호 재설정 적용
- 메모 상태를 `memo_states.state` JSONB로 저장
- 자료실 메타데이터를 `archive_files`, 파일을 비공개 Storage에 저장
- 파일 조회는 서명 URL 사용
- 동일 사용자의 데스크톱·모바일 자료실 동시 마운트 시 Realtime 채널 충돌 문제 수정

## 환경변수
로컬 `.env.local`에 아래 필수 항목 설정 확인 완료:

```env
VITE_DATA_BACKEND=supabase
VITE_SUPABASE_URL=https://bmvyiwnokuhbkjtimygy.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<sb_publishable_...>
```

- `.env.local`과 `config/memorybook.cfg`는 Git 제외
- `sb_secret_...`, DB 비밀번호, Pooler URL은 클라이언트 환경변수에 사용 금지
- 실제 비밀값은 이 문서에 기록하지 않음

## 검증 결과
- TypeScript: 통과
- Vitest: 26개 파일, 108개 테스트 통과
- Jest: 2개 스위트, 13개 테스트 통과
- Playwright: 데스크톱·모바일 합계 4개 테스트 통과
- 실제 로그인 → 자료실 진입: 정상, 콘솔 오류 0건
- Vite production build: 통과
- Vercel 배포 사전검증: 통과
- 번들에는 Supabase Secret key와 Pooler 정보가 포함되지 않음
- 번들 크기 500kB 초과 경고는 있으나 빌드 실패 조건은 아님

## Vercel 상태
- `vercel.json`: Vite `dist` 출력과 SPA rewrite 구성 완료
- project: `mohenzs-projects/memorybook`
- production deployment: `READY`
- production URL: `https://memorybook-theta.vercel.app/`
- 최신 원격 반영 커밋: `dcce186`
- 필요한 Vercel 환경변수:
  - `VITE_DATA_BACKEND=supabase`
  - `VITE_SUPABASE_URL=https://bmvyiwnokuhbkjtimygy.supabase.co`
  - `VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>`

## 실행 및 배포 명령
```powershell
npm.cmd run dev
npm.cmd run lint
npm.cmd run test:vitest
npm.cmd run test:unit
npm.cmd run test:e2e
npm.cmd run build
npm.cmd run deploy:check
npm.cmd run deploy:vercel
```

## 핵심 파일
- `src/App.tsx`: 최상위 상태 조립과 화면 전환
- `src/supabase/client.ts`: 브라우저 Supabase 클라이언트
- `src/services/archiveIntegration.ts`: 통합 Auth·메모 상태·이미지 저장
- `src/archiveStore/features/archive/archiveService.js`: 자료실 DB·Storage·Realtime
- `src/archiveStore/views/ArchiveView.jsx`: 자료실 상태 조립
- `supabase/migrations/202608050001_initial_memorybook.sql`: 원격 스키마
- `scripts/supabase-db.mjs`: DB 백업·마이그레이션·검증
- `scripts/check-deployment.mjs`: 배포 전 불변조건 검사
- `docs/deployment_runbook.md`: 배포 절차

## 남은 작업
1. 현재 로컬 변경인 모바일 `오늘·주간` 전환과 데스크톱 `주간·일간·월간·연간` 셀렉터를 커밋·배포
2. 연간 보기의 12개월 미니 캘린더를 운영 환경에서 최종 시각 검증
3. 필요 시 올바른 Transaction Pooler DB 비밀번호로 CLI 연결 복구
4. 필요 시 독립 저장소 범위에 Supabase MCP 재등록

## 보안·운영 주의사항
- DB 스키마·데이터 변경은 사용자 명시 승인 후 실행
- `config/memorybook.cfg`, `.env.local`, `backups/`를 Git에 추가하지 않음
- Supabase Secret key와 DB 비밀번호를 채팅·문서·클라이언트 번들에 노출하지 않음
- 운영 배포 후에는 `https://memorybook-theta.vercel.app/`의 HTTP 200과 변경 기능 포함 여부를 확인

## 2026-08-09 UI 개선 작업 기록

### 메모·설정·사이드바
- 메모 작성·수정 시 그룹을 버튼 선택형으로 제공하고 저장 버튼과 시각적으로 구분
- 설정 모달의 탭별 세로 크기를 고정하고 헤더 문구를 `설정`으로 단순화
- 도움말 알림을 기능 설명 모달로 교체하고 사이드바 아이콘과 도움말 아이콘을 통일
- `태그 및 검색` 메뉴를 TO-DO LIST 아래로 이동하고 사이드바 메뉴 간격을 축소
- 낮은 해상도에서 사이드 메뉴와 하단 버튼이 겹치지 않도록 레이아웃 조정
- 검색창에 남아 있던 기본 `아이디어` 값을 제거

### 캘린더·일정
- 겹치는 시간대의 일정을 열 단위로 분할해 모든 일정을 동시에 표시
- 주요 일정 팝업 제목을 `주요 일정`으로 단순화
- 데스크톱 캘린더 헤더를 한 줄 고정형으로 재구성하고 날짜·이동·보기·검색·새 일정 영역의 겹침 제거
- 전역 자료실 `h1` 스타일이 캘린더 날짜를 48px로 덮어쓰던 문제를 범위 제한으로 해결
- 날짜 글꼴을 18px로 확대하고 연도 전환 기간까지 수용하도록 날짜 영역을 고정 폭으로 확장
- 캘린더 일정 검색창을 192px 고정 폭으로 축소
- 월간·주간·일간 버튼 그룹을 단일 셀렉터로 교체
- 현재 로컬 작업: 셀렉터 순서를 `주간 → 일간 → 월간 → 연간`으로 변경하고 12개월 연간 보기 추가
- 연간 보기에서 월별 일정 수와 일정 날짜 표시점을 제공하며 월 선택 시 월간 보기로 이동

### 모바일
- 처음 실행되는 메모 목록을 작성일·제목·최대 3줄 미리보기 카드로 변경
- 모바일 캘린더를 선택한 하루의 일정만 상세 표시하도록 분리
- 전날·오늘·다음날 일정 요약 카드와 일정 등록·수정 기능 추가
- 현재 로컬 작업: 모바일 캘린더 상단에 `오늘·주간` 전환을 추가하고 주간 7일 카드 제공
- 하단바에 TO-DO 메뉴를 추가하고 TO-DO 화면에서도 하단바가 유지되도록 높이·레이어 구조 조정

### 안정화·배포
- 로컬 Vite 모듈을 오래 보관하던 PWA 서비스 워커 캐시를 갱신하고 개발 모듈은 캐시하지 않도록 수정
- 일정 요약 버튼의 실제 글꼴을 10px로 조정
- 배포 완료 커밋:
  - `d59d306`: 데스크톱 캘린더·메모·설정 UI 개선
  - `dabe0bd`: 모바일 메모 요약·당일 캘린더·TO-DO 하단 메뉴
  - `dcce186`: TO-DO 화면 하단바 유지
- 각 배포에서 GitHub `main` 푸시, Vercel `READY`, 운영 번들 기능 포함 여부 확인

### 현재 작업 트리
- 커밋되지 않은 기능 변경:
  - `src/components/CalendarView.tsx`
  - `src/components/CalendarView.test.tsx`
  - `src/components/calendar/calendarUtils.ts`
  - `src/components/calendar/calendarUtils.test.ts`
  - `src/components/calendar/YearCalendarScreen.tsx`
  - `src/components/calendar/YearCalendarScreen.test.tsx`
  - `src/mobile/screens/MobileCalendarScreen.tsx`
  - `src/mobile/MobileAppShell.test.tsx`
- 별도 작업 문서 `docs/mobile_camera_capture_work_plan.md`는 현재 UI 변경 커밋 범위에서 제외
