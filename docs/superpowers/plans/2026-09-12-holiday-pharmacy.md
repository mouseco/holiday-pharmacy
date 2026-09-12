# 추석 연휴 병원·약국 찾기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 명절 비상진료기관 공공 API를 서버에서 프록시·캐시하고, 브라우저에서 현재 위치 기준 거리순 목록과 카카오맵으로 보여주는 Next.js 단일 페이지 앱을 Vercel에 배포한다.

**Architecture:** Route Handler `/api/facilities?sido=`가 data.go.kr XML을 6시간 캐시로 페이지 순회해 정규화 JSON을 반환한다. 클라이언트는 geolocation → 카카오 Geocoder로 시도명을 얻어 API를 호출하고, haversine 거리로 필터·정렬해 목록과 지도를 그린다. 카카오맵 SDK는 `next/script`로 직접 로드한다(추가 래퍼 라이브러리 없음).

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS, fast-xml-parser, Vitest, Kakao Maps JS SDK, Vercel CLI

**Spec:** `docs/superpowers/specs/2026-09-12-holiday-pharmacy-design.md`

## Global Constraints

- 서비스키 `DATA_GO_KR_KEY`는 서버 전용. 클라이언트 번들·응답에 절대 포함하지 않는다.
- 카카오 키는 `NEXT_PUBLIC_KAKAO_JS_KEY`.
- API 호출은 시도 단위, `numOfRows=1000`, `next.revalidate=21600`.
- 주석·UI 문구는 한글. 기술 용어는 영문.
- 신규 파일은 UTF-8(BOM 없음), LF.
- 커밋 메시지는 한글 conventional commit, 말미에 Co-Authored-By / Claude-Session 라인 포함.

---

## File Structure

```
holiday-pharmacy/
├─ app/
│  ├─ layout.tsx            # 메타데이터, 카카오 SDK <Script>
│  ├─ page.tsx              # 상태 보유·데이터 로딩·조합 (client)
│  ├─ globals.css
│  └─ api/facilities/route.ts   # GET ?sido= → Facility[]
├─ components/
│  ├─ LocationBar.tsx       # 내 위치 버튼 + 시도 select
│  ├─ FilterBar.tsx         # 구분/날짜/반경
│  ├─ FacilityMap.tsx       # 카카오맵 + 마커
│  ├─ FacilityList.tsx      # 카드 목록
│  └─ FacilityCard.tsx
├─ lib/
│  ├─ types.ts              # Facility, FacilityType
│  ├─ parse.ts              # XML → Facility[]
│  ├─ geo.ts                # haversine, SIDO_CENTERS
│  ├─ sido.ts               # 카카오 시도명 → API Q0 매핑, SIDO_LIST
│  ├─ filter.ts             # 필터·정렬
│  ├─ fetchFacilities.ts    # 페이지 순회 fetch (서버)
│  └─ kakao.ts              # window.kakao 타입 선언 + 로드 대기 헬퍼
├─ tests/                   # vitest
├─ .env.example
└─ vitest.config.ts
```

---

### Task 1: 프로젝트 스캐폴딩

**Files:**
- Create: Next.js 앱 전체 (create-next-app), `vitest.config.ts`, `.env.example`, `tests/smoke.test.ts`
- Modify: `package.json` (scripts.test)

**Interfaces:**
- Produces: `npm test` 가 vitest를 실행. `npm run dev`/`build` 동작.

- [ ] **Step 1: create-next-app 실행**

```bash
cd /c/Users/mouse/projects/holiday-pharmacy
npx --yes create-next-app@latest . --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --yes
```
(기존 `docs/`, `.git` 이 있어도 진행됨. "directory not empty" 거부 시 임시 폴더에 생성 후 파일을 옮긴다.)

- [ ] **Step 2: 의존성 설치**

```bash
npm i fast-xml-parser
npm i -D vitest
```

- [ ] **Step 3: vitest 설정과 스모크 테스트**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: { include: ['tests/**/*.test.ts'] },
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
});
```

`tests/smoke.test.ts`:
```ts
import { expect, test } from 'vitest';
test('vitest 동작', () => { expect(1 + 1).toBe(2); });
```

`package.json` scripts에 추가: `"test": "vitest run"`

- [ ] **Step 4: `.env.example` 작성**

```
DATA_GO_KR_KEY=공공데이터포털_일반인증키(Decoding)
NEXT_PUBLIC_KAKAO_JS_KEY=카카오_JavaScript_키
```
`.gitignore`에 `.env*` 가 이미 있는지 확인(create-next-app 기본 포함).

- [ ] **Step 5: 실행 확인**

Run: `npm test` → 1 passed. Run: `npm run build` → 성공.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: Next.js 프로젝트 스캐폴딩 및 vitest 설정"
```

---

### Task 2: 타입과 XML 파서

**Files:**
- Create: `lib/types.ts`, `lib/parse.ts`
- Test: `tests/parse.test.ts`

