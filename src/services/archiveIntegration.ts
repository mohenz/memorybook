import type { AuthChangeEvent } from '@supabase/supabase-js';
import { ChecklistItem, Group, Note, NotificationSettings, Schedule, ScheduleRecurrence, ScheduleReminder, SchedulePriority, TodoItem, TodoStatus } from '../types';
import { isSupabaseConfigured, supabase } from '../supabase/client';

const STORAGE_BUCKET = 'memorybook-files';
const STORAGE_MARKER = 'memorybook-storage:';
const storageUrlMarkers = new Map<string, string>();

export interface MemoCloudState {
  darkMode: boolean;
  groups: Group[];
  notes: Note[];
  schedules: Schedule[];
  todos: TodoItem[];
  notificationSettings?: NotificationSettings;
  profileImage: string;
}

export interface ArchiveAccount {
  uid: string;
  email: string | null;
}

export function shouldEmitArchiveAccountChange(
  event: AuthChangeEvent,
  previousUserId: string | null | undefined,
  nextUserId: string | null,
) {
  if (event === 'TOKEN_REFRESHED') return false;
  return previousUserId === undefined || previousUserId !== nextUserId;
}

function requireSupabase() {
  if (!supabase) throw new Error('Supabase 설정이 없습니다.');
  return supabase;
}

export function subscribeArchiveAccount(onUser: (user: ArchiveAccount | null) => void) {
  if (!supabase) {
    onUser(null);
    return () => undefined;
  }

  let emittedUserId: string | null | undefined;
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    const user = session?.user;
    const nextUserId = user?.id || null;
    if (!shouldEmitArchiveAccountChange(event, emittedUserId, nextUserId)) return;

    emittedUserId = nextUserId;
    onUser(user ? { uid: user.id, email: user.email || null } : null);
  });
  return () => data.subscription.unsubscribe();
}

