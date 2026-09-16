import { describe, expect, it } from 'vitest';
import { isStandaloneDisplay } from './displayMode';

function createWindow({ mediaMatches = false, iosStandalone = false } = {}): Window {
  return {
    matchMedia: () => ({ matches: mediaMatches }),
    navigator: { standalone: iosStandalone },
  } as unknown as Window;
}

describe('isStandaloneDisplay', () => {
  it('detects an installed PWA through the display-mode media query', () => {
    expect(isStandaloneDisplay(createWindow({ mediaMatches: true }))).toBe(true);
  });

  it('detects an installed iOS home-screen app', () => {
    expect(isStandaloneDisplay(createWindow({ iosStandalone: true }))).toBe(true);
  });

  it('keeps regular browser tabs out of standalone mode', () => {
    expect(isStandaloneDisplay(createWindow())).toBe(false);
  });
});
