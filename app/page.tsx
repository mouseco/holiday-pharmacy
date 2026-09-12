'use client';
import { useCallback, useMemo, useState } from 'react';
import FacilityList from '@/components/FacilityList';
import FacilityMap from '@/components/FacilityMap';
import FilterBar from '@/components/FilterBar';
import LocationBar from '@/components/LocationBar';
import { fmtMonthDay, todayKey } from '@/lib/dates';
import { filterAndSort, uniqueDates, type TypeFilter } from '@/lib/filter';
import type { LatLng } from '@/lib/geo';
import { coordToSido } from '@/lib/kakao';
import { SIDO_LIST, toApiSido } from '@/lib/sido';
import type { Facility } from '@/lib/types';

type Data = { sido: string; fetchedAt: string; items: Facility[]; missingCoords: number };

export default function Page() {
  const [origin, setOrigin] = useState<LatLng | null>(null); // 내 위치
  const [sido, setSido] = useState<string | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<TypeFilter>('all');
  const [date, setDate] = useState('all');
  const [radius, setRadius] = useState(3);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 수동 선택 시 지도 중심·거리 기준은 시도청 좌표
  const center = useMemo<LatLng>(
    () => origin ?? SIDO_LIST.find((s) => s.name === sido)?.center ?? SIDO_LIST[0].center,
    [origin, sido],
  );

  const load = useCallback(async (s: string) => {
    setLoading(true); setError(null); setData(null);
    try {
      const res = await fetch(`/api/facilities?sido=${encodeURIComponent(s)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  const locate = useCallback(() => {
    if (!navigator.geolocation) { setError('이 브라우저는 위치 정보를 지원하지 않습니다. 지역을 직접 선택하세요.'); return; }
    setLocating(true); setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setOrigin(p);
        const region = await coordToSido(p.lat, p.lng);
        const s = region ? toApiSido(region) : null;
        setLocating(false);
        if (s) { setSido(s); load(s); } else setError('현재 위치의 지역을 알 수 없습니다. 지역을 직접 선택하세요.');
      },
      () => { setLocating(false); setError('위치 권한이 없어 현재 위치를 쓸 수 없습니다. 지역을 직접 선택하세요.'); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [load]);

  const selectSido = useCallback((s: string) => { setOrigin(null); setSido(s); load(s); }, [load]);

  const dates = useMemo(() => (data ? uniqueDates(data.items) : []), [data]);
  const today = useMemo(() => { const t = todayKey(); return dates.includes(t) ? t : null; }, [dates]);
  const items = useMemo(
    () => (data ? filterAndSort(data.items, { origin: center, radiusKm: radius, type, date }) : []),
    [data, center, radius, type, date],
  );

  const onSelect = useCallback((id: string) => {
    setSelectedId(id);
    document.getElementById(`fac-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  const empty = !sido
    ? { title: '내 위치로 찾기를 누르거나 지역을 선택하세요.' }
    : data && data.items.length === 0
      ? { title: '이 지역의 연휴 진료 정보가 아직 등록되지 않았습니다.', hint: '응급의료포털 e-gen.or.kr 또는 129에서 확인할 수 있습니다.' }
      : { title: `${radius}km 안에 조건에 맞는 곳이 없습니다.`, hint: '반경을 넓히거나 날짜 조건을 풀어보세요.' };

  const period = dates.length ? `${fmtMonthDay(dates[0])}부터 ${fmtMonthDay(dates[dates.length - 1])}까지` : null;
  const fetched = data ? new Date(data.fetchedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6 lg:pt-10">
      <header className="mb-5">
        <p className="text-[15px] font-medium text-mute">추석 연휴</p>
        <h1 className="mt-0.5 text-[28px] font-bold leading-tight tracking-tight sm:text-4xl">문 여는 병원과 약국</h1>
        <p className="mt-2 max-w-prose text-[15px] text-ink-soft">
          {period ? `${period} 연휴 기간의 진료 정보입니다. ` : '내 위치에서 가까운 순으로 보여줍니다. '}
          진료 시간은 바뀔 수 있으니 방문 전에 전화로 확인하세요.
        </p>
      </header>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-6">
        <section className="space-y-3 lg:col-start-1 lg:row-start-1">
          <LocationBar sido={sido} hasOrigin={!!origin} locating={locating} onLocate={locate} onSelectSido={selectSido} />
          <FilterBar type={type} onType={setType} date={date} dates={dates} onDate={setDate} radius={radius} onRadius={setRadius} />
          {error && (
            <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-hospital/40 bg-hospital-soft px-3.5 py-2.5 text-sm text-ink">
              <span>{error}</span>
              {sido && <button type="button" onClick={() => load(sido)} className="shrink-0 font-semibold underline">다시 불러오기</button>}
            </div>
          )}
        </section>

        <aside className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="lg:sticky lg:top-6">
            <FacilityMap
              center={center}
              origin={origin}
              items={items}
              selectedId={selectedId}
              onSelect={onSelect}
              className="h-64 sm:h-80 lg:h-[calc(100vh-3rem)] lg:max-h-[860px]"
            />
          </div>
        </aside>

        <section className="lg:col-start-1 lg:row-start-2">
          {loading ? (
            <p className="py-10 text-center text-sm text-mute">진료 정보를 불러오는 중입니다</p>
          ) : (
            <>
              {data && (
                <p className="mb-2 text-sm text-mute">
                  가까운 순 <strong className="font-semibold text-ink">{items.length}곳</strong>
                  {' '}(지역 전체 {data.items.length}곳{data.missingCoords ? `, 위치 미확인 ${data.missingCoords}곳 제외` : ''})
                </p>
              )}
              <FacilityList items={items} dates={dates} today={today} selectedId={selectedId} onSelect={onSelect} empty={empty} />
            </>
          )}
        </section>
      </div>

      <footer className="mt-10 border-t border-line pt-4 text-[13px] leading-relaxed text-mute">
        자료: 국립중앙의료원 전국 명절 비상 진료기관 정보 조회 서비스(공공데이터포털){fetched ? `, ${fetched} 기준` : ''}.
        응급 상황에는 119, 문 여는 병원·약국 안내는 129 또는 응급의료포털 e-gen.or.kr.
      </footer>
    </div>
  );
}
