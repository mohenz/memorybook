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
    expect(markup).not.toContain('그룹: 전체');
    expect(markup).not.toContain('이미지 첨부');
    expect(markup).not.toContain('즐겨찾기');
    expect(markup).not.toContain('정렬: 최신순');
    expect(markup).toContain('flex min-h-0 flex-1 flex-col');
  });
});
