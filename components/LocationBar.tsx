'use client';
import { SIDO_LIST } from '@/lib/sido';

type Props = {
  sido: string | null;
  hasOrigin: boolean;
  locating: boolean;
  onLocate: () => void;
  onSelectSido: (sido: string) => void;
};

export default function LocationBar({ sido, hasOrigin, locating, onLocate, onSelectSido }: Props) {
  return (
    <div className="flex flex-wrap items-stretch gap-2">
      <button
        type="button"
        onClick={onLocate}
        disabled={locating}
        className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-ink-soft disabled:opacity-60"
      >
        <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${hasOrigin ? 'bg-pharmacy' : 'bg-white/70'} ${locating ? 'animate-pulse' : ''}`} />
        {locating ? '위치 확인 중' : hasOrigin ? '내 위치 다시 찾기' : '내 위치로 찾기'}
      </button>
      <label className="relative inline-flex items-center">
        <span className="sr-only">시도 선택</span>
        <select
          value={sido ?? ''}
          onChange={(e) => e.target.value && onSelectSido(e.target.value)}
          aria-label="시도 선택"
          className="h-full appearance-none rounded-full border border-line bg-surface py-3 pl-4 pr-9 text-[15px] font-medium text-ink"
        >
          <option value="">지역 직접 선택</option>
          {SIDO_LIST.map((s) => (
            <option key={s.name} value={s.name}>{s.name}</option>
          ))}
        </select>
        <svg aria-hidden className="pointer-events-none absolute right-3.5 h-4 w-4 text-mute" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 6l4 4 4-4" />
        </svg>
      </label>
    </div>
  );
}
