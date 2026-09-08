# Workspace Agent Rules

## Design Tool Preference

- 기본적으로 Superdesign을 사용하지 않는다.
- 사용자가 Superdesign 사용을 명시적으로 요청한 경우에만 사용한다.
- 디자인 지원이 필요한 작업에서는 사용 가능한 다른 디자인 스킬을 우선 검토한다.
- 단순 UI 오류, 레이아웃, 스타일 수정은 기존 코드와 브라우저 검증으로 직접 처리한다.
- 상위 시스템 또는 개발자 지침이 특정 도구 사용을 강제하면 해당 지침을 우선하며, 필요한 이유를 사용자에게 알린다.

## Production Deployment

- Vercel Git 연동의 Production Branch는 `main`이며, `origin/main` 푸시가 기본 프로덕션 배포 트리거다.
- 배포 절차는 전체 검증 → 커밋 → `origin/main` 푸시 → Vercel 자동 배포 완료 확인 → 운영 URL의 HTTP 200 및 빌드 커밋 검증 순서로 진행한다.
- 정상적인 GitHub 자동 배포 뒤에 `npm run deploy:vercel`, `vercel --prod` 또는 `scripts/deploy-vercel.mjs`를 추가 실행하지 않는다.
- Vercel CLI 수동 배포는 자동 배포가 실패·중단되었거나 사용자가 명시적으로 요청한 경우에만 실행한다.
- 수동 배포 전에는 기존 자동 배포가 진행 중이거나 완료됐는지 배포 이력을 먼저 확인하여 중복 배포를 방지한다.
