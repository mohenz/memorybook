import { describe, expect, it } from 'vitest';
import { CloudSyncError, cloudSyncDiagnostic, cloudSyncErrorMessage, shouldEmitArchiveAccountChange } from './archiveIntegration';

describe('archive account auth event filtering', () => {
  it('emits the initial session once', () => {
    expect(shouldEmitArchiveAccountChange('INITIAL_SESSION', undefined, 'user-1')).toBe(true);
  });

  it('ignores token refreshes so returning to the tab does not reload cloud state', () => {
    expect(shouldEmitArchiveAccountChange('TOKEN_REFRESHED', 'user-1', 'user-1')).toBe(false);
  });

  it('ignores repeated auth events for the same user', () => {
    expect(shouldEmitArchiveAccountChange('SIGNED_IN', 'user-1', 'user-1')).toBe(false);
  });

  it('emits when the signed-in user changes', () => {
    expect(shouldEmitArchiveAccountChange('SIGNED_IN', 'user-1', 'user-2')).toBe(true);
  });

  it('emits sign-out after an authenticated session', () => {
    expect(shouldEmitArchiveAccountChange('SIGNED_OUT', 'user-1', null)).toBe(true);
  });
});

describe('cloud sync diagnostics', () => {
  it('shows the failing stage and safe error code to the user', () => {
    const error = new CloudSyncError('notes', { message: 'permission denied', code: '42501', details: 'private detail' });
    expect(cloudSyncErrorMessage(error)).toBe('초기 데이터 동기화에 실패했습니다. 단계: notes · 오류: 42501');
  });

  it('keeps structured Supabase details for console diagnostics', () => {
    const error = new CloudSyncError('groups', { message: 'failed', code: 'PGRST204', hint: 'reload schema' });
    expect(cloudSyncDiagnostic(error)).toEqual({
      stage: 'groups',
      message: 'failed',
      code: 'PGRST204',
      hint: 'reload schema',
    });
  });
});
