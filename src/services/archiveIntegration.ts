import { Group, Note, NotificationSettings, Schedule } from '../types';
import { isSupabaseConfigured, supabase } from '../supabase/client';

const STORAGE_BUCKET = 'memorybook-files';
const STORAGE_MARKER = 'memorybook-storage:';
const storageUrlMarkers = new Map<string, string>();

export interface MemoCloudState {
  darkMode: boolean;
  groups: Group[];
  notes: Note[];
  schedules: Schedule[];
  notificationSettings?: NotificationSettings;
  profileImage: string;
}

export interface ArchiveAccount {
  uid: string;
  email: string | null;
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

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user;
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

async function hydrateState(state: Partial<MemoCloudState>) {
  const notes = await Promise.all((state.notes || []).map(async (note) => ({
    ...note,
    images: await Promise.all((note.images || []).map(resolveStorageValue)),
  })));
  return {
    ...state,
    notes,
    profileImage: typeof state.profileImage === 'string' ? await resolveStorageValue(state.profileImage) : state.profileImage,
  };
}

function storageValue(value: string) {
  return storageUrlMarkers.get(value) || value;
}

function persistedState(state: MemoCloudState): MemoCloudState {
  return {
    ...state,
    profileImage: storageValue(state.profileImage),
    notes: state.notes.map((note) => ({ ...note, images: note.images.map(storageValue) })),
  };
}

export async function loadMemoCloudState(userId: string): Promise<Partial<MemoCloudState> | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from('memo_states').select('state').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data?.state ? hydrateState(data.state as Partial<MemoCloudState>) : null;
}

export async function saveMemoCloudState(userId: string, state: MemoCloudState) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('memo_states').upsert(
    { user_id: userId, state: persistedState(state) },
    { onConflict: 'user_id' },
  );
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
