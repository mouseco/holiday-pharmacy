'use client';
import type { TypeFilter } from '@/lib/filter';

type Props = {
  type: TypeFilter; onType: (t: TypeFilter) => void;
  date: string; dates: string[]; onDate: (d: string) => void;
  radius: number; onRadius: (r: number) => void;
};

const fmtDate = (d: string) => `${Number(d.slice(4, 6))}/${Number(d.slice(6, 8))}`;

export default function FilterBar({ type, onType, date, dates, onDate, radius, onRadius }: Props) {
  const sel = 'rounded-md border bg-white px-3 py-2 text-sm';
  return (
    <div className="flex flex-wrap gap-2">
      <select value={type} onChange={(e) => onType(e.target.value as TypeFilter)} className={sel} aria-label="구분">
        <option value="all">병의원+약국</option>
        <option value="hospital">병의원</option>
        <option value="pharmacy">약국</option>
      </select>
      <select value={date} onChange={(e) => onDate(e.target.value)} className={sel} aria-label="날짜">
        <option value="all">모든 날짜</option>
        {dates.map((d) => <option key={d} value={d}>{fmtDate(d)}</option>)}
      </select>
      <select value={radius} onChange={(e) => onRadius(Number(e.target.value))} className={sel} aria-label="반경">
        {[1, 3, 5, 10].map((r) => <option key={r} value={r}>{r}km 이내</option>)}
      </select>
    </div>
  );
}
