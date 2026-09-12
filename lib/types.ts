export type FacilityType = 'hospital' | 'pharmacy';

export type Facility = {
  id: string;
  name: string;
  type: FacilityType;
  divName: string;
  addr: string;
  tel: string;
  lat: number;
  lng: number;
  /** 명절 진료 일자(YYYYMMDD)와 시간 문자열 쌍 */
  schedule: { date: string; time: string }[];
  note?: string;
};
