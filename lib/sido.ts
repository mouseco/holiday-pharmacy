import type { LatLng } from './geo';

/** API Q0 파라미터 표기. 카카오 Geocoder region_1depth_name 도 동일 표기를 쓴다. center는 시도청 좌표(수동 선택 시 지도 중심). */
export const SIDO_LIST: { name: string; center: LatLng }[] = [
  { name: '서울특별시', center: { lat: 37.5665, lng: 126.978 } },
  { name: '부산광역시', center: { lat: 35.1796, lng: 129.0756 } },
  { name: '대구광역시', center: { lat: 35.8714, lng: 128.6014 } },
  { name: '인천광역시', center: { lat: 37.4563, lng: 126.7052 } },
  { name: '광주광역시', center: { lat: 35.1595, lng: 126.8526 } },
  { name: '대전광역시', center: { lat: 36.3504, lng: 127.3845 } },
  { name: '울산광역시', center: { lat: 35.5384, lng: 129.3114 } },
  { name: '세종특별자치시', center: { lat: 36.48, lng: 127.289 } },
  { name: '경기도', center: { lat: 37.2636, lng: 127.0286 } },
  { name: '강원특별자치도', center: { lat: 37.8228, lng: 128.1555 } },
  { name: '충청북도', center: { lat: 36.6357, lng: 127.4913 } },
  { name: '충청남도', center: { lat: 36.6588, lng: 126.6728 } },
  { name: '전북특별자치도', center: { lat: 35.8203, lng: 127.1088 } },
  { name: '전라남도', center: { lat: 34.8161, lng: 126.4629 } },
  { name: '경상북도', center: { lat: 36.576, lng: 128.5056 } },
  { name: '경상남도', center: { lat: 35.2383, lng: 128.6924 } },
  { name: '제주특별자치도', center: { lat: 33.4996, lng: 126.5312 } },
];

/** 축약 표기·구 표기를 정식 표기로 */
const ALIASES: Record<string, string> = {
  서울: '서울특별시', 부산: '부산광역시', 대구: '대구광역시', 인천: '인천광역시',
  광주: '광주광역시', 대전: '대전광역시', 울산: '울산광역시', 세종: '세종특별자치시',
  세종시: '세종특별자치시', 경기: '경기도', 강원: '강원특별자치도', 강원도: '강원특별자치도',
  충북: '충청북도', 충남: '충청남도', 전북: '전북특별자치도', 전라북도: '전북특별자치도',
  전남: '전라남도', 경북: '경상북도', 경남: '경상남도', 제주: '제주특별자치도', 제주도: '제주특별자치도',
};

export function toApiSido(region1: string): string | null {
  const t = region1.trim();
  if (SIDO_LIST.some((s) => s.name === t)) return t;
  return ALIASES[t] ?? null;
}
