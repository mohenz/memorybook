import { Group } from '../types';
import { toLocalDateString } from './date';

export function getAutoNoteTitle(groupId: string | undefined, groups: Group[], date: Date = new Date()) {
  const group = groups.find((item) => item.id === groupId);
  const groupKey = `${groupId || ''} ${group?.name || ''}`.toLowerCase();
  const datePrefix = toLocalDateString(date);

  if (groupKey.includes('프로젝트') || groupKey.includes('project')) {
    return `${datePrefix}_프로젝트_일정`;
  }

  if (groupKey.includes('일정') || groupKey.includes('schedule')) {
    return `${datePrefix}_일정`;
  }

  return null;
}

export function resolveNoteTitle({
  fallbackTitle = '제목 없는 메모',
  groupId,
  groups,
  title,
}: {
  fallbackTitle?: string;
  groupId: string | undefined;
  groups: Group[];
  title: string | undefined;
}) {
  const typedTitle = title?.trim();

  if (typedTitle && typedTitle !== fallbackTitle) return typedTitle;

  return getAutoNoteTitle(groupId, groups) || fallbackTitle;
}
