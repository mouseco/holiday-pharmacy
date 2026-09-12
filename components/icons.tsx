/* 인라인 SVG 아이콘. 모두 currentColor, 1.75px 스트로크로 통일 */
type P = { className?: string };
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** 위치 조준점 */
export function CrosshairIcon({ className = 'h-4 w-4' }: P) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className} {...base}>
      <circle cx="10" cy="10" r="5.5" /><circle cx="10" cy="10" r="1.2" fill="currentColor" stroke="none" />
      <path d="M10 1.5v3M10 15.5v3M1.5 10h3M15.5 10h3" />
    </svg>
  );
}

export function ChevronIcon({ className = 'h-4 w-4' }: P) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className} {...base}>
      <path d="M5 8l5 5 5-5" />
    </svg>
  );
}

export function PhoneIcon({ className = 'h-4 w-4' }: P) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className} {...base}>
      <path d="M4.5 2.5h3l1.5 3.8-2 1.3a10 10 0 0 0 5.4 5.4l1.3-2 3.8 1.5v3a1.5 1.5 0 0 1-1.6 1.5A14 14 0 0 1 3 4.1a1.5 1.5 0 0 1 1.5-1.6Z" />
    </svg>
  );
}

/** 길찾기(방향 화살표) */
export function NavigateIcon({ className = 'h-4 w-4' }: P) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className} {...base}>
      <path d="M17 3 3 8.5l6.5 2 2 6.5L17 3Z" />
    </svg>
  );
}

/** 병의원/약국 십자 배지 (채움 사각 + 흰 십자) */
export function CrossBadge({ kind, className = 'h-5 w-5' }: P & { kind: 'hospital' | 'pharmacy' }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={`${className} ${kind === 'hospital' ? 'text-hospital' : 'text-pharmacy'}`}>
      <rect x="1" y="1" width="18" height="18" rx="5" fill="currentColor" />
      <path d="M10 5.5v9M5.5 10h9" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

/** 지도 핀 SVG 문자열 (카카오 CustomOverlay content 용) */
export function pinSvg(kind: 'hospital' | 'pharmacy', selected: boolean): string {
  const c = kind === 'hospital' ? '#c8352e' : '#1e7f52';
  const s = selected ? 34 : 24;
  return `<svg width="${s}" height="${s * 1.25}" viewBox="0 0 24 30" style="display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))">
    <path d="M12 29s10-8.6 10-16A10 10 0 0 0 2 13c0 7.4 10 16 10 16Z" fill="${c}" stroke="#fff" stroke-width="1.5"/>
    <path d="M12 8v10M7 13h10" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}
