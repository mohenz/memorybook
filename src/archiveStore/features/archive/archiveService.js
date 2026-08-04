import { isSupabaseConfigured, supabase } from '../../../supabase/client.ts';
import { getFileCategory } from '../../core/fileTypes.js';

const storageBucket = 'memorybook-files';

export function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  }
  return supabase;
}

async function mapFile(row) {
  const client = requireSupabase();
  const { data, error } = await client.storage.from(storageBucket).createSignedUrl(row.storage_path, 3600);
  if (error) throw error;
  return {
    id: row.id,
    filename: row.filename,
    mimeType: row.mime_type,
    size: Number(row.size_bytes),
    storagePath: row.storage_path,
    downloadUrl: data.signedUrl,
    category: row.category,
    tags: row.tags || [],
    uploadedAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchFiles(userId) {
  const { data, error } = await requireSupabase()
    .from('archive_files')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return Promise.all((data || []).map(mapFile));
}

export function subscribeFiles(userId, onFiles, onError) {
  const client = requireSupabase();
  let active = true;
  const refresh = () => fetchFiles(userId).then((files) => active && onFiles(files)).catch(onError);
  void refresh();
  const channel = client
    .channel(`archive-files-${userId}-${crypto.randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'archive_files', filter: `user_id=eq.${userId}` }, refresh)
    .subscribe();
  return () => {
    active = false;
    void client.removeChannel(channel);
  };
}

export async function uploadArchiveFile({ file, userId, onProgress }) {
  const client = requireSupabase();
  const safeName = file.name.replace(/[^\w.\-가-힣 ]/g, '_');
  const fileId = crypto.randomUUID();
  const storagePath = `${userId}/files/${fileId}_${safeName}`;
  onProgress?.(0);
  const { error: uploadError } = await client.storage.from(storageBucket).upload(storagePath, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data, error: insertError } = await client.from('archive_files').insert({
    id: fileId,
    user_id: userId,
    filename: file.name,
    mime_type: file.type || 'application/octet-stream',
    size_bytes: file.size,
    storage_path: storagePath,
    category: getFileCategory(file),
    tags: [],
  }).select('*').single();
  if (insertError) {
    await client.storage.from(storageBucket).remove([storagePath]);
    throw insertError;
  }
  onProgress?.(100);
  return mapFile(data);
}

export async function deleteArchiveFile({ file, userId }) {
  const client = requireSupabase();
  if (file.storagePath) {
    const { error } = await client.storage.from(storageBucket).remove([file.storagePath]);
    if (error && !/not found/i.test(error.message)) throw error;
  }
  const { error } = await client.from('archive_files').delete().eq('id', file.id).eq('user_id', userId);
  if (error) throw error;
}
