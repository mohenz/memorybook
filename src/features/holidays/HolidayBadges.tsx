import { KoreanHoliday } from './koreanHolidayTypes';

interface HolidayBadgesProps {
  holidays: KoreanHoliday[];
  compact?: boolean;
}

export default function HolidayBadges({ holidays, compact = false }: HolidayBadgesProps) {
  if (holidays.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${compact ? 'mt-1' : 'mt-2'}`} aria-label="대한민국 국경일 및 공휴일">
      {holidays.map((holiday) => (
        <span
          key={`${holiday.date}-${holiday.name}`}
          className={`rounded-full font-bold ${
            compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2.5 py-1 text-xs'
          } ${
            holiday.isDayOff
              ? 'bg-red-50 text-error border border-red-100'
              : 'bg-primary/10 text-primary border border-primary/20'
          }`}
          title={holiday.categories.includes('national') ? '국경일' : '공휴일'}
        >
          {holiday.name}
        </span>
      ))}
    </div>
  );
}
