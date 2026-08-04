# memorybook 사용자 계정 운영

- 계정은 Supabase Auth에서 운영자가 생성합니다.
- 앱 내부 회원가입은 제공하지 않습니다.
- 사용자는 이메일과 비밀번호로 로그인합니다.
- 모든 메모·일정·자료실 데이터는 Supabase Auth UID와 RLS로 분리됩니다.
- 비밀번호 재설정은 Supabase Auth 이메일 흐름을 사용합니다.
- 계정 삭제 전 `memo_states`, `archive_files`, Storage 파일 보존 여부를 확인합니다.

운영자는 Secret key나 DB 비밀번호를 사용자에게 전달하지 않습니다.
