import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');

describe('archive screen scroll layout', () => {
  it('assigns vertical scrolling to the archive screen container', () => {
    expect(appSource).toContain(
      'className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar bg-background"',
    );
  });

  it('does not keep the archive screen container overflow hidden', () => {
    expect(appSource).not.toMatch(
      /screen === 'ARCHIVE'[\s\S]{0,160}className="[^"]*overflow-hidden[^"]*"/,
    );
  });
});
