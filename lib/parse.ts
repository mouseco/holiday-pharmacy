import { XMLParser } from 'fast-xml-parser';
import type { CoordsIndex, Facility, HolidayItem } from './types';

type RawItem = Record<string, string | undefined>;

const parser = new XMLParser({ ignoreAttributes: true, parseTagValue: false, trimValues: true });

/** data.go.kr 공통 응답 래퍼를 검사하고 item 배열을 꺼낸다 */
export function extractItems(xml: string): { raw: RawItem[]; totalCount: number } {
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

  const item = body.items?.item;
  const raw: RawItem[] = item == null ? [] : Array.isArray(item) ? item : [item];
  return { raw, totalCount: Number(body.totalCount ?? 0) };
}

/** 명절 비상진료기관 API XML → HolidayItem[] (좌표 없음) */
export function parseHolidayXml(xml: string): { items: HolidayItem[]; totalCount: number } {
  const { raw, totalCount } = extractItems(xml);
  const items = raw.map(toHolidayItem).filter((f): f is HolidayItem => f !== null);
  return { items, totalCount };
}

function toHolidayItem(r: RawItem): HolidayItem | null {
  if (!r.hpid) return null;

  // 모든 기관이 연휴 날짜 전체를 나열하고, 실제 진료하는 날에만 dutyDaytimeN 이 채워진다
  const schedule: HolidayItem['schedule'] = [];
  for (let i = 1; i <= 10; i++) {
    const date = r[`dutyDay${i}`];
    const time = r[`dutyDaytime${i}`];
    if (date && time) schedule.push({ date: date.replace(/-/g, ''), time });
  }

  // 문서는 dutyDivNam/dutyDayEtc 이지만 실제 응답은 dutyDivName/dutyDayetc
  const divName = r.dutyDivName ?? r.dutyDivNam ?? '';
  const note = r.dutyDayetc ?? r.dutyDayEtc;
  return {
    id: r.hpid,
    name: r.dutyName ?? '',
    type: divName.includes('약국') ? 'pharmacy' : 'hospital',
    divName,
    addr: r.dutyAddr ?? '',
    tel: r.dutyTel1 ?? '',
    schedule,
    ...(note ? { note } : {}),
  };
}

/** 좌표 인덱스와 조인. 인덱스에 없는 항목은 제외하고 개수만 반환 */
export function attachCoords(items: HolidayItem[], index: CoordsIndex): { facilities: Facility[]; missing: number } {
  const facilities: Facility[] = [];
  let missing = 0;
  for (const it of items) {
    const c = index[it.id];
    if (c) facilities.push({ ...it, lat: c[0], lng: c[1] });
    else missing++;
  }
  return { facilities, missing };
}
