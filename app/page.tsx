'use client';
import { useCallback, useMemo, useState } from 'react';
import FacilityList from '@/components/FacilityList';
import FacilityMap from '@/components/FacilityMap';
import FilterBar from '@/components/FilterBar';
import LocationBar from '@/components/LocationBar';
import { filterAndSort, uniqueDates, type TypeFilter } from '@/lib/filter';
import type { LatLng } from '@/lib/geo';
import { coordToSido } from '@/lib/kakao';
import { SIDO_LIST, toApiSido } from '@/lib/sido';
import type { Facility } from '@/lib/types';

type Data = { sido: string; fetchedAt: string; items: Facility[] };

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
      setError(e instanceof Error ? e.message : '불러오기 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  const locate = useCallback(() => {
    if (!navigator.geolocation) { setError('이 브라우저는 위치 정보를 지원하지 않습니다. 시도를 직접 선택하세요.'); return; }
    setLocating(true); setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setOrigin(p);
        const region = await coordToSido(p.lat, p.lng);
        const s = region ? toApiSido(region) : null;
        setLocating(false);
        if (s) { setSido(s); load(s); } else setError('현재 위치의 시도를 알 수 없습니다. 시도를 직접 선택하세요.');
      },
      () => { setLocating(false); setError('위치 권한이 거부되었습니다. 시도를 직접 선택하세요.'); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [load]);

  const selectSido = useCallback((s: string) => { setOrigin(null); setSido(s); load(s); }, [load]);

  const dates = useMemo(() => (data ? uniqueDates(data.items) : []), [data]);
  const items = useMemo(
    () => (data ? filterAndSort(data.items, { origin: center, radiusKm: radius, type, date }) : []),
    [data, center, radius, type, date],
  );

  const onSelect = useCallback((id: string) => {
    setSelectedId(id);
    document.getElementById(`fac-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  const emptyMessage = !sido
    ? '내 위치로 찾기를 누르거나 시도를 선택하세요.'
    : data && data.items.length === 0
      ? '해당 지역의 명절 진료 정보가 아직 등록되지 않았습니다. 응급의료포털(e-gen.or.kr)을 확인하세요.'
      : '반경 안에 결과가 없습니다. 반경을 넓혀보세요.';

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <header>
        <h1 className="text-2xl font-bold">추석 연휴 문 여는 병원·약국</h1>
        <p className="text-sm text-gray-600">
          내 위치 주변의 명절 비상진료기관을 거리순으로 보여줍니다.
          {data && <> · 기준 {new Date(data.fetchedAt).toLocaleString('ko-KR')}</>}
        </p>
      </header>

      <LocationBar sido={sido} locating={locating} onLocate={locate} onSelectSido={selectSido} />
      <FilterBar type={type} onType={setType} date={date} dates={dates} onDate={setDate} radius={radius} onRadius={setRadius} />

      {error && (
        <div className="flex items-center justify-between rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          <span>{error}</span>
          {sido && <button type="button" onClick={() => load(sido)} className="underline">다시 시도</button>}
        </div>
      )}

      <FacilityMap center={center} origin={origin} items={items} selectedId={selectedId} onSelect={onSelect} />

      {loading ? (
        <p className="text-center text-sm text-gray-600">불러오는 중…</p>
      ) : (
        <>
          {data && <p className="text-sm text-gray-600">{items.length}곳 표시 (전체 {data.items.length}곳)</p>}
          <FacilityList items={items} selectedId={selectedId} onSelect={onSelect} emptyMessage={emptyMessage} />
        </>
      )}

      <footer className="border-t pt-4 text-xs text-gray-500">
        출처: 국립중앙의료원 전국 명절 비상 진료기관 정보 조회 서비스(공공데이터포털) · 응급의료포털 E-Gen.
        진료 시간은 변경될 수 있으니 방문 전 전화로 확인하세요.
      </footer>
    </main>
  );
}