**Interfaces:**
- Produces:
  ```ts
  type FacilityType = 'hospital' | 'pharmacy';
  type Facility = { id; name; type; divName; addr; tel; lat; lng; schedule: {date; time}[]; note? };
  function parseFacilitiesXml(xml: string): { items: Facility[]; totalCount: number }
  ```
  data.go.kr 오류 응답(`OpenAPI_ServiceResponse`)이나 `resultCode !== '00'`이면 `Error` throw.

- [ ] **Step 1: 실패하는 테스트 작성** — `tests/parse.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { parseFacilitiesXml } from '@/lib/parse';

const ok = `<?xml version="1.0" encoding="UTF-8"?>
<response><header><resultCode>00</resultCode><resultMsg>NORMAL SERVICE.</resultMsg></header>
<body><items>
<item><hpid>A1</hpid><dutyName>서울의원</dutyName><dutyAddr>서울특별시 종로구 1</dutyAddr><dutyTel1>02-111-1111</dutyTel1>
<dutyDiv>C</dutyDiv><dutyDivNam>의원</dutyDivNam><wgs84Lat>37.5</wgs84Lat><wgs84Lon>127.0</wgs84Lon>
<dutyDay1>20260924</dutyDay1><dutyDaytime1>09:00~13:00</dutyDaytime1><dutyDay2>20260925</dutyDay2><dutyDaytime2>09:00~18:00</dutyDaytime2>
<dutyDay3></dutyDay3><dutyDayEtc>점심 12~13시 휴진</dutyDayEtc></item>
<item><hpid>P1</hpid><dutyName>종로약국</dutyName><dutyAddr>서울특별시 종로구 2</dutyAddr><dutyTel1>02-222-2222</dutyTel1>
<dutyDiv>E</dutyDiv><dutyDivNam>약국</dutyDivNam><wgs84Lat>37.51</wgs84Lat><wgs84Lon>127.01</wgs84Lon>
<dutyDay1>20260925</dutyDay1><dutyDaytime1>10:00~17:00</dutyDaytime1></item>
<item><hpid>X1</hpid><dutyName>좌표없음</dutyName><dutyDivNam>의원</dutyDivNam></item>
</items><numOfRows>1000</numOfRows><pageNo>1</pageNo><totalCount>2</totalCount></body></response>`;

const single = `<response><header><resultCode>00</resultCode></header><body><items>
<item><hpid>S1</hpid><dutyName>단일</dutyName><dutyDivNam>병원</dutyDivNam><wgs84Lat>35</wgs84Lat><wgs84Lon>129</wgs84Lon></item>
</items><totalCount>1</totalCount></body></response>`;

const empty = `<response><header><resultCode>00</resultCode></header><body><items/><totalCount>0</totalCount></body></response>`;

const keyError = `<OpenAPI_ServiceResponse><cmmMsgHeader><errMsg>SERVICE ERROR</errMsg>
<returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg><returnReasonCode>30</returnReasonCode></cmmMsgHeader></OpenAPI_ServiceResponse>`;

describe('parseFacilitiesXml', () => {
  it('item 목록을 Facility로 변환하고 좌표 없는 항목은 제외한다', () => {
    const { items, totalCount } = parseFacilitiesXml(ok);
    expect(totalCount).toBe(2);
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      id: 'A1', name: '서울의원', type: 'hospital', divName: '의원',
      addr: '서울특별시 종로구 1', tel: '02-111-1111', lat: 37.5, lng: 127.0,
      schedule: [{ date: '20260924', time: '09:00~13:00' }, { date: '20260925', time: '09:00~18:00' }],
      note: '점심 12~13시 휴진',
    });
    expect(items[1].type).toBe('pharmacy');
    expect(items[1].note).toBeUndefined();
  });
  it('item이 하나여도 배열로 처리한다', () => {
    expect(parseFacilitiesXml(single).items).toHaveLength(1);
  });
  it('빈 items는 빈 배열', () => {
    expect(parseFacilitiesXml(empty)).toEqual({ items: [], totalCount: 0 });
  });
  it('인증 오류 응답이면 throw', () => {
    expect(() => parseFacilitiesXml(keyError)).toThrow(/SERVICE_KEY_IS_NOT_REGISTERED_ERROR/);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/parse.test.ts` → FAIL (모듈 없음)

- [ ] **Step 3: 구현**

`lib/types.ts`:
```ts
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
```

