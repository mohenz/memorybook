import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from '@jest/globals';

const appSource = readFileSync(path.join(process.cwd(), 'src', 'App.tsx'), 'utf8');

describe('archive screen scroll layout', () => {
  test('assigns vertical scrolling to the archive screen container', () => {
    expect(appSource).toContain(
      'className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar bg-background"',
    );
  });

  test('does not keep the archive screen container overflow hidden', () => {
    expect(appSource).not.toMatch(
      /screen === 'ARCHIVE'[\s\S]{0,160}className="[^"]*overflow-hidden[^"]*"/,
    );
  });
});
