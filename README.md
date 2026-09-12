# 추석 연휴 문 여는 병원·약국 찾기

내 위치 기준으로 명절 연휴에 문을 여는 병·의원과 약국을 거리순 목록과 카카오맵으로 보여주는 웹앱.

**서비스**: https://holiday-pharmacy-hazel.vercel.app

## 동작 방식

```
브라우저 ── geolocation → 카카오 Geocoder(좌표→시도) → GET /api/facilities?sido=
                                                           │
Next.js Route Handler ── 명절 비상진료기관 API(시도 단위, 6h 캐시) ── hpid로 좌표 인덱스 조인
                                                           │
브라우저 ── haversine 거리 계산 → 구분/날짜/반경 필터 → 목록 + 지도 마커
```

- 명절 API 응답에는 위경도가 없어, 병의원·약국 기본정보 API로 만든 전국 `hpid → [lat, lng]` 인덱스(`data/coords.json`, 약 10만 건)와 서버에서 조인한다.
- 모든 기관이 연휴 날짜 전체를 나열하고 실제 진료일에만 시간이 채워지므로, 시간이 없는 날짜는 휴진으로 처리한다.
- 현재 위치는 브라우저 안에서만 쓰이며 서버에는 시·도 이름만 전달된다.

## 실행

1. `.env.example`을 `.env.local`로 복사해 키 입력
   - `DATA_GO_KR_KEY`: 공공데이터포털 일반 인증키(Decoding). 아래 3개 API에 활용신청 필요
     - [국립중앙의료원_전국 명절 비상 진료기관 정보 조회 서비스](https://www.data.go.kr/data/15000480/openapi.do)
     - [국립중앙의료원_전국 병·의원 찾기 서비스](https://www.data.go.kr/data/15000736/openapi.do)
     - [국립중앙의료원_전국 약국 정보 조회 서비스](https://www.data.go.kr/data/15000576/openapi.do)
   - `NEXT_PUBLIC_KAKAO_JS_KEY`: [Kakao Developers](https://developers.kakao.com) 앱의 JavaScript 키. 플랫폼 키 > JavaScript 키 > **JavaScript SDK 도메인**에 `http://localhost:3000`과 배포 도메인 등록
2. `npm install`
3. `npm run build:coords` — 전국 좌표 인덱스 생성(API 22회 호출, 약 1분). 저장소에 포함된 파일을 그대로 써도 된다.
4. `npm run dev`

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm test` | Vitest (파서·거리·필터·API 페이지 순회) |
| `npm run build:coords` | `data/coords.json` 갱신 |
| `npm run build` | 프로덕션 빌드 |

## 배포 (Vercel)

`vercel link` 후 Environment Variables에 위 두 키를 넣고 `vercel --prod`. 카카오 SDK 도메인에 배포 도메인을 등록해야 지도가 뜬다.

## 스택

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Kakao Maps JS SDK · fast-xml-parser · Vitest

## 데이터 출처와 라이선스

- 진료 정보·좌표: 국립중앙의료원 중앙응급의료센터, 공공데이터포털 Open API (공공누리·CC0 이용허락 범위 내)
- 지도: 카카오맵
- 코드: MIT (`LICENSE`)

이 프로젝트는 국립중앙의료원·보건복지부·카카오와 관련이 없는 개인 프로젝트입니다. 진료 시간은 바뀔 수 있으니 방문 전 전화로 확인하세요.
