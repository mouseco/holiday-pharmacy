'use client';
import FacilityCard from './FacilityCard';
import type { FacilityWithDistance } from '@/lib/filter';

type Props = { items: FacilityWithDistance[]; selectedId: string | null; onSelect: (id: string) => void; emptyMessage: string };

export default function FacilityList({ items, selectedId, onSelect, emptyMessage }: Props) {
  if (items.length === 0) return <p className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-600">{emptyMessage}</p>;
  return (
    <ul className="space-y-2">
      {items.map((f) => <FacilityCard key={f.id} f={f} selected={f.id === selectedId} onSelect={onSelect} />)}
    </ul>
  );
}
