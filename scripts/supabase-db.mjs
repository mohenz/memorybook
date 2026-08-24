import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import pg from 'pg';

const root = path.resolve(import.meta.dirname, '..');
const configPath = path.join(root, 'config', 'memorybook.cfg');
const migrationFiles = [
  '202608050001_initial_memorybook.sql',
  '202608241200_normalize_memo_tables.sql',
].map((file) => path.join(root, 'supabase', 'migrations', file));

function decode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function databaseConfig() {
  const config = await fs.readFile(configPath, 'utf8');
  const connectionUrl = config.match(/postgres(?:ql)?:\/\/[^\s"'`]+/)?.[0];
  if (!connectionUrl) throw new Error('memorybook.cfg에 PostgreSQL 연결 문자열이 없습니다.');

  const rest = connectionUrl.replace(/^postgres(?:ql)?:\/\//, '');
  const at = rest.lastIndexOf('@');
  const colon = rest.indexOf(':');
  const slash = rest.indexOf('/', at);
  const endpoint = rest.slice(at + 1, slash);
  const portSeparator = endpoint.lastIndexOf(':');

  return {
    user: decode(rest.slice(0, colon)),
    password: decode(rest.slice(colon + 1, at)),
    host: endpoint.slice(0, portSeparator),
    port: Number(endpoint.slice(portSeparator + 1)),
    database: decode(rest.slice(slash + 1).split('?')[0]),
    ssl: { rejectUnauthorized: false },
  };
}

async function apiConfig() {
  const config = await fs.readFile(configPath, 'utf8');
  const lines = config.split(/\r?\n/).map((line) => line.trim());
  const url = 'https://bmvyiwnokuhbkjtimygy.supabase.co';
  const secretKey = lines.find((line) => line.startsWith('sb_secret_'));
  if (!secretKey) throw new Error('memorybook.cfg에 Supabase Secret key가 없습니다.');
  return { url: url.replace(/\/$/, ''), secretKey };
}

function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

async function backup(client) {
  const tables = await client.query("select tablename from pg_tables where schemaname = 'public' order by tablename");
  const columns = await client.query("select table_name, column_name, data_type, is_nullable, column_default from information_schema.columns where table_schema = 'public' order by table_name, ordinal_position");
  const policies = await client.query("select schemaname, tablename, policyname, roles, cmd, qual, with_check from pg_policies where schemaname in ('public', 'storage') order by schemaname, tablename, policyname");
  const data = {};
  for (const { tablename } of tables.rows) {
    data[tablename] = (await client.query(`select * from public.${quoteIdentifier(tablename)}`)).rows;
  }
  const storage = await client.query("select id, name, public, file_size_limit, allowed_mime_types from storage.buckets order by id");
  const snapshot = { createdAt: new Date().toISOString(), tables: tables.rows, columns: columns.rows, policies: policies.rows, data, storageBuckets: storage.rows };
  const backupDir = path.join(root, 'backups');
  await fs.mkdir(backupDir, { recursive: true });
  const file = path.join(backupDir, `supabase_pre_migration_${new Date().toISOString().replaceAll(/[:.]/g, '-')}.json`);
  await fs.writeFile(file, JSON.stringify(snapshot, null, 2), 'utf8');
  console.log(JSON.stringify({ backup: path.relative(root, file), publicTables: tables.rowCount }));
}

async function backupRest() {
  const { url, secretKey } = await apiConfig();
  const headers = { apikey: secretKey };
  const schemaResponse = await fetch(`${url}/rest/v1/`, { headers });
  if (!schemaResponse.ok) throw new Error(`REST 스키마 조회 실패: HTTP ${schemaResponse.status}`);
  const schema = await schemaResponse.json();
  const tables = Object.keys(schema.paths || {})
    .filter((entry) => entry.startsWith('/') && !entry.startsWith('/rpc/'))
    .map((entry) => entry.slice(1))
    .filter(Boolean)
    .sort();
  const data = {};
  for (const table of tables) {
    const response = await fetch(`${url}/rest/v1/${encodeURIComponent(table)}?select=*`, { headers });
    if (!response.ok) throw new Error(`${table} 백업 실패: HTTP ${response.status}`);
    data[table] = await response.json();
  }
  const backupDir = path.join(root, 'backups');
  await fs.mkdir(backupDir, { recursive: true });
  const file = path.join(backupDir, `supabase_pre_migration_rest_${new Date().toISOString().replaceAll(/[:.]/g, '-')}.json`);
  await fs.writeFile(file, JSON.stringify({ createdAt: new Date().toISOString(), tables, data }, null, 2), 'utf8');
  console.log(JSON.stringify({ backup: path.relative(root, file), publicTables: tables.length }));
}

async function migrate(client) {
  const applied = [];
  for (const migrationPath of migrationFiles) {
    const sql = await fs.readFile(migrationPath, 'utf8');
    await client.query('begin');
    try {
      await client.query(sql);
      await client.query('commit');
    } catch (error) {
      await client.query('rollback');
      throw new Error(`${path.relative(root, migrationPath)} 적용 실패: ${error.message}`);
    }
    applied.push(path.relative(root, migrationPath));
  }
  console.log(JSON.stringify({ migrations: applied, applied: true }));
}

const NORMALIZED_TABLES = ['users', 'groups', 'notes', 'schedules', 'todos'];

async function verify(client) {
  const allTables = ['memo_states', 'archive_files', ...NORMALIZED_TABLES];
  const tables = await client.query(
    "select c.relname as table_name, c.relrowsecurity as rls from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = any($1::text[]) order by c.relname",
    [allTables],
  );
  const policies = await client.query(
    "select schemaname, tablename, policyname, cmd from pg_policies where (schemaname = 'public' and tablename = any($1::text[])) or (schemaname = 'storage' and tablename = 'objects' and policyname like 'memorybook_%') order by schemaname, tablename, policyname",
    [allTables],
  );
  const bucket = await client.query("select id, public, file_size_limit from storage.buckets where id = 'memorybook-files'");
  const counts = {};
  for (const table of allTables) {
    const result = await client.query(`select count(*)::int as count from public.${quoteIdentifier(table)}`);
    counts[table] = result.rows[0].count;
  }
  console.log(JSON.stringify({ tables: tables.rows, policyCount: policies.rowCount, bucket: bucket.rows[0] || null, counts }, null, 2));
}

const action = process.argv[2];
if (!['backup', 'backup-rest', 'migrate', 'verify'].includes(action)) throw new Error('사용법: node scripts/supabase-db.mjs <backup|backup-rest|migrate|verify>');

if (action === 'backup-rest') {
  await backupRest();
} else {
  const client = new pg.Client(await databaseConfig());
  await client.connect();
  try {
    if (action === 'backup') await backup(client);
    if (action === 'migrate') await migrate(client);
    if (action === 'verify') await verify(client);
  } finally {
    await client.end();
  }
}