`lib/parse.ts`:
```ts
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
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run tests/parse.test.ts` → 4 passed

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts lib/parse.ts tests/parse.test.ts
git commit -m "feat: 명절 진료기관 XML 파서 및 Facility 타입"
```

---

### Task 3: 거리 계산과 시도 매핑

**Files:**
- Create: `lib/geo.ts`, `lib/sido.ts`
- Test: `tests/geo.test.ts`, `tests/sido.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // geo.ts
  type LatLng = { lat: number; lng: number };
  function distanceKm(a: LatLng, b: LatLng): number
  // sido.ts
  const SIDO_LIST: { name: string; center: LatLng }[]   // API Q0 표기 기준 17개
  function toApiSido(kakaoRegion1: string): string | null // 카카오 region_1depth_name → Q0
  ```

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/geo.test.ts`:
```ts
import { expect, it } from 'vitest';
import { distanceKm } from '@/lib/geo';

it('서울시청–부산시청 거리는 약 325km', () => {
  const d = distanceKm({ lat: 37.5665, lng: 126.978 }, { lat: 35.1796, lng: 129.0756 });
  expect(d).toBeGreaterThan(320);
  expect(d).toBeLessThan(330);
});
it('같은 점은 0', () => {
  expect(distanceKm({ lat: 37, lng: 127 }, { lat: 37, lng: 127 })).toBe(0);
});
```

`tests/sido.test.ts`:
```ts
import { expect, it } from 'vitest';
import { SIDO_LIST, toApiSido } from '@/lib/sido';

it('17개 시도', () => { expect(SIDO_LIST).toHaveLength(17); });
it('카카오 표기를 API 표기로 매핑', () => {
  expect(toApiSido('서울특별시')).toBe('서울특별시');
  expect(toApiSido('강원특별자치도')).toBe('강원특별자치도');
  expect(toApiSido('전북특별자치도')).toBe('전북특별자치도');
  expect(toApiSido('서울')).toBe('서울특별시');
  expect(toApiSido('알수없음')).toBeNull();
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/geo.test.ts tests/sido.test.ts` → FAIL

- [ ] **Step 3: 구현**

`lib/geo.ts`:
```ts
export type LatLng = { lat: number; lng: number };

const R = 6371; // km

/** haversine 대권 거리(km) */
export function distanceKm(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
```

`lib/sido.ts`:
```ts
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
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run tests/geo.test.ts tests/sido.test.ts` → passed

- [ ] **Step 5: Commit**

```bash
git add lib/geo.ts lib/sido.ts tests/geo.test.ts tests/sido.test.ts
git commit -m "feat: haversine 거리 계산 및 시도명 매핑"
```

---

### Task 4: 필터·정렬

**Files:**
- Create: `lib/filter.ts`
- Test: `tests/filter.test.ts`

**Interfaces:**
- Consumes: `Facility`, `distanceKm`, `LatLng`
- Produces:
  ```ts
  type TypeFilter = 'all' | 'hospital' | 'pharmacy';
  type FacilityWithDistance = Facility & { distanceKm: number };
  function filterAndSort(list: Facility[], opt: { origin: LatLng; radiusKm: number; type: TypeFilter; date: string | 'all' }): FacilityWithDistance[]
  function uniqueDates(list: Facility[]): string[]   // 오름차순
  ```

- [ ] **Step 1: 실패하는 테스트 작성** — `tests/filter.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { filterAndSort, uniqueDates } from '@/lib/filter';
import type { Facility } from '@/lib/types';

const base = { addr: '', tel: '', divName: '', note: undefined };
const list: Facility[] = [
  { ...base, id: 'far', name: '멀리', type: 'hospital', lat: 37.7, lng: 127.0, schedule: [{ date: '20260925', time: '' }] },
  { ...base, id: 'near-ph', name: '가까운약국', type: 'pharmacy', lat: 37.501, lng: 127.0, schedule: [{ date: '20260924', time: '' }] },
  { ...base, id: 'mid-ho', name: '중간의원', type: 'hospital', lat: 37.52, lng: 127.0, schedule: [{ date: '20260925', time: '' }, { date: '20260926', time: '' }] },
];
const origin = { lat: 37.5, lng: 127.0 };

describe('filterAndSort', () => {
  it('반경 밖 제외, 거리순 정렬, distanceKm 포함', () => {
    const r = filterAndSort(list, { origin, radiusKm: 5, type: 'all', date: 'all' });
    expect(r.map((f) => f.id)).toEqual(['near-ph', 'mid-ho']);
    expect(r[0].distanceKm).toBeCloseTo(0.11, 1);
  });
  it('구분 필터', () => {
    expect(filterAndSort(list, { origin, radiusKm: 50, type: 'pharmacy', date: 'all' }).map((f) => f.id)).toEqual(['near-ph']);
  });
  it('날짜 필터', () => {
    expect(filterAndSort(list, { origin, radiusKm: 50, type: 'all', date: '20260925' }).map((f) => f.id)).toEqual(['mid-ho', 'far']);
  });
});

it('uniqueDates는 정렬된 유니크 날짜', () => {
  expect(uniqueDates(list)).toEqual(['20260924', '20260925', '20260926']);
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/filter.test.ts` → FAIL

- [ ] **Step 3: 구현** — `lib/filter.ts`