export async function loginArchiveAccount(email: string, password: string) {
  const { error } = await requireSupabase().auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

export async function logoutArchiveAccount() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetArchivePassword(email: string) {
  const { error } = await requireSupabase().auth.resetPasswordForEmail(email.trim(), {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
}

async function resolveStorageValue(value: string) {
  if (!value.startsWith(STORAGE_MARKER)) return value;
  const storagePath = value.slice(STORAGE_MARKER.length);
  const { data, error } = await requireSupabase().storage.from(STORAGE_BUCKET).createSignedUrl(storagePath, 3600);
  if (error) throw error;
  storageUrlMarkers.set(data.signedUrl, value);
  return data.signedUrl;
}

function storageValue(value: string) {
  return storageUrlMarkers.get(value) || value;
}

async function hydrateNote(note: Note): Promise<Note> {
  return {
    ...note,
    images: await Promise.all(note.images.map(resolveStorageValue)),
  };
}

function persistNote(note: Note): Note {
  return { ...note, images: note.images.map(storageValue) };
}

// --- Row <-> client type mapping. Every table is keyed by (user_id, id); rows always
// carry user_id explicitly so each entity can be written independently of the others. ---

interface GroupRow {
  id: string;
  name: string;
  icon: string | null;
  position: number;
}

function rowToGroup(row: GroupRow): Group {
  return { id: row.id, name: row.name, icon: row.icon || undefined };
}

interface NoteRow {
  id: string;
  group_id: string | null;
  title: string;
  content: string;
  date_string: string;
  is_favorite: boolean;
  is_deleted: boolean;
  images: string[];
  checklist: ChecklistItem[];
  created_at: string;
  updated_at: string;
}

function rowToNote(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    groupId: row.group_id || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    dateString: row.date_string,
    isFavorite: row.is_favorite,
    isDeleted: row.is_deleted,
    images: row.images || [],
    checklist: row.checklist || [],
  };
}

function noteToRow(userId: string, note: Note) {
  return {
    user_id: userId,
    id: note.id,
    group_id: note.groupId || null,
    title: note.title,
    content: note.content,
    date_string: note.dateString,
    is_favorite: note.isFavorite,
    is_deleted: note.isDeleted,
    images: note.images,
    checklist: note.checklist,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
  };
}

interface ScheduleRow {
  id: string;
  title: string;
  date_string: string;
  all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  priority: SchedulePriority;
  memo: string | null;
  recurrence: ScheduleRecurrence | null;
  reminder: ScheduleReminder | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

function rowToSchedule(row: ScheduleRow): Schedule {
  return {
    id: row.id,
    title: row.title,
    dateString: row.date_string,
    allDay: row.all_day,
    startTime: row.start_time || undefined,
    endTime: row.end_time || undefined,
    priority: row.priority,
    memo: row.memo || undefined,
    recurrence: row.recurrence || undefined,
    reminder: row.reminder || undefined,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function scheduleToRow(userId: string, schedule: Schedule) {
  return {
    user_id: userId,
    id: schedule.id,
    title: schedule.title,
    date_string: schedule.dateString,
    all_day: schedule.allDay,
    start_time: schedule.startTime || null,
    end_time: schedule.endTime || null,
    priority: schedule.priority,
    memo: schedule.memo || null,
    recurrence: schedule.recurrence || null,
    reminder: schedule.reminder || null,
    is_deleted: schedule.isDeleted ?? false,
    created_at: schedule.createdAt,
    updated_at: schedule.updatedAt,
  };
}

interface TodoRow {
  id: string;
  text: string;
  status: TodoStatus;
  created_date_string: string;
  target_date_string: string | null;
  created_at: string;
  updated_at: string;
}

function rowToTodo(row: TodoRow): TodoItem {
  return {
    id: row.id,
    text: row.text,
    status: row.status,
    createdDateString: row.created_date_string,
    targetDateString: row.target_date_string || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function todoToRow(userId: string, todo: TodoItem) {
  return {
    user_id: userId,
    id: todo.id,
    text: todo.text,
    status: todo.status,
    created_date_string: todo.createdDateString,
    target_date_string: todo.targetDateString || null,
    created_at: todo.createdAt,
    updated_at: todo.updatedAt,
  };
}

interface UserSettingsRow {
  dark_mode: boolean;
  profile_image: string;
  notification_settings: NotificationSettings | Record<string, never> | null;
}

function rowToNotificationSettings(row: UserSettingsRow | null): NotificationSettings | undefined {
  const settings = row?.notification_settings;
  if (!settings || Object.keys(settings).length === 0) return undefined;
  return settings as NotificationSettings;
}

// --- Load: one read per table, in parallel. A failure anywhere throws and leaves the
// caller's existing in-memory state untouched — it never falls back to treating "load
// failed" as "state is empty". ---
export async function loadMemoCloudState(userId: string): Promise<Partial<MemoCloudState> | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const client = supabase;

  const [usersRes, groupsRes, notesRes, schedulesRes, todosRes] = await Promise.all([
    client.from('users').select('dark_mode, profile_image, notification_settings').eq('id', userId).maybeSingle(),
    client.from('groups').select('id, name, icon, position').eq('user_id', userId).order('position', { ascending: true }),
    client.from('notes').select('id, group_id, title, content, date_string, is_favorite, is_deleted, images, checklist, created_at, updated_at').eq('user_id', userId),
    client.from('schedules').select('id, title, date_string, all_day, start_time, end_time, priority, memo, recurrence, reminder, is_deleted, created_at, updated_at').eq('user_id', userId),
    client.from('todos').select('id, text, status, created_date_string, target_date_string, created_at, updated_at').eq('user_id', userId),
  ]);

  if (usersRes.error) throw usersRes.error;
  if (groupsRes.error) throw groupsRes.error;
  if (notesRes.error) throw notesRes.error;
  if (schedulesRes.error) throw schedulesRes.error;
  if (todosRes.error) throw todosRes.error;

  const rawProfileImage = usersRes.data?.profile_image;
  const profileImage = rawProfileImage ? await resolveStorageValue(rawProfileImage) : undefined;
  const notes = await Promise.all((notesRes.data || []).map((row) => hydrateNote(rowToNote(row as NoteRow))));

  return {
    darkMode: usersRes.data?.dark_mode ?? false,
    profileImage,
    notificationSettings: rowToNotificationSettings(usersRes.data as UserSettingsRow | null),
    groups: (groupsRes.data || []).map((row) => rowToGroup(row as GroupRow)),
    notes,
    schedules: (schedulesRes.data || []).map((row) => rowToSchedule(row as ScheduleRow)),
    todos: (todosRes.data || []).map((row) => rowToTodo(row as TodoRow)),
  };
}

// --- Per-entity writes. Each call touches exactly one table/row, so a failed or slow
// write can never overwrite unrelated notes/schedules/todos/groups/settings. ---

export async function saveUserSettings(userId: string, settings: { darkMode: boolean; profileImage: string; notificationSettings?: NotificationSettings }) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('users').update({
    dark_mode: settings.darkMode,
    profile_image: storageValue(settings.profileImage),
    notification_settings: settings.notificationSettings || {},
  }).eq('id', userId);
  if (error) throw error;
}

export async function upsertGroups(userId: string, groups: Group[]) {
  if (!isSupabaseConfigured || !supabase) return;
  if (groups.length === 0) return;
  const rows = groups.map((group, index) => ({
    user_id: userId,
    id: group.id,
    name: group.name,
    icon: group.icon || null,
    position: index,
  }));
  const { error } = await supabase.from('groups').upsert(rows, { onConflict: 'user_id,id' });
  if (error) throw error;
}

export async function upsertNote(userId: string, note: Note) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('notes').upsert(noteToRow(userId, persistNote(note)), { onConflict: 'user_id,id' });
  if (error) throw error;
}

export async function deleteNote(userId: string, noteId: string) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('notes').delete().eq('user_id', userId).eq('id', noteId);
  if (error) throw error;
}

export async function upsertSchedule(userId: string, schedule: Schedule) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('schedules').upsert(scheduleToRow(userId, schedule), { onConflict: 'user_id,id' });
  if (error) throw error;
}

export async function deleteSchedule(userId: string, scheduleId: string) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('schedules').delete().eq('user_id', userId).eq('id', scheduleId);
  if (error) throw error;
}

export async function upsertTodo(userId: string, todo: TodoItem) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('todos').upsert(todoToRow(userId, todo), { onConflict: 'user_id,id' });
  if (error) throw error;
}

export async function deleteTodo(userId: string, todoId: string) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('todos').delete().eq('user_id', userId).eq('id', todoId);
  if (error) throw error;
}

async function uploadAsset(userId: string, folder: string, file: File) {
  const client = requireSupabase();
  const safeName = file.name.replace(/[^\w.\-가-힣 ]/g, '_');
  const storagePath = `${userId}/${folder}/${crypto.randomUUID()}_${safeName}`;
  const { error } = await client.storage.from(STORAGE_BUCKET).upload(storagePath, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (error) throw error;
  return resolveStorageValue(`${STORAGE_MARKER}${storagePath}`);
}

export function uploadMemoImage(userId: string, file: File) {
  return uploadAsset(userId, 'memo/images', file);
}

export function uploadMemoProfileImage(userId: string, file: File) {
  return uploadAsset(userId, 'profile', file);
}
