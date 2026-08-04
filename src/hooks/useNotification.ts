import { useEffect } from 'react';
import { NotificationSettings, Schedule } from '../types';
import { notificationService } from '../services/notificationService';

export function useNotification(schedules: Schedule[], settings: NotificationSettings, enabled = true) {
  useEffect(() => {
    if (!enabled) {
      notificationService.clearAll();
      return;
    }
    notificationService.scheduleAll(schedules, settings);
    return () => notificationService.clearAll();
  }, [enabled, schedules, settings]);

  return {
    supported: notificationService.isSupported(),
    requestPermission: () => notificationService.requestPermission(),
  };
}