```ts
import { distanceKm, type LatLng } from './geo';
import type { Facility } from './types';

export type TypeFilter = 'all' | 'hospital' | 'pharmacy';
export type FacilityWithDistance = Facility & { distanceKm: number };

export function filterAndSort(
  list: Facility[],
  opt: { origin: LatLng; radiusKm: number; type: TypeFilter; date: string | 'all' },
): FacilityWithDistance[] {
  return list
    .filter((f) => opt.type === 'all' || f.type === opt.type)
    .filter((f) => opt.date === 'all' || f.schedule.some((s) => s.date === opt.date))
    .map((f) => ({ ...f, distanceKm: distanceKm(opt.origin, f) }))
    .filter((f) => f.distanceKm <= opt.radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function uniqueDates(list: Facility[]): string[] {
  return [...new Set(list.flatMap((f) => f.schedule.map((s) => s.date)))].sort();
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run tests/filter.test.ts` → passed

- [ ] **Step 5: Commit**

```bash
git add lib/filter.ts tests/filter.test.ts
git commit -m "feat: 구분·날짜·반경 필터와 거리순 정렬"
```

---

### Task 5: 서버 fetch 페이지 순회와 Route Handler

**Files:**
- Create: `lib/fetchFacilities.ts`, `app/api/facilities/route.ts`
- Test: `tests/fetchFacilities.test.ts`

**Interfaces:**
- Consumes: `parseFacilitiesXml`, `toApiSido`
- Produces:
  ```ts
  function fetchFacilitiesBySido(sido: string, opt?: { fetchImpl?: typeof fetch; serviceKey?: string }): Promise<Facility[]>
  // GET /api/facilities?sido=서울특별시 → 200 { sido, fetchedAt: ISO string, items: Facility[] }
  //   400 { error } (sido 누락/미지원), 502 { error } (upstream 실패)
  ```

- [ ] **Step 1: 실패하는 테스트 작성** — `tests/fetchFacilities.test.ts`

```ts
import { describe, expect, it, vi } from 'vitest';
import { fetchFacilitiesBySido } from '@/lib/fetchFacilities';

const item = (id: string) =>
  `<item><hpid>${id}</hpid><dutyName>${id}</dutyName><dutyDivNam>의원</dutyDivNam><wgs84Lat>37</wgs84Lat><wgs84Lon>127</wgs84Lon></item>`;
const page = (ids: string[], total: number) =>
  `<response><header><resultCode>00</resultCode></header><body><items>${ids.map(item).join('')}</items><totalCount>${total}</totalCount></body></response>`;

describe('fetchFacilitiesBySido', () => {
  it('totalCount 소진까지 pageNo를 올리며 호출하고 병합한다', async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      const u = new URL(String(url));
      const p = u.searchParams.get('pageNo');
      expect(u.searchParams.get('Q0')).toBe('서울특별시');
      expect(u.searchParams.get('serviceKey')).toBe('KEY');
      const body = p === '1' ? page(['a', 'b'], 3) : page(['c'], 3);
      return new Response(body, { status: 200 });
    });
    const items = await fetchFacilitiesBySido('서울특별시', { fetchImpl: fetchImpl as unknown as typeof fetch, serviceKey: 'KEY', pageSize: 2 });
    expect(items.map((f) => f.id)).toEqual(['a', 'b', 'c']);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
  it('HTTP 오류면 throw', async () => {
    const fetchImpl = vi.fn(async () => new Response('x', { status: 500 }));
    await expect(fetchFacilitiesBySido('서울특별시', { fetchImpl: fetchImpl as unknown as typeof fetch, serviceKey: 'KEY' })).rejects.toThrow(/500/);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/fetchFacilities.test.ts` → FAIL

- [ ] **Step 3: 구현**

`lib/fetchFacilities.ts`:
```ts
import { parseFacilitiesXml } from './parse';
import type { Facility } from './types';

const ENDPOINT =
  'https://apis.data.go.kr/B552657/HolidyEmgncClnicInsttInfoInqireService/getHolidyClnicPosblEgytInfoInqire';
export const REVALIDATE_SECONDS = 21600; // 6시간

type Opt = { fetchImpl?: typeof fetch; serviceKey?: string; pageSize?: number };

/** 시도 단위로 전체 페이지를 순회해 Facility 목록을 만든다 (서버 전용) */
export async function fetchFacilitiesBySido(sido: string, opt: Opt = {}): Promise<Facility[]> {
  const fetchImpl = opt.fetchImpl ?? fetch;
  const serviceKey = opt.serviceKey ?? process.env.DATA_GO_KR_KEY;
  const pageSize = opt.pageSize ?? 1000;
  if (!serviceKey) throw new Error('DATA_GO_KR_KEY 환경변수가 없습니다');

  const all: Facility[] = [];
  for (let pageNo = 1; pageNo <= 50; pageNo++) {
    const url = new URL(ENDPOINT);
    url.searchParams.set('serviceKey', serviceKey);
    url.searchParams.set('Q0', sido);
    url.searchParams.set('pageNo', String(pageNo));
    url.searchParams.set('numOfRows', String(pageSize));

    const res = await fetchImpl(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) throw new Error(`upstream HTTP ${res.status}`);
    const { items, totalCount } = parseFacilitiesXml(await res.text());
    all.push(...items);
    if (items.length === 0 || pageNo * pageSize >= totalCount) break;
  }
  return all;
}
```

