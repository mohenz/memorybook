import {
  KasiHolidayItem,
  KoreanHoliday,
  KoreanHolidayCategory,
} from './koreanHolidayTypes';

export const NATIONAL_HOLIDAY_NAMES = new Set([
  '삼일절',
  '제헌절',
  '광복절',
  '개천절',
  '한글날',
]);

const formatKasiDate = (value: string | number) => {
  const digits = String(value);
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
};

export function mergeKasiHolidays(
  publicHolidays: KasiHolidayItem[],
  nationalHolidays: KasiHolidayItem[],
) {
  const merged = new Map<string, KoreanHoliday>();

  const addItems = (items: KasiHolidayItem[], category: KoreanHolidayCategory) => {
    items.forEach((item) => {
      const date = formatKasiDate(item.locdate);
      const key = `${date}|${item.dateName}`;
      const existing = merged.get(key);

      if (existing) {
        if (!existing.categories.includes(category)) existing.categories.push(category);
        existing.isDayOff ||= item.isHoliday === 'Y';
        return;
      }

      merged.set(key, {
        date,
        name: item.dateName,
        categories: [category],
        isDayOff: item.isHoliday === 'Y',
      });
    });
  };

  addItems(publicHolidays, 'public');
  nationalHolidays.forEach((item) => {
    addItems(
      [item],
      NATIONAL_HOLIDAY_NAMES.has(item.dateName) ? 'national' : 'public',
    );
  });

  return [...merged.values()].sort((left, right) =>
    left.date.localeCompare(right.date) || left.name.localeCompare(right.name),
  );
}

export function groupKoreanHolidays(holidays: KoreanHoliday[]) {
  const holidaysByDate = new Map<string, KoreanHoliday[]>();

  holidays.forEach((holiday) => {
    const dayHolidays = holidaysByDate.get(holiday.date) || [];
    holidaysByDate.set(holiday.date, [...dayHolidays, holiday]);
  });

  return holidaysByDate;
}

export const getHolidayNames = (holidays: KoreanHoliday[]) =>
  holidays.map((holiday) => holiday.name).join(', ');
