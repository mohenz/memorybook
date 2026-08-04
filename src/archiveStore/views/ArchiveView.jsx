import { useEffect, useState } from 'react';
import { archivePolicy } from '../config/archivePolicy.js';
import { getEnv } from '../core/env.js';
import { useArchiveAuth } from '../features/archive/useArchiveAuth.js';
import { useArchiveFiles } from '../features/archive/useArchiveFiles.js';
import { useArchiveListControls } from '../features/archive/useArchiveListControls.js';
import { useArchiveMutations } from '../features/archive/useArchiveMutations.js';
import { ArchiveAuthScreen } from './ArchiveAuthScreen.jsx';
import { ArchiveWorkspaceScreen } from './ArchiveWorkspaceScreen.jsx';

export function ArchiveView({ integratedUser = null, onIntegratedLogout = null } = {}) {
  const rawBackend = getEnv('VITE_DATA_BACKEND') || 'local-api';
  const configuredBackend = String(rawBackend).trim().replace(/^\uFEFF/g, '');
  const dataBackend = integratedUser ? 'supabase' : configuredBackend;
  const authState = useArchiveAuth({ dataBackend });
  const effectiveAuthState = integratedUser
    ? {
        ...authState,
        authUser: integratedUser,
        isSupabaseBackend: true,
        screenType: null,
        userId: integratedUser.uid,
        handleLogout: onIntegratedLogout || authState.handleLogout,
      }
    : authState;
  const [theme, setTheme] = useState(() => localStorage.getItem('archive-theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('archive-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };
  const { files, setFiles, usedBytes, loading, error, supabaseReady } = useArchiveFiles(effectiveAuthState.userId, dataBackend);
  const listState = useArchiveListControls(files);
  const usedRatio = Math.min((usedBytes / archivePolicy.storageLimitBytes) * 100, 100);
  const mutations = useArchiveMutations({
    dataBackend,
    supabaseReady,
    selectedFile: listState.selectedFile,
    setFiles,
    setSelectedFile: listState.setSelectedFile,
    setSelectedIds: listState.setSelectedIds,
    usedBytes,
    userId: effectiveAuthState.userId,
  });

  if (effectiveAuthState.screenType === 'loading') {
    return <div className="auth-loading-placeholder" />;
  }

  if (effectiveAuthState.screenType) {
    return (
      <ArchiveAuthScreen
        authLoading={effectiveAuthState.authLoading}
        email={effectiveAuthState.email}
        onBackToLogin={effectiveAuthState.closeResetMode}
        onEmailChange={effectiveAuthState.setEmail}
        onLogin={effectiveAuthState.handleLogin}
        onPasswordChange={effectiveAuthState.setPassword}
        onPasswordReset={effectiveAuthState.handlePasswordReset}
        onPinChange={effectiveAuthState.setPin}
        onRememberEmailChange={effectiveAuthState.setRememberEmail}
        onResetEmailChange={effectiveAuthState.setResetEmail}
        onResetMode={effectiveAuthState.openResetMode}
        onUnlock={effectiveAuthState.handleUnlock}
        password={effectiveAuthState.password}
        pin={effectiveAuthState.pin}
        rememberEmail={effectiveAuthState.rememberEmail}
        resetEmail={effectiveAuthState.resetEmail}
        resetStatus={effectiveAuthState.resetStatus}
        status={effectiveAuthState.authStatus}
        type={effectiveAuthState.screenType}
        theme={theme}
        onThemeToggle={toggleTheme}
      />
    );
  }

  return (
    <ArchiveWorkspaceScreen
      activeCategory={listState.activeCategory}
      authUser={effectiveAuthState.authUser}
      currentPage={listState.currentPage}
      dataBackend={dataBackend}
      error={error}
      filteredFiles={listState.filteredFiles}
      supabaseReady={supabaseReady}
      isAllSelected={listState.isAllSelected}
      isSupabaseBackend={effectiveAuthState.isSupabaseBackend}
      isSomeSelected={listState.isSomeSelected}
      loading={loading}
      onCategoryChange={listState.setActiveCategory}
      onDeleteFiles={mutations.deleteFiles}
      onDrop={mutations.handleDrop}
      onFiles={mutations.handleFiles}
      onLogout={effectiveAuthState.handleLogout}
      onPageChange={listState.setCurrentPage}
      onPageSizeChange={listState.setPageSize}
      onPaste={mutations.handlePaste}
      onQueryChange={listState.setQuery}
      onSelectAllToggle={listState.handleSelectAllToggle}
      onSelectedFileChange={listState.setSelectedFile}
      onToggleSelected={listState.toggleSelected}
      pageCount={listState.pageCount}
      pageNumbers={listState.pageNumbers}
      pageSize={listState.pageSize}
      query={listState.query}
      selectedFile={listState.selectedFile}
      selectedFiles={listState.selectedFiles}
      selectedIds={listState.selectedIds}
      status={mutations.mutationStatus}
      usedBytes={usedBytes}
      usedRatio={usedRatio}
      visibleFiles={listState.visibleFiles}
      theme={theme}
      onThemeToggle={toggleTheme}
    />
  );
}
