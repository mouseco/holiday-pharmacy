# 추석 연휴 문 여는 병원·약국 찾기 — 설계 스펙

작성일: 2026-09-12

## 목적

추석 연휴 기간 문을 여는 병·의원과 약국을 사용자의 현재 위치 기준으로 거리순 목록과 지도로 보여주는 단일 페이지 웹사이트. Vercel 무료 플랜으로 배포.

## 데이터 소스

- 주 소스: 국립중앙의료원 「전국 명절 비상 진료기관 정보 조회 서비스」(공공데이터포털 15000480)
  - Endpoint: `https://apis.data.go.kr/B552657/HolidyEmgncClnicInsttInfoInqireService/getHolidyClnicPosblEgytInfoInqire`
  - 요청: `serviceKey`, `Q0`(시도), `Q1`(시군구), `QD`(진료과목), `QT`(명절일자), `pageNo`, `numOfRows`
  - 응답(XML): `hpid`, `dutyName`, `dutyAddr`, `dutyTel1`, `dutyDiv`, `dutyDivNam`, `dutyDay1~10`, `dutyDaytime1~10`, `dutyDayEtc`, `wgs84Lat`, `wgs84Lon`, `totalCount`
  - 제한: 개발계정 1,000건/일
- 서비스키는 서버 환경변수 `DATA_GO_KR_KEY`에만 존재. 클라이언트 노출 금지.

## 스택

- Next.js 15 (App Router, TypeScript), Tailwind CSS
- `react-kakao-maps-sdk` — 카카오맵 SDK 로딩·지도·마커
- `fast-xml-parser` — XML 응답 파싱
- Vitest — 순수 로직 유닛 테스트

## 아키텍처

```
브라우저
  ├─ geolocation → 좌표
  ├─ 카카오 Geocoder coord2RegionCode → 시도명
  ├─ GET /api/facilities?sido=<시도>  ─────────┐
  ├─ haversine 거리 계산, 필터, 정렬            │
  └─ 지도(카카오맵) + 목록 렌더                 │
                                               ▼
Next.js Route Handler (/app/api/facilities/route.ts)
  ├─ 시도명 매핑(카카오 표기 → API 표기)
  ├─ data.go.kr API 페이지 순회 (numOfRows=1000, totalCount 소진까지)
  ├─ fetch next.revalidate = 21600 (6h)
  └─ XML → 정규화 JSON 반환
```

### 정규화 스키마

```ts
type Facility = {
  id: string;                 // hpid
  name: string;               // dutyName
  type: 'hospital' | 'pharmacy'; // dutyDivNam이 '약국'이면 pharmacy, 그 외 hospital
  divName: string;            // dutyDivNam 원문 (의원/병원/약국/보건소 등)
  addr: string;
  tel: string;
  lat: number;
  lng: number;
  schedule: { date: string; time: string }[]; // dutyDayN/dutyDaytimeN 쌍, 빈 값 제외
  note?: string;              // dutyDayEtc
};
```

### 컴포넌트 구성

- `app/page.tsx` — 페이지 셸, 상태 보유(좌표, 시도, 필터, 데이터)
- `components/LocationBar` — 내 위치 버튼, 시도 select
- `components/FilterBar` — 구분/날짜/반경
- `components/FacilityMap` — 카카오맵, 내 위치 마커, 기관 마커
- `components/FacilityList` / `FacilityCard`
- `lib/parse.ts` — XML → Facility[]
- `lib/geo.ts` — haversine, 시도 청사 좌표
- `lib/filter.ts` — 필터·정렬
- `lib/sido.ts` — 시도명 매핑

## UI

- 모바일 우선 단일 페이지.
- 상단: 제목, 데이터 기준 시각, "내 위치로 찾기" 버튼, 시도 select(수동 대체).
- 필터: 구분(전체/병의원/약국), 날짜(응답에서 유니크 날짜 추출, 기본 전체), 반경(1/3/5/10km, 기본 3km).
- 지도: 내 위치 마커 + 기관 마커(병의원/약국 색 구분). 마커 클릭 시 목록 카드 강조·스크롤.
- 목록 카드: 이름, 구분 뱃지, 거리, 주소, 날짜별 진료시간, `tel:` 링크, 카카오맵 길찾기 링크 `https://map.kakao.com/link/to/{name},{lat},{lng}`.
- 하단: 출처 및 "방문 전 전화 확인 권장" 안내.

## 에러/빈 상태

- 위치 권한 거부 → 시도 select 안내, 지도 중심은 시도 청사 좌표.
- API 실패 → 에러 배너 + 재시도.
- 응답 0건 → "해당 지역 명절 진료 정보 미등록. E-Gen 확인" 안내.
- 반경 내 0건 → "반경을 넓혀보세요".

## 테스트

- `lib/parse.ts`: 샘플 XML → Facility[] (dutyDay 쌍 접기, 좌표 숫자화, 약국 구분)
- `lib/geo.ts`: haversine 알려진 값
- `lib/filter.ts`: 구분/날짜/반경 필터, 거리순 정렬
- `lib/sido.ts`: 매핑
- Route Handler: `fetch` mock으로 페이지 순회
- UI: 로컬 실행 후 브라우저 수동 확인

## 배포

- 환경변수: `DATA_GO_KR_KEY`(서버), `NEXT_PUBLIC_KAKAO_JS_KEY`(클라이언트)
- Vercel CLI(설치됨 v51)로 배포. 배포 후 카카오 디벨로퍼스 Web 플랫폼에 Vercel 도메인 등록(사용자 작업).

## 미확정 사항 (구현 중 실제 호출로 확정)

- `Q0` 시도명 표기(`강원특별자치도` vs `강원도` 등)
- `QT` 생략 시 전체 반환 여부. 안 되면 연휴 일자별 호출 후 병합.
- 2026 추석 데이터 등록 시점.