`app/api/facilities/route.ts`:
```ts
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
```

- [ ] **Step 4: 통과 확인**

Run: `npm test` → 전체 passed. `npx tsc --noEmit` → 오류 없음.

- [ ] **Step 5: Commit**

```bash
git add lib/fetchFacilities.ts app/api/facilities/route.ts tests/fetchFacilities.test.ts
git commit -m "feat: 명절 진료기관 API 프록시 Route Handler"
```

---

### Task 6: 실제 API 검증 (Q0 표기·QT 생략·약국 포함 여부)

**Files:**
- Create: `.env.local` (사용자가 키 입력, git 제외)
- Modify(필요 시): `lib/sido.ts`, `lib/fetchFacilities.ts`

- [ ] **Step 1: `.env.local` 준비** — 사용자에게 두 키를 넣도록 요청. 값은 채팅에 붙이지 말고 파일에 직접 입력.

- [ ] **Step 2: dev 서버 기동 후 호출**

```bash
npm run dev &   # 별도 터미널
curl -s "http://localhost:3000/api/facilities?sido=서울특별시" | head -c 1500
curl -s "http://localhost:3000/api/facilities?sido=강원특별자치도" | head -c 500
curl -s "http://localhost:3000/api/facilities?sido=전북특별자치도" | head -c 500
```

확인 항목:
1. `items` 가 비어 있지 않은지(2026 추석 데이터 등록 여부). 비어 있으면 `QT=20260925` 를 붙여 재시도해 차이를 본다.
2. `type: 'pharmacy'` 항목이 있는지. 없으면 `QD=H` 를 추가 호출해 병합하도록 `fetchFacilitiesBySido` 를 수정한다.
3. 강원/전북이 0건이면 `Q0=강원도`, `Q0=전라북도` 로 직접 호출해 비교하고, 다르면 `lib/sido.ts` 에 `apiName` 필드를 두어 Q0 전송 시 구 표기로 변환한다.
4. `schedule[0].date` 형식이 `YYYYMMDD` 인지.

- [ ] **Step 3: 발견 사항 반영 후 테스트·커밋**

```bash
npm test && git add -A && git commit -m "fix: 실제 API 응답에 맞춰 시도 표기·조회 조건 보정"
```
(변경 없으면 커밋 생략.)

---

### Task 7: 카카오 SDK 로더와 지도 컴포넌트

**Files:**
- Create: `lib/kakao.ts`, `components/FacilityMap.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `FacilityWithDistance`, `LatLng`
- Produces:
  ```ts
  // lib/kakao.ts
  function loadKakao(): Promise<typeof window.kakao>   // SDK 로드 완료를 기다림
  function coordToSido(lat, lng): Promise<string | null>  // region_1depth_name
  // FacilityMap props
  { center: LatLng; origin: LatLng | null; items: FacilityWithDistance[]; selectedId: string | null; onSelect: (id: string) => void }
  ```

- [ ] **Step 1: `app/layout.tsx` 에 SDK Script 추가**

```tsx
import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: '추석 연휴 문 여는 병원·약국 찾기',
  description: '내 위치 주변에서 추석 연휴에 문을 여는 병·의원과 약국을 거리순으로 찾아보세요.',
};

const KAKAO_SDK = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&libraries=services&autoload=false`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <Script src={KAKAO_SDK} strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: `lib/kakao.ts`**

```ts
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
```

- [ ] **Step 3: `components/FacilityMap.tsx`**

```tsx
'use client';
import { useEffect, useRef } from 'react';
import { loadKakao } from '@/lib/kakao';
import type { LatLng } from '@/lib/geo';
import type { FacilityWithDistance } from '@/lib/filter';

