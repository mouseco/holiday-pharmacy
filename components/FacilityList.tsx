'use client';
import FacilityCard from './FacilityCard';
import type { FacilityWithDistance } from '@/lib/filter';

type Props = {
  items: FacilityWithDistance[];
  dates: string[];
  today: string | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  empty: { title: string; hint?: string };
};

export default function FacilityList({ items, dates, today, selectedId, onSelect, empty }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line px-6 py-10 text-center">
        <p className="font-medium">{empty.title}</p>
        {empty.hint && <p className="mt-1 text-sm text-mute">{empty.hint}</p>}
      </div>
    );
  }
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
      {items.map((f) => (
        <FacilityCard key={f.id} f={f} dates={dates} today={today} selected={f.id === selectedId} onSelect={onSelect} />
      ))}
    </ul>
  );
}
