export type KoreanHolidayCategory = 'national' | 'public';

export interface KoreanHoliday {
  date: string;
  name: string;
  categories: KoreanHolidayCategory[];
  isDayOff: boolean;
}

export interface KasiHolidayItem {
  locdate: string | number;
  dateName: string;
  isHoliday: string;
}
