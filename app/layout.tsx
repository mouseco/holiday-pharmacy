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
