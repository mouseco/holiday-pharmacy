'use client';
import { useEffect, useRef } from 'react';
import { pinSvg } from './icons';
import { loadKakao } from '@/lib/kakao';
import type { LatLng } from '@/lib/geo';
import type { FacilityWithDistance } from '@/lib/filter';

type Props = {
  center: LatLng;
  origin: LatLng | null;
  items: FacilityWithDistance[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function FacilityMap({ center, origin, items, selectedId, onSelect, className = '' }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const originRef = useRef<any>(null);

  // 지도 생성
  useEffect(() => {
    let cancelled = false;
    let ro: ResizeObserver | undefined;
    loadKakao().then((kakao) => {
      if (cancelled || !el.current || mapRef.current) return;
      mapRef.current = new kakao.maps.Map(el.current, {
        center: new kakao.maps.LatLng(center.lat, center.lng),
        level: 5,
      });
      // 컨테이너 크기가 바뀌면(반응형 레이아웃) 지도 타일을 다시 배치
      ro = new ResizeObserver(() => {
        const c = mapRef.current?.getCenter();
        mapRef.current?.relayout();
        if (c) mapRef.current?.setCenter(c);
      });
      ro.observe(el.current);
    });
    return () => { cancelled = true; ro?.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 중심 이동
  useEffect(() => {
    loadKakao().then((kakao) => {
      mapRef.current?.setCenter(new kakao.maps.LatLng(center.lat, center.lng));
    });
  }, [center.lat, center.lng]);

  // 내 위치 마커
  useEffect(() => {
    loadKakao().then((kakao) => {
      originRef.current?.setMap(null);
      if (!origin || !mapRef.current) return;
      originRef.current = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(origin.lat, origin.lng),
        content: '<div style="width:18px;height:18px;border-radius:50%;background:#d9662a;border:3px solid #fff;box-shadow:0 0 0 3px rgba(217,102,42,.3)"></div>',
        zIndex: 10,
      });
      originRef.current.setMap(mapRef.current);
    });
  }, [origin]);

  // 기관 마커
  useEffect(() => {
    loadKakao().then((kakao) => {
      if (!mapRef.current) return;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = items.map((f) => {
        const selected = f.id === selectedId;
        const overlay = new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(f.lat, f.lng),
          yAnchor: 1,
          zIndex: selected ? 5 : 1,
          content: `<div data-id="${f.id}" title="${f.name.replace(/"/g, '')}" style="cursor:pointer">${pinSvg(f.type, selected)}</div>`,
        });
        overlay.setMap(mapRef.current);
        return overlay;
      });
    });
  }, [items, selectedId]);

  // CustomOverlay는 click 이벤트가 없어 컨테이너 위임으로 처리
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const handler = (e: Event) => {
      const id = (e.target as HTMLElement)?.closest?.('[data-id]')?.getAttribute('data-id');
      if (id) onSelect(id);
    };
    node.addEventListener('click', handler);
    return () => node.removeEventListener('click', handler);
  }, [onSelect]);

  return (
    <div className={`relative ${className}`}>
      <div ref={el} className="h-full w-full overflow-hidden rounded-2xl border border-line bg-ground" />
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex gap-3 rounded-lg bg-surface/95 px-3 py-1.5 text-[12px] font-medium shadow-sm">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-hospital" />병의원</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-pharmacy" />약국</span>
        {origin && <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-accent" />내 위치</span>}
      </div>
    </div>
  );
}
