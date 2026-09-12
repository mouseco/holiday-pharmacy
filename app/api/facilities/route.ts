import { NextResponse } from 'next/server';
import { fetchFacilitiesBySido } from '@/lib/fetchFacilities';
import { toApiSido } from '@/lib/sido';

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get('sido') ?? '';
  const sido = toApiSido(raw);
  if (!sido) return NextResponse.json({ error: '지원하지 않는 시도입니다' }, { status: 400 });

  try {
    const items = await fetchFacilitiesBySido(sido);
    return NextResponse.json(
      { sido, fetchedAt: new Date().toISOString(), items },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=21600' } },
    );
  } catch (e) {
    console.error('[facilities]', e);
    return NextResponse.json({ error: '진료기관 정보를 가져오지 못했습니다' }, { status: 502 });
  }
}
