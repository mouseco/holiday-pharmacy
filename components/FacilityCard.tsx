'use client';
import type { FacilityWithDistance } from '@/lib/filter';

type Props = { f: FacilityWithDistance; selected: boolean; onSelect: (id: string) => void };

const fmtDate = (d: string) => `${Number(d.slice(4, 6))}/${Number(d.slice(6, 8))}`;
const fmtKm = (km: number) => (km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`);

export default function FacilityCard({ f, selected, onSelect }: Props) {
  const badge = f.type === 'pharmacy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  const naviUrl = `https://map.kakao.com/link/to/${encodeURIComponent(f.name)},${f.lat},${f.lng}`;
  return (
    <li
      id={`fac-${f.id}`}
      onClick={() => onSelect(f.id)}
      className={`cursor-pointer rounded-lg border bg-white p-3 ${selected ? 'border-blue-500 ring-2 ring-blue-200' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className={`mr-2 rounded px-1.5 py-0.5 text-xs ${badge}`}>{f.divName || (f.type === 'pharmacy' ? '약국' : '병의원')}</span>
          <span className="font-semibold">{f.name}</span>
        </div>
        <span className="shrink-0 text-sm text-gray-600">{fmtKm(f.distanceKm)}</span>
      </div>
      <p className="mt-1 text-sm text-gray-700">{f.addr}</p>
      <ul className="mt-1 text-sm">
        {f.schedule.map((s) => (
          <li key={s.date}><span className="text-gray-500">{fmtDate(s.date)}</span> {s.time || '시간 미기재'}</li>
        ))}
      </ul>
      {f.note && <p className="mt-1 text-xs text-gray-500">{f.note}</p>}
      <div className="mt-2 flex gap-3 text-sm">
        {f.tel && <a href={`tel:${f.tel}`} className="text-blue-600 underline" onClick={(e) => e.stopPropagation()}>📞 {f.tel}</a>}
        <a href={naviUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline" onClick={(e) => e.stopPropagation()}>길찾기</a>
      </div>
    </li>
  );
}
