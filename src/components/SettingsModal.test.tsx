import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import SettingsModal from './SettingsModal';
import { Group } from '../types';

const mockGroups: Group[] = [
  { id: 'group-1', name: '업무', icon: 'Briefcase' },
  { id: 'group-2', name: '개인', icon: 'User' },
];

const renderModal = (groups: Group[] = mockGroups) =>
  renderToStaticMarkup(
    <SettingsModal
      onClose={() => undefined}
      profileImage="https://example.com/avatar.png"
      onUpdateProfileImage={async () => undefined}
      darkMode={false}
      onToggleDarkMode={() => undefined}
      groups={groups}
      onRenameGroup={() => undefined}
      onReorderGroup={() => undefined}
      archiveUserEmail=""
      archiveStatus=""
      supabaseConfigured
      onArchiveLogin={async () => undefined}
      onArchiveLogout={async () => undefined}
      onArchivePasswordReset={async () => undefined}
    />
  );

describe('SettingsModal folder tab', () => {
  it('renders the folder name management tab entry point', () => {
    const markup = renderModal();
    expect(markup).toContain('폴더 이름 관리');
  });

  it('defaults to the profile tab, so folder rows are not in the initial static markup', () => {
    const markup = renderModal();
    expect(markup).not.toContain('value="업무"');
  });
});
