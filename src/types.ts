export interface Group {
  id: string;
  name: string;
  icon?: string; // name of lucide icon
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  groupId: string; // "all", "work", "personal", "travel", "trash", "favorites"
  createdAt: string; // e.g. "2023년 10월 15일 오후 2:30"
  updatedAt: string; // e.g. "2023년 10월 15일 오후 2:30"
  dateString: string; // e.g. "2026-07-15" to align with calendar
  isFavorite: boolean;
  isDeleted: boolean;
  images: string[]; // List of hotlinked image URLs
  checklist: ChecklistItem[];
}

export type ScreenType = 'SPLASH' | 'DASHBOARD' | 'EDITOR' | 'SEARCH' | 'CALENDAR' | 'ARCHIVE';

export type SchedulePriority = 'high' | 'normal' | 'low';

export type ScheduleWeekday = 'SU' | 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA';

export interface ScheduleRecurrence {
  frequency: 'weekly';
  weekdays: ScheduleWeekday[];
  untilDateString?: string;
}

export interface ScheduleReminder {
  enabled: boolean;
  minutesBefore: 10 | 30 | 60 | 1440;
  frequency: 'once' | 'daily' | 'weekly';
}

export interface NotificationSettings {
  browserPermission: boolean;
  dailyDigest: {
    enabled: boolean;
    time: string;
  };
  weeklyDigest: {
    enabled: boolean;
    dayOfWeek: number;
    time: string;
  };
}

export interface Schedule {
  id: string;
  title: string;
  dateString: string; // e.g. "2026-07-15" to align with calendar
  allDay: boolean; // true = 시간 없는 종일(고정) 일정
  startTime?: string; // "HH:mm", allDay=false일 때 필수
  endTime?: string; // "HH:mm", allDay=false일 때 필수
  priority: SchedulePriority;
  memo?: string;
  recurrence?: ScheduleRecurrence;
  reminder?: ScheduleReminder;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}
