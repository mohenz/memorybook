import { useCallback, useEffect, useMemo, useState } from 'react';
import { Schedule } from '../types';
import { getPopupData } from '../utils/scheduleFilter';
import { toLocalDateString } from '../utils/date';

export const SCHEDULE_POPUP_DISMISS_KEY = 'memory_popup_dismissed';

export function useSchedulePopup(schedules: Schedule[], enabled = true) {
  const [todayString, setTodayString] = useState(() => toLocalDateString());
  const [open, setOpen] = useState(false);
  const data = useMemo(() => getPopupData(schedules, new Date(`${todayString}T12:00:00`)), [schedules, todayString]);
  const hasAny = data.reminders.length + data.today.length + data.tomorrow.length + data.dayAfter.length > 0;

  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = window.setTimeout(() => setTodayString(toLocalDateString()), tomorrow.getTime() - now.getTime() + 1_000);
    return () => window.clearTimeout(timer);
  }, [todayString]);

  useEffect(() => {
    if (!enabled || !hasAny) {
      setOpen(false);
      return;
    }
    setOpen(window.localStorage.getItem(SCHEDULE_POPUP_DISMISS_KEY) !== todayString);
  }, [enabled, hasAny, todayString]);

  const close = useCallback((dontShowToday: boolean) => {
    if (dontShowToday) window.localStorage.setItem(SCHEDULE_POPUP_DISMISS_KEY, todayString);
    setOpen(false);
  }, [todayString]);

  return { open: enabled && hasAny && open, close, data };
}
