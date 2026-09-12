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
