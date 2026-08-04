import { useEffect, useState } from 'react';
import { archivePolicy } from '../../config/archivePolicy.js';
import { isSupabaseConfigured, supabase } from '../../../supabase/client.ts';

const unlockSessionKey = 'archive-store-unlocked';

function getAuthErrorMessage(error) {
  const message = String(error?.message || '');
  if (/invalid login credentials/i.test(message)) return '이메일 또는 비밀번호가 올바르지 않습니다.';
  if (/rate limit|too many/i.test(message)) return '로그인 시도가 많습니다. 잠시 후 다시 시도하세요.';
  if (/fetch|network/i.test(message)) return '네트워크 연결을 확인하세요.';
  return message || '로그인에 실패했습니다.';
}

export function useArchiveAuth({ dataBackend }) {
  const isSupabaseBackend = dataBackend === 'supabase';
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseBackend && isSupabaseConfigured);
  const [email, setEmail] = useState(() => localStorage.getItem('archive_store_remembered_email') || '');
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(() => localStorage.getItem('archive_store_remember_email') === 'true');
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState('');
  const [pin, setPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(() => sessionStorage.getItem(unlockSessionKey) === 'true');
  const [authStatus, setAuthStatus] = useState('');
  const userId = isSupabaseBackend ? authUser?.id : archivePolicy.userId;

  useEffect(() => {
    if (!isSupabaseBackend || !supabase) {
      setAuthLoading(false);
      return undefined;
    }
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user || null);
      setAuthLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, [isSupabaseBackend]);

  async function handleLogin(event) {
    event.preventDefault();
    if (!supabase) {
      setAuthStatus('Supabase 인증 설정 후 로그인할 수 있습니다.');
      return;
    }
    setAuthStatus('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setAuthStatus(getAuthErrorMessage(error));
      return;
    }
    setPassword('');
    if (rememberEmail) {
      localStorage.setItem('archive_store_remember_email', 'true');
      localStorage.setItem('archive_store_remembered_email', email.trim());
    } else {
      localStorage.removeItem('archive_store_remember_email');
      localStorage.removeItem('archive_store_remembered_email');
    }
  }

  async function handlePasswordReset(event) {
    event.preventDefault();
    if (!supabase) return;
    setResetStatus('비밀번호 재설정 이메일을 전송하는 중...');
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), { redirectTo: window.location.origin });
    setResetStatus(error ? '이메일 전송에 실패했습니다.' : '비밀번호 재설정 이메일이 발송되었습니다. 메일함을 확인해 주세요.');
    if (!error) setResetEmail('');
  }

  async function handleLogout() {
    sessionStorage.removeItem(unlockSessionKey);
    setIsUnlocked(false);
    setAuthUser(null);
    if (supabase) await supabase.auth.signOut();
  }

  function handleUnlock(event) {
    event.preventDefault();
    if (pin === archivePolicy.pin) {
      sessionStorage.setItem(unlockSessionKey, 'true');
      setIsUnlocked(true);
      setAuthStatus('');
      return;
    }
    setAuthStatus('PIN이 일치하지 않습니다.');
  }

  let screenType = null;
  if (isSupabaseBackend && authLoading) screenType = 'loading';
  else if (isSupabaseBackend && isResetMode) screenType = 'reset';
  else if (isSupabaseBackend && !authUser) screenType = 'supabase';
  else if (!isSupabaseBackend && !isUnlocked) screenType = 'pin';

  return {
    authLoading, authStatus, authUser, email, handleLogin, handleLogout, handlePasswordReset, handleUnlock,
    isSupabaseBackend, password, pin, rememberEmail, resetEmail, resetStatus, screenType,
    setEmail, setPassword, setPin, setRememberEmail, setResetEmail, userId,
    closeResetMode: () => setIsResetMode(false),
    openResetMode: () => { setIsResetMode(true); setResetStatus(''); },
  };
}
