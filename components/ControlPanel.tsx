'use client';
import { ChevronIcon, CrossBadge, CrosshairIcon } from './icons';
import { fmtMonthDay, holidayLabel, weekday } from '@/lib/dates';
import type { TypeFilter } from '@/lib/filter';
import { SIDO_LIST } from '@/lib/sido';

type Props = {
  sido: string | null;
  hasOrigin: boolean;
  locating: boolean;
  onLocate: () => void;
  onSelectSido: (sido: string) => void;
  type: TypeFilter; onType: (t: TypeFilter) => void;
  date: string; dates: string[]; onDate: (d: string) => void;
  radius: number; onRadius: (r: number) => void;
};

const RADII = [1, 3, 5, 10];
const CONTROL = 'h-11 rounded-xl text-[15px]'; // 모든 컨트롤 높이·모서리 통일

/** 라벨 + 컨트롤 한 줄. 라벨은 정보(무엇을 고르는지)이므로 항상 보인다 */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[3.25rem_1fr] sm:items-center sm:gap-3">
      <span className="text-[13px] font-medium text-mute sm:text-sm">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Segment<T extends string | number>({
  label, value, options, onChange,
}: { label: string; value: T; options: { v: T; text: React.ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className={`flex ${CONTROL} border border-line bg-ground p-1`}>
      {options.map((o) => {
        const active = o.v === value;
        return (
          <button
            key={String(o.v)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.v)}
            className={`flex min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-lg px-1 leading-none transition-colors sm:px-2 ${
              active ? 'bg-accent font-semibold text-white shadow-sm' : 'font-medium text-ink-soft hover:bg-surface'
            }`}
          >
            {o.text}
          </button>
        );
      })}
    </div>
  );
}

export default function ControlPanel(p: Props) {
  return (
    <div className="space-y-3 rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <Row label="위치">
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <button
            type="button"
            onClick={p.onLocate}
            disabled={p.locating}
            className={`${CONTROL} inline-flex items-center gap-2 bg-accent px-4 font-semibold text-white transition-colors hover:bg-accent-deep disabled:opacity-60`}
          >
            <CrosshairIcon className={`h-[18px] w-[18px] ${p.locating ? 'animate-spin' : ''}`} />
            {p.locating ? '확인 중' : p.hasOrigin ? '내 위치' : '내 위치로 찾기'}
          </button>
          <label className="relative block min-w-0">
            <span className="sr-only">시도 선택</span>
            <select
              value={p.sido ?? ''}
              onChange={(e) => e.target.value && p.onSelectSido(e.target.value)}
              aria-label="시도 선택"
              className={`${CONTROL} w-full appearance-none border border-line bg-ground pl-3.5 pr-9 font-medium text-ink`}
            >
              <option value="">지역 직접 선택</option>
              {SIDO_LIST.map((s) => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
            <ChevronIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
          </label>
        </div>
      </Row>

      <Row label="구분">
        <Segment
          label="구분"
          value={p.type}
          onChange={p.onType}
          options={[
            { v: 'all', text: '전체' },
            { v: 'hospital', text: <><CrossBadge kind="hospital" className="mr-1.5 h-4 w-4" />병의원</> },
            { v: 'pharmacy', text: <><CrossBadge kind="pharmacy" className="mr-1.5 h-4 w-4" />약국</> },
          ]}
        />
      </Row>

      {p.dates.length > 0 && (
        <Row label="날짜">
          <Segment
            label="날짜"
            value={p.date}
            onChange={p.onDate}
            options={[
              { v: 'all', text: '전체' },
              ...p.dates.map((d) => ({
                v: d,
                text: (
                  <span className="flex flex-col items-center gap-0.5 text-[14px] sm:text-[15px]">
                    <span>{fmtMonthDay(d)}<span className="ml-0.5 text-[11px] font-normal opacity-80 sm:ml-1 sm:text-[12px]">{weekday(d)}</span></span>
                    {holidayLabel(d) && <span className="text-[10px] font-medium opacity-80 sm:text-[11px]">{holidayLabel(d)}</span>}
                  </span>
                ),
              })),
            ]}
          />
        </Row>
      )}

      <Row label="반경">
        <Segment label="반경" value={p.radius} onChange={p.onRadius} options={RADII.map((r) => ({ v: r, text: `${r}km` }))} />
      </Row>
    </div>
  );
}
