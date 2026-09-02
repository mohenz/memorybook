import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import SplashView from './SplashView';

describe('SplashView branding', () => {
  it('renders the supplied responsive MEMOry logo', () => {
    const markup = renderToStaticMarkup(<SplashView onComplete={() => undefined} />);

    expect(markup).toContain('src="/brand/memory-splash.png"');
    expect(markup).toContain('alt="MEMOry — 기억을 정리하고, 영감을 연결하다"');
    expect(markup).toContain('w-[min(94vw,768px)]');
  });
});
