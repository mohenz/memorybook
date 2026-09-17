import type { IncomingMessage, ServerResponse } from 'node:http';
import { createClient } from '@supabase/supabase-js';
import { crawlMetadata } from '../server/bookmarkMetadata.js';

async function readBody(req: IncomingMessage & { body?: unknown }) {
  if (req.body !== undefined) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (Buffer.byteLength(body) > 8192) throw new Error('요청이 너무 큽니다.');
  }
  return JSON.parse(body);
}

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const send = (status: number, data: unknown) => { res.statusCode = status; res.end(JSON.stringify(data)); };
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(405, { error: 'POST 요청이 필요합니다.' }); }
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return send(401, { error: '로그인이 필요합니다.' });
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return send(503, { error: '서버 설정이 필요합니다.' });
  try {
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) return send(401, { error: '로그인이 필요합니다.' });
    const body = await readBody(req);
    if (!body || typeof body.url !== 'string' || body.url.length > 4096) return send(400, { error: 'URL을 확인해 주세요.' });
    return send(200, await crawlMetadata(body.url));
  } catch {
    return send(422, { error: '사이트 정보를 가져오지 못했습니다. 제목을 직접 입력해 저장할 수 있습니다.' });
  }
}
