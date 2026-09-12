import { NextResponse } from 'next/server';
import coords from '@/data/coords.json';
import { fetchHolidayItemsBySido } from '@/lib/fetchFacilities';
import { attachCoords } from '@/lib/parse';
import { toApiSido } from '@/lib/sido';
import type { CoordsIndex } from '@/lib/types';

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get('sido') ?? '';
  const sido = toApiSido(raw);
  if (!sido) return NextResponse.json({ error: '지원하지 않는 시도입니다' }, { status: 400 });

  try {
    const items = await fetchHolidayItemsBySido(sido);
    const { facilities, missing } = attachCoords(items, coords as unknown as CoordsIndex);
    return NextResponse.json(
      { sido, fetchedAt: new Date().toISOString(), items: facilities, missingCoords: missing },
      {
        headers: {
          // 브라우저는 매번 재검증, Vercel CDN만 1시간 캐시 (upstream 캐시는 fetch revalidate 6h)
          'Cache-Control': 'public, max-age=0, must-revalidate',
          'CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=21600',
        },
      },
    );
  } catch (e) {
    console.error('[facilities]', e);
    return NextResponse.json({ error: '진료기관 정보를 가져오지 못했습니다' }, { status: 502 });
  }
}