type Props = {
  center: LatLng;
  origin: LatLng | null;
  items: FacilityWithDistance[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function FacilityMap({ center, origin, items, selectedId, onSelect }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const originRef = useRef<any>(null);

  // 지도 생성
  useEffect(() => {
    let cancelled = false;
    loadKakao().then((kakao) => {
      if (cancelled || !el.current || mapRef.current) return;
      mapRef.current = new kakao.maps.Map(el.current, {
        center: new kakao.maps.LatLng(center.lat, center.lng),
        level: 5,
      });
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 중심 이동
  useEffect(() => {
    loadKakao().then((kakao) => {
      mapRef.current?.setCenter(new kakao.maps.LatLng(center.lat, center.lng));
    });
  }, [center.lat, center.lng]);

  // 내 위치 마커
  useEffect(() => {
    loadKakao().then((kakao) => {
      originRef.current?.setMap(null);
      if (!origin || !mapRef.current) return;
      originRef.current = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(origin.lat, origin.lng),
        content: '<div style="width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 2px #2563eb"></div>',
        zIndex: 10,
      });
      originRef.current.setMap(mapRef.current);
    });
  }, [origin]);

  // 기관 마커
  useEffect(() => {
    loadKakao().then((kakao) => {
      if (!mapRef.current) return;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = items.map((f) => {
        const selected = f.id === selectedId;
        const color = f.type === 'pharmacy' ? '#16a34a' : '#dc2626';
        const overlay = new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(f.lat, f.lng),
          yAnchor: 1,
          zIndex: selected ? 5 : 1,
          content: `<div data-id="${f.id}" title="${f.name}" style="cursor:pointer;width:${selected ? 22 : 14}px;height:${selected ? 22 : 14}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
        });
        overlay.setMap(mapRef.current);
        return overlay;
      });
    });
  }, [items, selectedId]);

  // CustomOverlay는 click 이벤트가 없어 컨테이너 위임으로 처리
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const handler = (e: Event) => {
      const id = (e.target as HTMLElement)?.closest?.('[data-id]')?.getAttribute('data-id');
      if (id) onSelect(id);
    };
    node.addEventListener('click', handler);
    return () => node.removeEventListener('click', handler);
  }, [onSelect]);

  return <div ref={el} className="h-64 w-full rounded-lg border sm:h-80" />;
}
```

- [ ] **Step 4: 빌드·타입 확인**

Run: `npx tsc --noEmit && npm run lint` → 오류 없음

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx lib/kakao.ts components/FacilityMap.tsx
git commit -m "feat: 카카오맵 SDK 로더와 지도 마커 컴포넌트"
```

---

### Task 8: 위치·필터·목록 UI와 페이지 조합

**Files:**
- Create: `components/LocationBar.tsx`, `components/FilterBar.tsx`, `components/FacilityCard.tsx`, `components/FacilityList.tsx`
- Modify: `app/page.tsx` (create-next-app 기본 내용 전체 교체)

**Interfaces:**
- Consumes: `SIDO_LIST`, `toApiSido`, `coordToSido`, `filterAndSort`, `uniqueDates`, `FacilityMap`
- Produces: 동작하는 단일 페이지

- [ ] **Step 1: `components/LocationBar.tsx`**

```tsx
'use client';
import { SIDO_LIST } from '@/lib/sido';

type Props = {
  sido: string | null;
  locating: boolean;
  onLocate: () => void;
  onSelectSido: (sido: string) => void;
};

export default function LocationBar({ sido, locating, onLocate, onSelectSido }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onLocate}
        disabled={locating}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {locating ? '위치 확인 중…' : '내 위치로 찾기'}
      </button>
      <select
        value={sido ?? ''}
        onChange={(e) => e.target.value && onSelectSido(e.target.value)}
        className="rounded-md border bg-white px-3 py-2 text-sm"
        aria-label="시도 선택"
      >
        <option value="">시도 직접 선택</option>
        {SIDO_LIST.map((s) => (
          <option key={s.name} value={s.name}>{s.name}</option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 2: `components/FilterBar.tsx`**

```tsx
'use client';
import type { TypeFilter } from '@/lib/filter';

type Props = {
  type: TypeFilter; onType: (t: TypeFilter) => void;
  date: string; dates: string[]; onDate: (d: string) => void;
  radius: number; onRadius: (r: number) => void;
};

const fmtDate = (d: string) => `${Number(d.slice(4, 6))}/${Number(d.slice(6, 8))}`;

export default function FilterBar({ type, onType, date, dates, onDate, radius, onRadius }: Props) {
  const sel = 'rounded-md border bg-white px-3 py-2 text-sm';
  return (
    <div className="flex flex-wrap gap-2">
      <select value={type} onChange={(e) => onType(e.target.value as TypeFilter)} className={sel} aria-label="구분">
        <option value="all">병의원+약국</option>
        <option value="hospital">병의원</option>
        <option value="pharmacy">약국</option>
      </select>
      <select value={date} onChange={(e) => onDate(e.target.value)} className={sel} aria-label="날짜">
        <option value="all">모든 날짜</option>
        {dates.map((d) => <option key={d} value={d}>{fmtDate(d)}</option>)}
      </select>
      <select value={radius} onChange={(e) => onRadius(Number(e.target.value))} className={sel} aria-label="반경">
        {[1, 3, 5, 10].map((r) => <option key={r} value={r}>{r}km 이내</option>)}
      </select>
    </div>
  );
}
```

- [ ] **Step 3: `components/FacilityCard.tsx`**

```tsx
'use client';
import type { FacilityWithDistance } from '@/lib/filter';

type Props = { f: FacilityWithDistance; selected: boolean; onSelect: (id: string) => void };

const fmtDate = (d: string) => `${Number(d.slice(4, 6))}/${Number(d.slice(6, 8))}`;
const fmtKm = (km: number) => (km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`);

export default function FacilityCard({ f, selected, onSelect }: Props) {
  const badge = f.type === 'pharmacy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  const naviUrl = `https://map.kakao.com/link/to/${encodeURIComponent(f.name)},${f.lat},${f.lng}`;
  return (
    <li
      id={`fac-${f.id}`}
      onClick={() => onSelect(f.id)}
      className={`cursor-pointer rounded-lg border bg-white p-3 ${selected ? 'border-blue-500 ring-2 ring-blue-200' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className={`mr-2 rounded px-1.5 py-0.5 text-xs ${badge}`}>{f.divName || (f.type === 'pharmacy' ? '약국' : '병의원')}</span>
          <span className="font-semibold">{f.name}</span>
        </div>
        <span className="shrink-0 text-sm text-gray-600">{fmtKm(f.distanceKm)}</span>
      </div>
      <p className="mt-1 text-sm text-gray-700">{f.addr}</p>
      <ul className="mt-1 text-sm">
        {f.schedule.map((s) => (
          <li key={s.date}><span className="text-gray-500">{fmtDate(s.date)}</span> {s.time || '시간 미기재'}</li>
        ))}
      </ul>
      {f.note && <p className="mt-1 text-xs text-gray-500">{f.note}</p>}
      <div className="mt-2 flex gap-3 text-sm">
        {f.tel && <a href={`tel:${f.tel}`} className="text-blue-600 underline" onClick={(e) => e.stopPropagation()}>📞 {f.tel}</a>}
        <a href={naviUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline" onClick={(e) => e.stopPropagation()}>길찾기</a>
      </div>
    </li>
  );
}
```

- [ ] **Step 4: `components/FacilityList.tsx`**

```tsx
'use client';
import FacilityCard from './FacilityCard';
import type { FacilityWithDistance } from '@/lib/filter';

type Props = { items: FacilityWithDistance[]; selectedId: string | null; onSelect: (id: string) => void; emptyMessage: string };

export default function FacilityList({ items, selectedId, onSelect, emptyMessage }: Props) {
  if (items.length === 0) return <p className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-600">{emptyMessage}</p>;
  return (
    <ul className="space-y-2">
      {items.map((f) => <FacilityCard key={f.id} f={f} selected={f.id === selectedId} onSelect={onSelect} />)}
    </ul>
  );
}
```

- [ ] **Step 5: `app/page.tsx`**

```tsx
'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import FacilityList from '@/components/FacilityList';
import FacilityMap from '@/components/FacilityMap';
import FilterBar from '@/components/FilterBar';
import LocationBar from '@/components/LocationBar';
import { filterAndSort, uniqueDates, type TypeFilter } from '@/lib/filter';
import type { LatLng } from '@/lib/geo';
import { coordToSido } from '@/lib/kakao';
import { SIDO_LIST, toApiSido } from '@/lib/sido';
import type { Facility } from '@/lib/types';

type Data = { sido: string; fetchedAt: string; items: Facility[] };

export default function Page() {
  const [origin, setOrigin] = useState<LatLng | null>(null);   // 내 위치
  const [sido, setSido] = useState<string | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<TypeFilter>('all');
  const [date, setDate] = useState('all');
  const [radius, setRadius] = useState(3);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 수동 선택 시 지도 중심·거리 기준은 시도청 좌표
  const center = useMemo<LatLng>(
    () => origin ?? SIDO_LIST.find((s) => s.name === sido)?.center ?? SIDO_LIST[0].center,
    [origin, sido],
  );

  const load = useCallback(async (s: string) => {
    setLoading(true); setError(null); setData(null);
    try {
      const res = await fetch(`/api/facilities?sido=${encodeURIComponent(s)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오기 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (sido) load(sido); }, [sido, load]);

  const locate = useCallback(() => {
    if (!navigator.geolocation) { setError('이 브라우저는 위치 정보를 지원하지 않습니다. 시도를 직접 선택하세요.'); return; }
    setLocating(true); setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setOrigin(p);
        const region = await coordToSido(p.lat, p.lng);
        const s = region ? toApiSido(region) : null;
        if (s) setSido(s); else setError('현재 위치의 시도를 알 수 없습니다. 시도를 직접 선택하세요.');
        setLocating(false);
      },
      () => { setLocating(false); setError('위치 권한이 거부되었습니다. 시도를 직접 선택하세요.'); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const selectSido = useCallback((s: string) => { setOrigin(null); setSido(s); }, []);

  const dates = useMemo(() => (data ? uniqueDates(data.items) : []), [data]);
  const items = useMemo(
    () => (data ? filterAndSort(data.items, { origin: center, radiusKm: radius, type, date }) : []),
    [data, center, radius, type, date],
  );

  const onSelect = useCallback((id: string) => {
    setSelectedId(id);
    document.getElementById(`fac-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  const emptyMessage = !sido
    ? '내 위치로 찾기를 누르거나 시도를 선택하세요.'
    : data && data.items.length === 0
      ? '해당 지역의 명절 진료 정보가 아직 등록되지 않았습니다. 응급의료포털(e-gen.or.kr)을 확인하세요.'
      : '반경 안에 결과가 없습니다. 반경을 넓혀보세요.';

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <header>
        <h1 className="text-2xl font-bold">추석 연휴 문 여는 병원·약국</h1>
        <p className="text-sm text-gray-600">
          내 위치 주변의 명절 비상진료기관을 거리순으로 보여줍니다.
          {data && <> · 기준 {new Date(data.fetchedAt).toLocaleString('ko-KR')}</>}
        </p>
      </header>

      <LocationBar sido={sido} locating={locating} onLocate={locate} onSelectSido={selectSido} />
      <FilterBar type={type} onType={setType} date={date} dates={dates} onDate={setDate} radius={radius} onRadius={setRadius} />

      {error && (
        <div className="flex items-center justify-between rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          <span>{error}</span>
          {sido && <button type="button" onClick={() => load(sido)} className="underline">다시 시도</button>}
        </div>
      )}

      <FacilityMap center={center} origin={origin} items={items} selectedId={selectedId} onSelect={onSelect} />

      {loading ? (
        <p className="text-center text-sm text-gray-600">불러오는 중…</p>
      ) : (
        <>
          {data && <p className="text-sm text-gray-600">{items.length}곳 표시 (전체 {data.items.length}곳)</p>}
          <FacilityList items={items} selectedId={selectedId} onSelect={onSelect} emptyMessage={emptyMessage} />
        </>
      )}

      <footer className="border-t pt-4 text-xs text-gray-500">
        출처: 국립중앙의료원 전국 명절 비상 진료기관 정보 조회 서비스(공공데이터포털) · 응급의료포털 E-Gen.
        진료 시간은 변경될 수 있으니 방문 전 전화로 확인하세요.
      </footer>
    </main>
  );
}
```

- [ ] **Step 6: 로컬 확인**

Run: `npx tsc --noEmit && npm run lint && npm test`
Run: `npm run dev` 후 브라우저에서 `http://localhost:3000` 접속.
확인: (1) 내 위치로 찾기 → 목록·마커 표시 (2) 시도 select → 시도청 기준 표시 (3) 필터 변경 시 목록·마커 갱신 (4) 마커 클릭 → 카드 강조·스크롤 (5) 전화·길찾기 링크 동작 (6) 400px 폭에서 가로 스크롤 없음.

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx components/
git commit -m "feat: 위치·필터·목록 UI 및 페이지 조합"
```

---

### Task 9: Vercel 배포

**Files:**
- Modify: `README.md` (실행·배포 방법)

- [ ] **Step 1: README 작성**

```markdown
# 추석 연휴 문 여는 병원·약국 찾기

내 위치 기준으로 명절 비상진료기관(병·의원·약국)을 거리순 목록과 카카오맵으로 보여주는 Next.js 앱.

## 실행
1. `.env.example` 을 `.env.local` 로 복사해 키 입력
   - `DATA_GO_KR_KEY`: 공공데이터포털 「국립중앙의료원_전국 명절 비상 진료기관 정보 조회 서비스」 활용신청 후 발급되는 일반 인증키(Decoding)
   - `NEXT_PUBLIC_KAKAO_JS_KEY`: Kakao Developers 앱의 JavaScript 키. 플랫폼 > Web 에 `http://localhost:3000` 과 배포 도메인 등록
2. `npm install && npm run dev`

## 테스트
`npm test`

## 배포 (Vercel)
`vercel` 로 프로젝트 연결 후 Environment Variables 에 위 두 키를 넣고 `vercel --prod`.

## 데이터 출처
국립중앙의료원 전국 명절 비상 진료기관 정보 조회 서비스 (공공데이터포털, CC0)
```

- [ ] **Step 2: 프로덕션 빌드 확인**

Run: `npm run build` → 성공

- [ ] **Step 3: Vercel 연결·환경변수·배포**

```bash
vercel link --yes
vercel env add DATA_GO_KR_KEY production      # 값은 프롬프트에 입력(사용자)
vercel env add NEXT_PUBLIC_KAKAO_JS_KEY production
vercel --prod
```
`vercel env add` 는 대화형이므로 사용자가 `! vercel env add ...` 로 직접 실행하거나, `.env.local` 값을 `vercel env add NAME production < 파일` 로 파이프한다.

- [ ] **Step 4: 배포 후 확인**

- 배포 URL 접속 → 지도가 뜨지 않으면 카카오 디벨로퍼스 Web 플랫폼에 배포 도메인(`https://<project>.vercel.app`) 등록(사용자 작업) 후 새로고침.
- `https://<project>.vercel.app/api/facilities?sido=서울특별시` 가 200 반환.

- [ ] **Step 5: Commit**

```bash
git add README.md && git commit -m "docs: 실행 및 Vercel 배포 안내"
```
