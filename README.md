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
