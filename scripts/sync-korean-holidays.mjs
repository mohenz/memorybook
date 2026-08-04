import 'dotenv/config';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const envPath = path.join(projectRoot, '.env.local');
const envText = await readFile(envPath, 'utf8');
const serviceKey = envText.match(/^KASI_HOLIDAY_API_KEY=(.+)$/m)?.[1]?.trim();

if (!serviceKey) {
  throw new Error('KASI_HOLIDAY_API_KEY가 .env.local에 없습니다.');
}

const startYear = Number(process.env.KASI_HOLIDAY_START_YEAR || 2018);
const endYear = Number(process.env.KASI_HOLIDAY_END_YEAR || new Date().getFullYear() + 1);
const baseUrl = 'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService';
const nationalHolidayNames = new Set(['삼일절', '제헌절', '광복절', '개천절', '한글날']);

const decodeXml = (value) =>
  value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");

const readTag = (xml, tag) =>
  decodeXml(xml.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${tag}>`, 's'))?.[1] || '');

const parseItems = (xml) =>
  [...xml.matchAll(/<item>(.*?)<\/item>/gs)].map((match) => ({
    locdate: readTag(match[1], 'locdate'),
    dateName: readTag(match[1], 'dateName'),
    isHoliday: readTag(match[1], 'isHoliday'),
  }));

async function fetchItems(operation, year) {
  const url = new URL(`${baseUrl}/${operation}`);
  url.searchParams.set('serviceKey', serviceKey);
  url.searchParams.set('solYear', String(year));
  url.searchParams.set('numOfRows', '100');
  url.searchParams.set('pageNo', '1');

  const response = await fetch(url);
  if (!response.ok) throw new Error(`${operation} ${year} 조회 실패: HTTP ${response.status}`);

  const xml = await response.text();
  const resultCode = readTag(xml, 'resultCode');
  if (resultCode !== '00') {
    throw new Error(`${operation} ${year} 조회 실패: ${resultCode} ${readTag(xml, 'resultMsg')}`);
  }
  return parseItems(xml);
}

const merged = new Map();
const addItems = (items, category) => {
  items.forEach((item) => {
    const digits = String(item.locdate);
    const date = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
    const key = `${date}|${item.dateName}`;
    const existing = merged.get(key);

    if (existing) {
      if (!existing.categories.includes(category)) existing.categories.push(category);
      existing.isDayOff ||= item.isHoliday === 'Y';
    } else {
      merged.set(key, {
        date,
        name: item.dateName,
        categories: [category],
        isDayOff: item.isHoliday === 'Y',
      });
    }
  });
};

for (let year = startYear; year <= endYear; year += 1) {
  const [publicHolidays, nationalHolidays] = await Promise.all([
    fetchItems('getRestDeInfo', year),
    fetchItems('getHoliDeInfo', year),
  ]);
  addItems(publicHolidays, 'public');
  nationalHolidays.forEach((item) => {
    addItems([item], nationalHolidayNames.has(item.dateName) ? 'national' : 'public');
  });
}

const holidays = [...merged.values()].sort(
  (left, right) => left.date.localeCompare(right.date) || left.name.localeCompare(right.name),
);
const output = `import { KoreanHoliday } from './koreanHolidayTypes';\n\n// Generated from 한국천문연구원 특일 정보 API. Do not edit manually.\nexport const koreanHolidays: KoreanHoliday[] = ${JSON.stringify(holidays, null, 2)};\n`;

await writeFile(
  path.join(projectRoot, 'src/features/holidays/koreanHolidays.generated.ts'),
  output,
  'utf8',
);

console.log(`국경일·공휴일 ${holidays.length}건 동기화 완료 (${startYear}~${endYear})`);
