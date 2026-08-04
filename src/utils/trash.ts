import { Note, Schedule } from '../types';

export function restoreNote(notes: Note[], noteId: string): Note[] {
  return notes.map(note => note.id === noteId ? { ...note, isDeleted: false } : note);
}

export function getActiveSchedules(schedules: Schedule[]): Schedule[] {
  return schedules.filter(schedule => !schedule.isDeleted);
}

export function getTrashedSchedules(schedules: Schedule[]): Schedule[] {
  return schedules.filter(schedule => schedule.isDeleted);
}

export function moveScheduleToTrash(
  schedules: Schedule[],
  scheduleId: string,
  updatedAt: string,
): Schedule[] {
  return schedules.map(schedule => schedule.id === scheduleId
    ? { ...schedule, isDeleted: true, updatedAt }
    : schedule);
}

export function restoreSchedule(
  schedules: Schedule[],
  scheduleId: string,
  updatedAt: string,
): Schedule[] {
  return schedules.map(schedule => schedule.id === scheduleId
    ? { ...schedule, isDeleted: false, updatedAt }
    : schedule);
}

export function permanentlyDeleteSchedule(schedules: Schedule[], scheduleId: string): Schedule[] {
  return schedules.filter(schedule => schedule.id !== scheduleId);
}
