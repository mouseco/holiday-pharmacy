type Props = { subtitle: string };

/** 보름달·감나무 가지·까치. 장식이 아니라 "추석"이라는 맥락을 한눈에 주는 표지 */
function MoonMagpie({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 170" className={className} role="img" aria-label="보름달 아래 감나무 가지에 앉은 까치">
      {/* 달 */}
      <circle cx="215" cy="72" r="56" fill="var(--color-moon)" />
      <circle cx="200" cy="58" r="10" fill="#e9c97a" opacity=".45" />
      <circle cx="232" cy="88" r="14" fill="#e9c97a" opacity=".35" />
      <circle cx="222" cy="52" r="5" fill="#e9c97a" opacity=".4" />
      {/* 잔별 */}
      <g fill="var(--color-moon)" opacity=".7">
        <circle cx="40" cy="30" r="1.6" /><circle cx="92" cy="18" r="1.2" /><circle cx="140" cy="40" r="1.4" />
        <circle cx="290" cy="22" r="1.3" /><circle cx="70" cy="70" r="1.1" /><circle cx="300" cy="120" r="1.2" />
      </g>
      {/* 감나무 가지 */}
      <path d="M20 156 C 90 150, 140 138, 200 128 S 290 118, 312 108" fill="none" stroke="#5b3e2a" strokeWidth="5" strokeLinecap="round" />
      <path d="M232 124 c 14 -4, 22 -12, 26 -24" fill="none" stroke="#5b3e2a" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M270 116 c 6 6, 10 14, 8 24" fill="none" stroke="#5b3e2a" strokeWidth="3" strokeLinecap="round" />
      {/* 감 */}
      <g>
        <circle cx="262" cy="108" r="13" fill="var(--color-accent)" />
        <path d="M262 96 l4 -3 2 4 4 -1 -3 5 3 3 -4 1 -1 4 -3 -3 -3 3 -1 -4 -4 -1 3 -3 -3 -5 4 1z" fill="#4f7a3a" />
        <circle cx="282" cy="142" r="10" fill="var(--color-accent-deep)" />
        <path d="M282 133 l3 -2 2 3 3 -1 -2 4 2 2 -3 1 -1 3 -2 -2 -3 2 -1 -3 -3 -1 2 -2 -2 -4 3 1z" fill="#4f7a3a" />
        <circle cx="120" cy="150" r="9" fill="var(--color-accent)" />
        <path d="M120 142 l3 -2 2 3 3 -1 -2 4 2 2 -3 1 -1 3 -2 -2 -3 2 -1 -3 -3 -1 2 -2 -2 -4 3 1z" fill="#4f7a3a" />
      </g>
      {/* 까치 */}
      <g>
        <path d="M168 150 l-3 -18 M180 148 l-2 -16" stroke="#3a2a1f" strokeWidth="2.5" strokeLinecap="round" />
        {/* 꼬리 */}
        <path d="M188 118 L 236 138 L 232 126 Z" fill="#1c1a1c" />
        {/* 몸 */}
        <ellipse cx="172" cy="118" rx="27" ry="15" transform="rotate(-12 172 118)" fill="#1c1a1c" />
        {/* 배 흰 부분 */}
        <ellipse cx="170" cy="126" rx="15" ry="6.5" transform="rotate(-10 170 126)" fill="#f7f1e6" />
        {/* 날개 흰 띠 */}
        <path d="M160 110 c 10 -2, 20 0, 28 6 c -9 3, -19 3, -28 -6z" fill="#f7f1e6" opacity=".9" />
        {/* 머리 */}
        <circle cx="147" cy="104" r="11" fill="#1c1a1c" />
        <circle cx="143" cy="102" r="1.8" fill="#f7f1e6" />
        {/* 부리 */}
        <path d="M137 106 l-11 3 11 2z" fill="#3a2a1f" />
      </g>
    </svg>
  );
}

export default function ChuseokHero({ subtitle }: Props) {
  return (
    <header className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,var(--color-night-deep),var(--color-night)_70%)] text-ground">
      <div className="relative grid items-center gap-2 px-5 py-5 sm:grid-cols-[1fr_auto] sm:px-8 sm:py-7">
        <div className="relative z-10 pr-28 sm:pr-0">
          <p className="text-[13px] font-medium text-moon">추석 연휴</p>
          <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight sm:text-[32px]">문 여는 병원·약국</h1>
          <p className="mt-2 max-w-md text-[15px] leading-relaxed text-ground/80">{subtitle}</p>
        </div>
        {/* 모바일: 우측 하단에 겹쳐 배너 높이를 줄인다. sm 이상: 텍스트 옆 칸 */}
        <MoonMagpie className="absolute -bottom-3 -right-3 h-28 w-auto sm:static sm:-mb-7 sm:-mr-8 sm:h-44 sm:justify-self-end" />
      </div>
    </header>
  );
}
