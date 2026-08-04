import { Sun, Moon } from 'lucide-react';

export function ArchiveAuthScreen({
  authLoading,
  email,
  isResetMode,
  onBackToLogin,
  onEmailChange,
  onLogin,
  onPasswordChange,
  onPasswordReset,
  onPinChange,
  onRememberEmailChange,
  onResetEmailChange,
  onResetMode,
  onUnlock,
  password,
  pin,
  rememberEmail,
  resetEmail,
  resetStatus,
  status,
  type,
  theme,
  onThemeToggle,
}) {
  const themeButton = (
    <button className="icon-button auth-theme-toggle" type="button" onClick={onThemeToggle} title={theme === 'light' ? '어둡게 보기' : '밝게 보기'}>
      {theme === 'light' ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
    </button>
  );
  if (type === 'reset') {
    return (
      <main className="auth-shell">
        {themeButton}
        <form className="auth-panel" onSubmit={onPasswordReset}>
          <h1>비밀번호 재설정</h1>
          <p className="auth-note">가입된 이메일 주소로 재설정 링크를 전송합니다.</p>
          <label>
            <span>이메일</span>
            <input
              autoComplete="email"
              autoFocus
              type="email"
              value={resetEmail}
              onChange={(event) => onResetEmailChange(event.target.value)}
            />
          </label>
          <button type="submit" disabled={!resetEmail.trim()}>재설정 이메일 보내기</button>
          {resetStatus && <p className="auth-note reset-message">{resetStatus}</p>}
          <button className="text-button" type="button" onClick={onBackToLogin}>
            로그인 화면으로 돌아가기
          </button>
        </form>
      </main>
    );
  }

  if (type === 'supabase') {
    return (
      <main className="auth-shell">
        {themeButton}
        <form className="auth-panel" onSubmit={onLogin}>
          <h1>계정 로그인</h1>
          <p className="auth-note">Supabase 계정으로 개인 자료실에 접속합니다.</p>
          {authLoading && <p className="auth-note">인증 상태를 확인하고 있습니다.</p>}
          <label>
            <span>이메일</span>
            <input
              autoComplete="email"
              autoFocus
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
            />
          </label>
          <label>
            <span>비밀번호</span>
            <input
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={rememberEmail}
              onChange={(event) => onRememberEmailChange(event.target.checked)}
            />
            <span>이메일 기억하기</span>
          </label>
          <button type="submit" disabled={authLoading || !email.trim() || !password}>로그인</button>
          {status && <p className="pin-error">{status}</p>}
          <button className="text-button" type="button" onClick={onResetMode}>
            비밀번호를 잊으셨나요?
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      {themeButton}
      <form className="pin-panel" onSubmit={onUnlock}>
        <h1>PIN 인증</h1>
        <label>
          <span>PIN</span>
          <input
            autoFocus
            inputMode="numeric"
            maxLength={6}
            type="password"
            value={pin}
            onChange={(event) => onPinChange(event.target.value)}
          />
        </label>
        <button type="submit">열기</button>
        {status && <p className="pin-error">{status}</p>}
      </form>
    </main>
  );
}
