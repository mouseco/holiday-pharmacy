import { parseHolidayXml } from './parse';
import type { HolidayItem } from './types';

const ENDPOINT =
  'https://apis.data.go.kr/B552657/HolidyEmgncClnicInsttInfoInqireService/getHolidyClnicPosblEgytInfoInqire';
export const REVALIDATE_SECONDS = 21600; // 6시간

type Opt = { fetchImpl?: typeof fetch; serviceKey?: string; pageSize?: number };

/** 시도 단위로 전체 페이지를 순회해 명절 진료기관 목록을 만든다 (서버 전용, 좌표 없음) */
export async function fetchHolidayItemsBySido(sido: string, opt: Opt = {}): Promise<HolidayItem[]> {
  const fetchImpl = opt.fetchImpl ?? fetch;
  const serviceKey = opt.serviceKey ?? process.env.DATA_GO_KR_KEY;
  const pageSize = opt.pageSize ?? 5000; // 실제 API가 5000까지 허용
  if (!serviceKey) throw new Error('DATA_GO_KR_KEY 환경변수가 없습니다');

  const all: HolidayItem[] = [];
  for (let pageNo = 1; pageNo <= 50; pageNo++) {
    const url = new URL(ENDPOINT);
    url.searchParams.set('serviceKey', serviceKey);
    url.searchParams.set('Q0', sido);
    url.searchParams.set('pageNo', String(pageNo));
    url.searchParams.set('numOfRows', String(pageSize));

    const res = await fetchImpl(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) throw new Error(`upstream HTTP ${res.status}`);
    const { items, totalCount } = parseHolidayXml(await res.text());
    all.push(...items);
    if (items.length === 0 || pageNo * pageSize >= totalCount) break;
  }
  return all;
}
