'use client';
import { CrossBadge, NavigateIcon, PhoneIcon } from './icons';
import { fmtMonthDay, fmtTime, holidayLabel, weekday } from '@/lib/dates';
import type { FacilityWithDistance } from '@/lib/filter';

type Props = {
  f: FacilityWithDistance;
  dates: string[];          // 연휴 전체 날짜 — 모든 카드가 같은 칸 구조를 갖도록
  today: string | null;     // 연휴 중이면 오늘(YYYYMMDD)
  selected: boolean;
  onSelect: (id: string) => void;
};

const fmtKm = (km: number) => (km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`);

export default function FacilityCard({ f, dates, today, selected, onSelect }: Props) {
  const isPh = f.type === 'pharmacy';
  const naviUrl = `https://map.kakao.com/link/to/${encodeURIComponent(f.name)},${f.lat},${f.lng}`;
  const byDate = new Map(f.schedule.map((s) => [s.date, s.time]));
  const action = 'inline-flex h-10 items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 text-sm font-medium transition-colors hover:bg-ground';

  return (
    <li
      id={`fac-${f.id}`}
      onClick={() => onSelect(f.id)}
      className={`cursor-pointer rounded-2xl border bg-surface p-4 transition-[border-color,box-shadow] ${
        selected ? 'border-ink shadow-[0_0_0_2px_var(--color-ink)]' : 'border-line hover:border-mute'
      }`}
    >
      <div className="flex items-start gap-3">
        <CrossBadge kind={f.type} className="mt-0.5 h-6 w-6 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="truncate text-[17px] font-semibold leading-snug">{f.name}</h3>
            <span className="shrink-0 text-[17px] font-semibold tabular-nums">{fmtKm(f.distanceKm)}</span>
          </div>
          <p className="mt-0.5 text-sm text-ink-soft">
            <span className={`mr-1.5 font-medium ${isPh ? 'text-pharmacy' : 'text-hospital'}`}>{f.divName || (isPh ? '약국' : '병의원')}</span>
            {f.addr}
          </p>
        </div>
      </div>

      {/* 연휴 스트립: 날짜별로 같은 칸에 진료시간 또는 휴진 */}
      <ul className="mt-3 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${dates.length}, minmax(0, 1fr))` }}>
        {dates.map((d) => {
          const time = byDate.get(d);
          const isToday = d === today;
          return (
            <li
              key={d}
              className={`rounded-lg px-1 py-2 text-center ${
                time ? (isPh ? 'bg-pharmacy-soft' : 'bg-hospital-soft') : 'bg-ground text-mute'
              } ${isToday ? 'outline outline-2 outline-ink' : ''}`}
            >
              <div className="text-[11px] leading-none">
                {fmtMonthDay(d)} {weekday(d)}{holidayLabel(d) ? ` ${holidayLabel(d)}` : ''}
              </div>
              <div className={`mt-1.5 text-[12.5px] leading-none tracking-tight tabular-nums sm:text-[13px] ${time ? 'font-semibold' : 'font-medium'}`}>
                {time ? fmtTime(time) : '휴진'}
              </div>
            </li>
          );
        })}
      </ul>

      {f.note && <p className="mt-2.5 text-[13px] leading-snug text-mute">{f.note}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {f.tel && (
          <a href={`tel:${f.tel}`} onClick={(e) => e.stopPropagation()} className={action}>
            <PhoneIcon />{f.tel}
          </a>
        )}
        <a href={naviUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className={action}>
          <NavigateIcon />길찾기
        </a>
      </div>
    </li>
  );
}
