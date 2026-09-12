import { distanceKm, type LatLng } from './geo';
import type { Facility } from './types';

export type TypeFilter = 'all' | 'hospital' | 'pharmacy';
export type FacilityWithDistance = Facility & { distanceKm: number };

export function filterAndSort(
  list: Facility[],
  opt: { origin: LatLng; radiusKm: number; type: TypeFilter; date: string | 'all' },
): FacilityWithDistance[] {
  return list
    .filter((f) => opt.type === 'all' || f.type === opt.type)
    .filter((f) => opt.date === 'all' || f.schedule.some((s) => s.date === opt.date))
    .map((f) => ({ ...f, distanceKm: distanceKm(opt.origin, f) }))
    .filter((f) => f.distanceKm <= opt.radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function uniqueDates(list: Facility[]): string[] {
  return [...new Set(list.flatMap((f) => f.schedule.map((s) => s.date)))].sort();
}
