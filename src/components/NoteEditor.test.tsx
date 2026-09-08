import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import NoteEditor from './NoteEditor';

describe('NoteEditor layout', () => {
  it('uses the full remaining editor height without a viewport-based content gap', () => {
    const markup = renderToStaticMarkup(
      <NoteEditor
        note={null}
        groups={[]}
        onSave={() => undefined}
        onCancel={() => undefined}
      />,
    );

    expect(markup).toContain('min-h-0 flex-1 flex-col');
    expect(markup).toContain('min-h-full w-full max-w-none flex-1 flex-col');
    expect(markup).toContain('w-full flex-1 resize-none');
    expect(markup).not.toContain('calc(100vh-360px)');
    expect(markup).not.toContain('resize-y');
  });
});
