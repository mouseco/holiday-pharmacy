import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_KR } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const plex = IBM_Plex_Sans_KR({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-plex',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '추석 연휴 문 여는 병원·약국 찾기',
  description: '내 위치 주변에서 추석 연휴에 문을 여는 병·의원과 약국을 거리순으로 찾아보세요.',
};

export const viewport: Viewport = { themeColor: '#16211c' };

const KAKAO_SDK = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&libraries=services&autoload=false`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={plex.variable}>
      <body className="min-h-screen bg-ground text-ink antialiased">
        <Script src={KAKAO_SDK} strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
