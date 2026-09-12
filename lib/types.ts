export type FacilityType = 'hospital' | 'pharmacy';

/** 명절 API 응답 항목(좌표 없음) */
export type HolidayItem = {
  id: string;
  name: string;
  type: FacilityType;
  divName: string;
  addr: string;
  tel: string;
  /** 명절 진료 일자(YYYYMMDD)와 시간 문자열 쌍 */
  schedule: { date: string; time: string }[];
  note?: string;
};

/** 좌표 인덱스와 조인된 최종 항목 */
export type Facility = HolidayItem & { lat: number; lng: number };

/** hpid → [lat, lng] */
export type CoordsIndex = Record<string, [number, number]>;
