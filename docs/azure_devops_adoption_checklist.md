# Memorybook Azure DevOps 도입 체크리스트

## 적용 기준

- 대상: `mohenz/memorybook`
- 담당 표기: **[사용자]**, **[진아]**, **[공동]**
- GitHub·Supabase·Vercel은 유지하고 Azure Boards와 Azure Pipelines부터 적용한다.
- DB·스키마·원격 저장소·운영 배포는 사용자 승인 없이 변경하지 않는다.

## 전체 진행 현황

- [ ] 1. 도입 범위 확정
- [ ] 2. Azure DevOps 조직·프로젝트 생성
- [ ] 3. Azure Boards 구성
- [ ] 4. GitHub 저장소 연결
- [ ] 5. PR 자동검증 파이프라인 구현
- [ ] 6. Playwright CI 안정화
- [ ] 7. 단계별 승인 파이프라인 구현
- [ ] 8. 운영 배포 방식 결정
- [ ] 9. 최종 검증·문서화

## 1단계: 도입 범위 확정

- [ ] **[사용자]** 조직 이름 결정 — 권장: `Bloom`
- [ ] **[사용자]** 프로젝트 이름 결정 — 권장: `Bloom-Development`
- [ ] **[사용자]** GitHub 유지 및 Azure Repos 미이전 승인
- [ ] **[사용자]** 1차 범위를 `Boards + CI 검증`으로 승인
- [ ] **[사용자]** 초기 Vercel Git 자동배포 유지 결정
- [ ] **[진아]** 확정 내용을 적용 기준으로 정리

완료 확인:

- [ ] 조직·프로젝트·저장소·배포방식 확정
- [ ] **1단계 완료 승인 [사용자]**

## 2단계: Azure DevOps 조직·프로젝트 생성

- [ ] **[사용자]** Microsoft 계정으로 Azure DevOps 로그인
- [ ] **[사용자]** 조직과 비공개 프로젝트 생성
- [ ] **[사용자]** 프로세스 모델 `Agile` 선택
- [ ] **[사용자]** 조직·프로젝트 주소 전달
- [ ] **[진아]** 생성 결과와 설정 확인

완료 확인:

- [ ] 프로젝트 접근 및 Boards·Pipelines 사용 가능
- [ ] 비공개·Agile 설정 확인
- [ ] **2단계 완료 승인 [사용자]**

## 3단계: Azure Boards 구성

- [ ] **[진아]** `Memorybook` Area Path 설계
- [ ] **[진아]** 데이터 안정성·메모 일정·자료실·테스트·배포 Epic 작성
- [ ] **[사용자]** Boards 구성안 승인
- [ ] **[사용자 또는 승인받은 진아]** Area Path·Iteration 생성
- [ ] **[진아]** 현재 남은 작업을 Work Item으로 정리
- [ ] **[진아]** TO-DO 저장 경합 문제를 첫 Bug로 작성
- [ ] **[사용자]** 우선순위·담당자 확인

완료 확인:

- [ ] Area Path와 Work Item 생성
- [ ] 각 항목에 우선순위·담당자·완료조건 설정
- [ ] **3단계 완료 승인 [사용자]**

## 4단계: GitHub 저장소 연결

- [ ] **[사용자]** `mohenz/memorybook` 관리자 권한 확인
- [ ] **[사용자]** Azure Boards GitHub App 설치 승인
- [ ] **[사용자 또는 승인받은 진아]** Azure DevOps와 GitHub 연결
- [ ] **[진아]** 검증 Work Item과 `AB#작업번호` 연결 작성
- [ ] **[공동]** Boards에서 PR·커밋 연결 확인

완료 확인:

- [ ] GitHub PR·커밋 추적 및 `AB#` 연결 정상
- [ ] **4단계 완료 승인 [사용자]**

## 5단계: PR 자동검증 파이프라인 구현

- [ ] **[진아]** 루트에 `azure-pipelines.yml` 작성
- [ ] **[진아]** Node.js 22와 `npm ci` 설정
- [ ] **[진아]** `lint`, `test:vitest`, `test:unit`, `build` 설정
- [ ] **[진아]** `main` PR·push 트리거 설정
- [ ] **[진아]** 배포 명령 미포함 확인 및 로컬 검증
- [ ] **[사용자]** GitHub push와 Pipeline 등록 승인
- [ ] **[공동]** 최초 Pipeline 실행 확인

완료 확인:

- [ ] PR에서 Pipeline 자동 실행
- [ ] TypeScript·Vitest·Jest·Build 통과
- [ ] 실패 시 Pipeline 실패, 운영 배포 미발생
- [ ] **5단계 완료 승인 [사용자]**

