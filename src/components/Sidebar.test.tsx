import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Sidebar, { LogoutConfirmDialog } from './Sidebar';

const renderSidebar = () => renderToStaticMarkup(
  <Sidebar
    currentScreen="CALENDAR"
    setScreen={() => undefined}
    groups={[]}
    activeGroupId="all"
    setActiveGroupId={() => undefined}
    onAddGroup={() => undefined}
    totalNotesCount={0}
    profileImage="https://example.com/avatar.png"
    onOpenArchive={() => undefined}
    onOpenSettings={() => undefined}
    onLogout={async () => undefined}
  />
);

describe('Sidebar footer actions', () => {
  it('renders help, settings, and logout as icon-only accessible buttons', () => {
    const markup = renderSidebar();

    expect(markup).toContain('aria-label="도움말"');
    expect(markup).toContain('aria-label="설정"');
    expect(markup).toContain('aria-label="로그아웃"');
    expect(markup).not.toMatch(/<span>도움말<\/span>|<span>설정<\/span>|<span>로그아웃<\/span>/);
    expect(markup.indexOf('aria-label="설정"')).toBeLessThan(markup.indexOf('aria-label="로그아웃"'));
    expect(markup).not.toContain('border-dashed border-outline');
  });

  it('renders the logout confirmation dialog in a centered overlay', () => {
    const markup = renderToStaticMarkup(
      <LogoutConfirmDialog onCancel={() => undefined} onConfirm={() => undefined} />,
    );

    expect(markup).toContain('fixed inset-0');
    expect(markup).toContain('items-center justify-center');
    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-modal="true"');
    expect(markup).toContain('로그아웃하겠습니까?');
    expect(markup).toContain('>취소</button>');
    expect(markup).toContain('>확인</button>');
  });
});
