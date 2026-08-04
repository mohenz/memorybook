import { describe, expect, it } from 'vitest';
import { Note, Schedule } from '../types';
import {
  getActiveSchedules,
  getTrashedSchedules,
  moveScheduleToTrash,
  permanentlyDeleteSchedule,
  restoreNote,
  restoreSchedule,
} from './trash';

const note: Note = {
  id: 'note-1',
  title: '삭제된 메모',
  content: '',
  groupId: 'personal',
  createdAt: 'created',
  updatedAt: 'updated',
  dateString: '2026-08-03',
  isFavorite: false,
  isDeleted: true,
  images: [],
  checklist: [],
};

const schedule: Schedule = {
  id: 'schedule-1',
  title: '복원할 일정',
  dateString: '2026-08-03',
  allDay: true,
  priority: 'normal',
  createdAt: 'created',
  updatedAt: 'updated',
};

describe('trash state transitions', () => {
  it('restores a deleted note without changing its folder', () => {
    expect(restoreNote([note], note.id)[0]).toMatchObject({
      id: note.id,
      groupId: 'personal',
      isDeleted: false,
    });
  });

  it('moves a schedule to trash and excludes it from active schedules', () => {
    const schedules = moveScheduleToTrash([schedule], schedule.id, 'deleted-at');

    expect(getActiveSchedules(schedules)).toEqual([]);
    expect(getTrashedSchedules(schedules)[0]).toMatchObject({
      id: schedule.id,
      isDeleted: true,
      updatedAt: 'deleted-at',
    });
  });

  it('restores or permanently deletes a trashed schedule', () => {
    const trashed = moveScheduleToTrash([schedule], schedule.id, 'deleted-at');
    const restored = restoreSchedule(trashed, schedule.id, 'restored-at');

    expect(getActiveSchedules(restored)[0]).toMatchObject({
      id: schedule.id,
      isDeleted: false,
      updatedAt: 'restored-at',
    });
    expect(permanentlyDeleteSchedule(trashed, schedule.id)).toEqual([]);
  });
});
