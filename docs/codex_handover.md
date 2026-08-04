# personalMemo Codex Handover

## 목적
`personalMemo`의 개발 주도권을 Google AI Studio 생성물 상태에서 Codex 로컬 개발/운영 기준으로 이관합니다.

## 소유권 기준
- source_of_truth: 로컬 Git 저장소 `D:\Workspace\personalMemo`
- project_control_state: `D:\Workspace\project_control\states\personalMemo_current.md`
- remote: `https://github.com/mohenz/https-github.com-mohenz-personalMemo.git`
- branch: `main`

## 현재 앱 성격
- React 19 + Vite + TypeScript 앱
- 개인 메모/노트 관리 UI
- 브라우저 `localStorage`에 메모, 폴더, 프로필 이미지, 다크 모드 값을 저장
- Gemini API 키 설정 구조가 있으나 실제 AI 기능 검증은 API 키 제공 후 진행

## 주요 화면 / 기능
- Splash 화면
- Dashboard: 사이드바, 메모 목록, 메모 상세
- Editor: 메모 작성/수정
- Search: 전체 검색
- Calendar: 날짜 기반 메모 탐색
- Settings: 프로필 이미지, 다크 모드, PWA 설치 프롬프트

## 핵심 파일
- `src\App.tsx`: 전역 상태, 화면 라우팅, 메모 CRUD 흐름
- `src\data.ts`: 기본 그룹/샘플 메모/이미지 데이터
- `src\types.ts`: Group, Note, ChecklistItem, ScreenType 타입
- `src\components\Sidebar.tsx`: 좌측 내비게이션
- `src\components\NoteEditor.tsx`: 작성/수정 화면
- `src\components\NoteDetail.tsx`: 상세 조회 화면
- `src\components\SearchView.tsx`: 검색 화면
- `src\components\CalendarView.tsx`: 캘린더 화면
- `src\components\SettingsModal.tsx`: 설정 모달

## 실행 기준
```powershell
npm install
npm run dev
```

기본 포트:

```text
http://localhost:3000
```

## 검증 기준
```powershell
npm run build
npm run lint
```

## 환경 변수
`.env.example`을 `.env.local`로 복사한 뒤 설정합니다.

```text
GEMINI_API_KEY=<Gemini API Key>
APP_URL=http://localhost:3000
```

주의:
- `.env.local`은 Git에 포함하지 않습니다.
- API 키 없이도 기본 메모 UI는 확인 가능해야 합니다.
- Gemini 기능은 키 설정 후 별도 검증합니다.

## 이관 후 우선 정리 항목
1. `package.json`의 `name`이 `react-example`로 남아 있음. `personal-memo` 등으로 변경 여부 결정.
2. README가 AI Studio 기본 안내에서 로컬 개발 기준으로 갱신됨.
3. Windows 환경에서 `clean` 스크립트의 `rm -rf` 호환성 문제 검토.
4. 메모 데이터 영속화 방향 결정: `localStorage` 유지, 파일/DB 저장, Firebase/Supabase 연동 중 선택.
5. 샘플 이미지가 외부 `lh3.googleusercontent.com` URL에 의존하므로 장기 보관 필요 시 로컬 에셋화 검토.

## 현재 리스크
- `node_modules`와 `package-lock.json`이 아직 없는 상태에서 클론됨.
- 의존성 설치 후 빌드/타입 검증이 필요함.
- Gemini API 키가 없으면 AI 기능 검증 불가.
- 현재 저장소명은 `https-github.com-mohenz-personalMemo` 형태로 비정상적이므로 추후 GitHub repo rename 여부 검토 필요.

## 다음 액션
1. `npm install`
2. `npm run build`
3. `npm run lint`
4. 실행 화면 확인
5. 이후 기능 개발 우선순위 결정
