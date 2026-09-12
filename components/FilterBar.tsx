'use client';
import { fmtMonthDay, holidayLabel, weekday } from '@/lib/dates';
import type { TypeFilter } from '@/lib/filter';

type Props = {
  type: TypeFilter; onType: (t: TypeFilter) => void;
  date: string; dates: string[]; onDate: (d: string) => void;
  radius: number; onRadius: (r: number) => void;
};

const RADII = [1, 3, 5, 10];

function Segment<T extends string | number>({
  label, value, options, onChange,
}: { label: string; value: T; options: { v: T; text: React.ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex overflow-x-auto rounded-lg border border-line bg-surface p-0.5">
      {options.map((o) => {
        const active = o.v === value;
        return (
          <button
            key={String(o.v)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.v)}
            className={`min-w-0 flex-1 whitespace-nowrap rounded-md px-3 py-2 text-sm leading-tight transition-colors ${
              active ? 'bg-ink font-semibold text-white' : 'font-medium text-ink-soft hover:bg-ground'
            }`}
          >
            {o.text}
          </button>
        );
      })}
    </div>
  );
}

export default function FilterBar({ type, onType, date, dates, onDate, radius, onRadius }: Props) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Segment
        label="구분"
        value={type}
        onChange={onType}
        options={[
          { v: 'all', text: '병의원과 약국' },
          { v: 'hospital', text: <><Dot kind="hospital" />병의원</> },
          { v: 'pharmacy', text: <><Dot kind="pharmacy" />약국</> },
        ]}
      />
      <Segment
        label="반경"
        value={radius}
        onChange={onRadius}
        options={RADII.map((r) => ({ v: r, text: `${r}km` }))}
      />
      {dates.length > 0 && (
        <div className="sm:col-span-2">
          <Segment
            label="날짜"
            value={date}
            onChange={onDate}
            options={[
              { v: 'all', text: '연휴 전체' },
              ...dates.map((d) => ({
                v: d,
                text: (
                  <span className="flex flex-col items-center">
                    <span>{fmtMonthDay(d)} {weekday(d)}</span>
                    {holidayLabel(d) && <span className="text-[11px] opacity-80">{holidayLabel(d)}</span>}
                  </span>
                ),
              })),
            ]}
          />
        </div>
      )}
    </div>
  );
}

function Dot({ kind }: { kind: 'hospital' | 'pharmacy' }) {
  return <span aria-hidden className={`mr-1.5 inline-block h-2 w-2 rounded-full align-middle ${kind === 'hospital' ? 'bg-hospital' : 'bg-pharmacy'}`} />;
}
