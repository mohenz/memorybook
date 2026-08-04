# memorybook 기술 아키텍처

## 런타임

- React 19, Vite 6, TypeScript
- 로컬 포트 `3030`
- Vercel 정적 배포, SPA rewrite

## 데이터 계층

### 인증

Supabase Auth 이메일/비밀번호 로그인을 사용합니다. 인증 로딩 중에는 로그인 폼을 렌더링하지 않습니다.

### 메모 상태

`public.memo_states`는 `user_id`를 기본키로 사용하며 메모, 폴더, 일정, 알림 설정, 테마와 프로필 상태를 `state jsonb`에 저장합니다. 현재 앱의 단일 상태 자동저장 모델을 유지해 이관 복잡도를 최소화했습니다.

### 자료실

`public.archive_files`는 파일 메타데이터를 저장하고 실제 파일은 비공개 `memorybook-files` 버킷에 저장합니다. 경로 첫 구간은 사용자 UID이며 조회 시 1시간 유효 서명 URL을 생성합니다.

### 보안

- 두 public 테이블 모두 RLS 활성화
- 모든 사용자 정책은 `(select auth.uid()) = user_id` 조건 적용
- Storage 정책도 경로 첫 구간과 `auth.uid()`를 비교
- 프런트엔드는 publishable key만 사용
- Secret key와 DB 비밀번호는 `config/*.cfg`에만 두고 Git 제외

## 배포 불변조건

- Supabase project ref: `bmvyiwnokuhbkjtimygy`
- 데이터 백엔드: `supabase`
- Vercel output: `dist`
- 번들에 `sb_secret_` 또는 Pooler 주소가 포함되면 배포 중단
