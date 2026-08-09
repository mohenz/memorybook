import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import SearchView from './SearchView';

describe('SearchView', () => {
  it('starts with an empty search query', () => {
    const markup = renderToStaticMarkup(
      <SearchView
        notes={[]}
        groups={[]}
        onSelectNote={() => undefined}
        onAddNote={() => undefined}
      />,
    );

    expect(markup).toContain('placeholder="검색어를 입력하여 메모, 일정을 찾아보세요..."');
    expect(markup).not.toContain('value="아이디어"');
    expect(markup).toContain('aria-haspopup="listbox"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('flex flex-wrap items-center gap-3');
  });
});
