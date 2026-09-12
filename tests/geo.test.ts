import { expect, it } from 'vitest';
import { distanceKm } from '@/lib/geo';

it('서울시청–부산시청 거리는 약 325km', () => {
  const d = distanceKm({ lat: 37.5665, lng: 126.978 }, { lat: 35.1796, lng: 129.0756 });
  expect(d).toBeGreaterThan(320);
  expect(d).toBeLessThan(330);
});
it('같은 점은 0', () => {
  expect(distanceKm({ lat: 37, lng: 127 }, { lat: 37, lng: 127 })).toBe(0);
});
