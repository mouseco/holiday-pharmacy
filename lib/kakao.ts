/* 카카오맵 SDK 최소 타입과 로드 헬퍼 (클라이언트 전용) */
/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window { kakao: any }
}

let ready: Promise<any> | null = null;

/** autoload=false 로 삽입한 SDK의 초기화가 끝날 때까지 대기 */
export function loadKakao(): Promise<any> {
  if (ready) return ready;
  ready = new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (window.kakao?.maps?.load) {
        window.kakao.maps.load(() => resolve(window.kakao));
      } else if (Date.now() - start > 10000) {
        reject(new Error('카카오맵 SDK를 불러오지 못했습니다'));
      } else {
        setTimeout(tick, 50);
      }
    };
    tick();
  });
  return ready;
}

/** 좌표 → 시도명(region_1depth_name). 실패 시 null */
export async function coordToSido(lat: number, lng: number): Promise<string | null> {
  const kakao = await loadKakao();
  return new Promise((resolve) => {
    new kakao.maps.services.Geocoder().coord2RegionCode(lng, lat, (result: any[], status: string) => {
      if (status !== kakao.maps.services.Status.OK || !result?.length) return resolve(null);
      const r = result.find((x) => x.region_type === 'B') ?? result[0];
      resolve(r.region_1depth_name ?? null);
    });
  });
}
