import { XMLParser } from 'fast-xml-parser';
import type { Facility } from './types';

type RawItem = Record<string, string | undefined>;

const parser = new XMLParser({ ignoreAttributes: true, parseTagValue: false, trimValues: true });

/** data.go.kr 명절 비상진료기관 API XML 응답을 Facility 배열로 변환 */
export function parseFacilitiesXml(xml: string): { items: Facility[]; totalCount: number } {
  const doc = parser.parse(xml);

  // 인증·트래픽 오류는 response 대신 OpenAPI_ServiceResponse 로 온다
  const svcErr = doc?.OpenAPI_ServiceResponse?.cmmMsgHeader;
  if (svcErr) {
    throw new Error(`data.go.kr 오류: ${svcErr.returnAuthMsg ?? svcErr.errMsg ?? 'unknown'}`);
  }

  const header = doc?.response?.header;
  const body = doc?.response?.body;
  if (!body || (header?.resultCode && header.resultCode !== '00')) {
    throw new Error(`API 응답 오류: ${header?.resultMsg ?? 'body 없음'}`);
  }

  const raw = body.items?.item;
  const list: RawItem[] = raw == null ? [] : Array.isArray(raw) ? raw : [raw];
  const items = list.map(toFacility).filter((f): f is Facility => f !== null);
  return { items, totalCount: Number(body.totalCount ?? 0) };
}

function toFacility(r: RawItem): Facility | null {
  const lat = Number(r.wgs84Lat);
  const lng = Number(r.wgs84Lon);
  if (!r.hpid || !r.wgs84Lat || !r.wgs84Lon || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const schedule: Facility['schedule'] = [];
  for (let i = 1; i <= 10; i++) {
    const date = r[`dutyDay${i}`];
    if (date) schedule.push({ date, time: r[`dutyDaytime${i}`] ?? '' });
  }

  const divName = r.dutyDivNam ?? '';
  return {
    id: r.hpid,
    name: r.dutyName ?? '',
    type: divName.includes('약국') ? 'pharmacy' : 'hospital',
    divName,
    addr: r.dutyAddr ?? '',
    tel: r.dutyTel1 ?? '',
    lat,
    lng,
    schedule,
    ...(r.dutyDayEtc ? { note: r.dutyDayEtc } : {}),
  };
}
