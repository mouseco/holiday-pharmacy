import { describe, expect, it, vi } from 'vitest';
import { fetchHolidayItemsBySido } from '@/lib/fetchFacilities';

const item = (id: string) =>
  `<item><hpid>${id}</hpid><dutyName>${id}</dutyName><dutyDivName>의원</dutyDivName></item>`;
const page = (ids: string[], total: number) =>
  `<response><header><resultCode>00</resultCode></header><body><items>${ids.map(item).join('')}</items><totalCount>${total}</totalCount></body></response>`;

describe('fetchHolidayItemsBySido', () => {
  it('totalCount 소진까지 pageNo를 올리며 호출하고 병합한다', async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      const u = new URL(String(url));
      const p = u.searchParams.get('pageNo');
      expect(u.searchParams.get('Q0')).toBe('서울특별시');
      expect(u.searchParams.get('serviceKey')).toBe('KEY');
      const body = p === '1' ? page(['a', 'b'], 3) : page(['c'], 3);
      return new Response(body, { status: 200 });
    });
    const items = await fetchHolidayItemsBySido('서울특별시', { fetchImpl: fetchImpl as unknown as typeof fetch, serviceKey: 'KEY', pageSize: 2 });
    expect(items.map((f) => f.id)).toEqual(['a', 'b', 'c']);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
  it('HTTP 오류면 throw', async () => {
    const fetchImpl = vi.fn(async () => new Response('x', { status: 500 }));
    await expect(fetchHolidayItemsBySido('서울특별시', { fetchImpl: fetchImpl as unknown as typeof fetch, serviceKey: 'KEY' })).rejects.toThrow(/500/);
  });
});