## 6단계: Playwright CI 안정화

- [ ] **[진아]** Chrome 설정의 hosted agent 호환성 확인
- [ ] **[진아]** CI에서 Playwright Chromium을 사용하도록 최소 수정
- [ ] **[진아]** CI 브라우저 설치 단계 추가
- [ ] **[진아]** 데스크톱 `1920×1080`과 모바일 `375×812` 실행
- [ ] **[진아]** 실패 screenshot·trace를 아티팩트로 보관
- [ ] **[진아]** 테스트 서버·포트 종료 검증
- [ ] **[사용자]** 결과 확인 및 다음 단계 승인

완료 확인:

- [ ] 기존 Playwright 4건 통과
- [ ] 실패 아티팩트 다운로드 가능
- [ ] 백그라운드 서버 미잔류
- [ ] **6단계 완료 승인 [사용자]**

## 7단계: 단계별 승인 파이프라인 구현

- [ ] **[진아]** 수동 Release Validation Pipeline 설계
- [ ] **[진아]** Vitest → 사용자 승인 구성
- [ ] **[진아]** Jest → 사용자 승인 구성
- [ ] **[진아]** Playwright·Build·배포 사전검증 구성
- [ ] **[진아]** `check-deployment.mjs` detached HEAD 호환 처리
- [ ] **[진아]** 단계별 결과를 아티팩트로 게시
- [ ] **[사용자]** 승인 담당자 지정
- [ ] **[공동]** 승인·거절·시간초과 확인

완료 확인:

- [ ] 승인 없이 다음 단계 진행 불가
- [ ] 거절 시 즉시 중단
- [ ] Git·빌드 커밋 및 Supabase 불변조건 검사 정상
- [ ] **7단계 완료 승인 [사용자]**

## 8단계: 운영 배포 방식 결정

초기 권장안:

- [ ] **[사용자]** Azure Pipelines는 검증만 담당하도록 승인
- [ ] **[사용자]** Vercel Git 자동배포 유지
- [ ] **[진아]** Pipeline에 운영 배포 명령이 없음을 검증
- [ ] **[공동]** 기존 Vercel 배포 정상 동작 확인

선택 — Azure 승인형 Production 배포:

- [ ] **[사용자]** Azure Pipelines를 Production 배포 주체로 승인
- [ ] **[사용자]** Vercel `main` 자동 Production 배포 중지
- [ ] **[사용자]** `VERCEL_TOKEN` 등을 Secret Variable Group에 등록
- [ ] **[진아]** 승인형 Vercel Production 배포 Stage 구현
- [ ] **[진아]** `verify-deployment.mjs` 사후검증 연결
- [ ] **[공동]** 명시적 승인 후 실제 배포 1회 검증

완료 확인:

- [ ] Production 배포 주체 단일화 및 무승인 배포 차단
- [ ] HTTP 200 및 운영·Pipeline 커밋 일치
- [ ] **8단계 완료 승인 [사용자]**

## 9단계: 최종 검증·문서화

- [ ] **[진아]** Azure DevOps 운영 절차 작성
- [ ] **[진아]** `README.md`와 `docs/deployment_runbook.md` 갱신
- [ ] **[진아]** project control 상태 파일 갱신
- [ ] **[진아]** GitHub·Boards·Pipeline·아티팩트 최종 확인
- [ ] **[진아]** 비밀값 보호·중복 배포 방지 확인
- [ ] **[사용자]** 최종 운영 전환 승인

완료 확인:

- [ ] 문서만으로 운영 절차 재현 가능
- [ ] Work Item부터 커밋·PR·테스트까지 추적 가능
- [ ] 승인 없는 테스트 진행·Production 배포 차단
- [ ] DB 데이터·스키마 변경 없이 도입 완료
- [ ] **9단계 완료 승인 [사용자]**

## 최종 완료

- [ ] 모든 단계와 사용자 승인 완료
- [ ] 역할과 운영 절차 문서화 완료
- [ ] 비밀정보가 Git 또는 YAML에 저장되지 않음
- [ ] **Memorybook Azure DevOps 도입 완료 [사용자]**

## 작업 중단 조건

- 테스트 또는 빌드 실패
- Git dirty·divergent·커밋 불일치
- Azure DevOps 또는 GitHub 권한 부족
- 필수 환경변수 또는 승인 담당자 미설정
- Supabase 프로젝트 참조 불일치
- 번들에서 서버 전용 비밀값 발견
- Vercel Production 중복 배포 가능성 발견
- 사용자 승인 없이 DB·스키마·원격 저장소·운영 배포 변경이 필요한 경우
