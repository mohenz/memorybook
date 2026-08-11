import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import HelpModal from './HelpModal';

describe('HelpModal', () => {
  it('describes the main application features in an accessible dialog', () => {
    const markup = renderToStaticMarkup(<HelpModal onClose={() => undefined} />);

    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-labelledby="help-title"');
    ['메모', '그룹', '캘린더', 'TO-DO LIST', '검색', '자료실'].forEach((label) => {
      expect(markup).toContain(label);
    });
    expect(markup).toContain('aria-label="도움말 닫기"');
  });
});
