import { describe, expect, it } from 'vitest';
import { shouldEmitArchiveAccountChange } from './archiveIntegration';

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
