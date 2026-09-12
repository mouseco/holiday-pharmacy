'use client';
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

  return (
    <li
      id={`fac-${f.id}`}
      onClick={() => onSelect(f.id)}
      className={`relative cursor-pointer border-l-4 bg-surface py-4 pl-4 pr-4 transition-colors ${
        isPh ? 'border-l-pharmacy' : 'border-l-hospital'
      } ${selected ? 'bg-ground' : 'hover:bg-ground/60'}`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="min-w-0 text-[17px] font-semibold leading-snug">
          <span className={`mr-2 text-[13px] font-medium ${isPh ? 'text-pharmacy' : 'text-hospital'}`}>{f.divName || (isPh ? '약국' : '병의원')}</span>
          {f.name}
        </h3>
        <span className="shrink-0 text-lg font-semibold tabular-nums">{fmtKm(f.distanceKm)}</span>
      </div>
      <p className="mt-0.5 text-sm text-ink-soft">{f.addr}</p>

      {/* 연휴 스트립: 날짜별로 같은 칸에 진료시간 또는 휴진 */}
      <ul className="mt-3 grid gap-1" style={{ gridTemplateColumns: `repeat(${dates.length}, minmax(0, 1fr))` }}>
        {dates.map((d) => {
          const time = byDate.get(d);
          const isToday = d === today;
          return (
            <li
              key={d}
              className={`rounded-md px-1.5 py-1.5 text-center ${
                time ? (isPh ? 'bg-pharmacy-soft' : 'bg-hospital-soft') : 'bg-ground text-mute'
              } ${isToday ? 'ring-2 ring-ink' : ''}`}
            >
              <div className="text-[11px] leading-none">
                {fmtMonthDay(d)} {weekday(d)}{holidayLabel(d) ? ` ${holidayLabel(d)}` : ''}
              </div>
              <div className={`mt-1 text-[12px] font-semibold leading-tight tracking-tight tabular-nums sm:text-[13px] ${time ? '' : 'font-medium'}`}>
                {time ? fmtTime(time) : '휴진'}
              </div>
            </li>
          );
        })}
      </ul>

      {f.note && <p className="mt-2 text-[13px] text-mute">{f.note}</p>}

      <div className="mt-3 flex gap-2">
        {f.tel && (
          <a
            href={`tel:${f.tel}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm font-medium hover:bg-ground"
          >
            <PhoneIcon />전화 {f.tel}
          </a>
        )}
        <a
          href={naviUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm font-medium hover:bg-ground"
        >
          <PinIcon />길찾기
        </a>
      </div>
    </li>
  );
}

function PhoneIcon() {
  return (
    <svg aria-hidden className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 2h2.4l1.2 3-1.6 1a8 8 0 0 0 4.5 4.5l1-1.6 3 1.2v2.4a1.5 1.5 0 0 1-1.6 1.5A11.5 11.5 0 0 1 2 3.6 1.5 1.5 0 0 1 3.5 2Z" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg aria-hidden className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 14s4.5-4.2 4.5-7.5a4.5 4.5 0 0 0-9 0C3.5 9.8 8 14 8 14Z" /><circle cx="8" cy="6.5" r="1.5" />
    </svg>
  );
}
