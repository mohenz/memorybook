# MEMOry Autosave Implementation

## 목적

메모 작성/수정 화면에 사용자가 별도로 인지하지 않아도 동작하는 자동저장 기능을 추가한다.
기존 `저장` 버튼은 유지하되, 작성 중 입력 내용은 조용히 보존되도록 한다.

## 기본 원칙

- 자동저장 상태 표시, 토스트, 알림 문구를 추가하지 않는다.
- 사용자는 기존처럼 작성하고 필요하면 `저장` 버튼을 누를 수 있다.
- 자동저장은 기존 클라우드 저장 파이프라인을 재사용한다.
- 별도 Firebase 직접 호출을 `NoteEditor`에 만들지 않는다.
- 빈 새 메모 화면을 열었다가 나가는 경우에는 새 메모를 생성하지 않는다.

## 구현 구조

자동저장은 두 계층으로 나눈다.

1. `NoteEditor`
   - 편집 입력 상태를 감지한다.
   - 변경 후 일정 시간 동안 추가 입력이 없으면 부모에게 자동저장을 요청한다.

2. `App`
   - 자동저장 요청을 받아 `notes` 상태를 갱신한다.
   - 기존 `useEffect` 기반 `saveMemoCloudState` 흐름을 통해 Firebase에 저장한다.

## NoteEditor 처리 방식

`NoteEditor`는 다음 입력 상태를 자동저장 감지 대상으로 사용한다.

- `title`
- `content`
- `groupId`
- `images`
- `checklist`

위 값을 JSON snapshot으로 만들고, 최초 진입 시점의 snapshot과 비교한다.

자동저장 조건은 다음과 같다.

- 최초 진입 상태와 다를 것
- 마지막 자동저장 snapshot과 다를 것
- 새 메모가 완전히 빈 상태가 아닐 것
- 변경 후 약 1.2초 동안 추가 입력이 없을 것

자동저장 payload는 기존 수동 저장과 같은 형태를 사용한다.

```ts
{
  title: title.trim() || '제목 없는 메모',
  content,
  groupId,
  images,
  checklist,
  updatedAt
}
```

제목이 비어 있어도 본문, 체크리스트, 이미지 중 하나가 있으면 자동저장 대상이다.
이 경우 제목은 `제목 없는 메모`로 저장한다.

## App 처리 방식

`App`은 `NoteEditor`에 `onAutoSave` prop을 전달한다.

기존 메모 수정 중이면 다음 방식으로 동작한다.

```ts
setNotes(prev => prev.map(note =>
  note.id === editingNote.id ? { ...note, ...editedFields } : note
));
```

새 메모 작성 중이면 첫 자동저장 시 draft note를 생성한다.

- `draftNoteIdRef`에 생성된 note id를 보관한다.
- 이후 자동저장은 같은 draft note를 갱신한다.
- 사용자가 수동 `저장`을 누르면 draft 상태를 해제하고 대시보드로 돌아간다.
- 사용자가 돌아가기를 누르면 draft ref만 초기화한다. 이미 자동저장된 내용은 보존된다.

## Firebase 저장 흐름

자동저장은 Firebase를 직접 호출하지 않는다.

현재 앱에는 `notes`, `groups`, `darkMode`, `profileImage` 등이 변경되면 500ms 후 `saveMemoCloudState`를 호출하는 저장 흐름이 있다.
자동저장은 `notes` 상태만 갱신하므로 기존 저장 흐름을 그대로 탄다.

```text
NoteEditor 입력 변경
-> 1.2초 debounce
-> App onAutoSave
-> notes 상태 갱신
-> 기존 App useEffect
-> saveMemoCloudState
-> users/{uid}/apps/personalMemo 저장
```

## 사용자 경험

사용자는 자동저장을 직접 인지하지 않는다.

- 저장 중 문구 없음
- 저장 완료 문구 없음
- 자동저장 버튼 없음
- 기존 `저장` 버튼은 그대로 표시

사용자 입장에서는 작성 중 이탈하거나 화면을 전환해도 내용이 보존되는 경험만 제공한다.

## 주의사항

- 자동저장으로 빈 메모가 생성되지 않아야 한다.
- 새 메모 첫 자동저장 후에는 같은 draft note를 계속 갱신해야 한다.
- 수동 저장 시 동일 draft가 중복 생성되지 않아야 한다.
- 계정 전환 시 기존 사용자 draft가 다른 사용자 화면에 남지 않아야 한다.
- Firebase 데이터 프로젝트는 계속 `archive-store-v2-3d020`이어야 한다.

## 검증 항목

- 기존 메모 제목 수정 후 자동저장되는지 확인
- 기존 메모 본문 수정 후 자동저장되는지 확인
- 새 메모에서 본문만 입력해도 `제목 없는 메모`로 자동저장되는지 확인
- 빈 새 메모 화면 진입 후 이탈 시 새 메모가 생성되지 않는지 확인
- 체크리스트 추가/삭제가 자동저장되는지 확인
- 이미지 추가/삭제가 자동저장되는지 확인
- `npm run lint` 통과
- `npm run build` 통과
