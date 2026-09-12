import { describe, expect, it } from 'vitest';
import { filterAndSort, uniqueDates } from '@/lib/filter';
import type { Facility } from '@/lib/types';

const base = { addr: '', tel: '', divName: '' };
const list: Facility[] = [
  { ...base, id: 'far', name: '멀리', type: 'hospital', lat: 37.7, lng: 127.0, schedule: [{ date: '20260925', time: '' }] },
  { ...base, id: 'near-ph', name: '가까운약국', type: 'pharmacy', lat: 37.501, lng: 127.0, schedule: [{ date: '20260924', time: '' }] },
  { ...base, id: 'mid-ho', name: '중간의원', type: 'hospital', lat: 37.52, lng: 127.0, schedule: [{ date: '20260925', time: '' }, { date: '20260926', time: '' }] },
];
const origin = { lat: 37.5, lng: 127.0 };

describe('filterAndSort', () => {
  it('반경 밖 제외, 거리순 정렬, distanceKm 포함', () => {
    const r = filterAndSort(list, { origin, radiusKm: 5, type: 'all', date: 'all' });
    expect(r.map((f) => f.id)).toEqual(['near-ph', 'mid-ho']);
    expect(r[0].distanceKm).toBeCloseTo(0.11, 1);
  });
  it('구분 필터', () => {
    expect(filterAndSort(list, { origin, radiusKm: 50, type: 'pharmacy', date: 'all' }).map((f) => f.id)).toEqual(['near-ph']);
  });
  it('날짜 필터', () => {
    expect(filterAndSort(list, { origin, radiusKm: 50, type: 'all', date: '20260925' }).map((f) => f.id)).toEqual(['mid-ho', 'far']);
  });
});

it('uniqueDates는 정렬된 유니크 날짜', () => {
  expect(uniqueDates(list)).toEqual(['20260924', '20260925', '20260926']);
});
