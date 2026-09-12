'use client';
import { useEffect, useRef } from 'react';
import { loadKakao } from '@/lib/kakao';
import type { LatLng } from '@/lib/geo';
import type { FacilityWithDistance } from '@/lib/filter';

type Props = {
  center: LatLng;
  origin: LatLng | null;
  items: FacilityWithDistance[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function FacilityMap({ center, origin, items, selectedId, onSelect }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const originRef = useRef<any>(null);

  // 지도 생성
  useEffect(() => {
    let cancelled = false;
    loadKakao().then((kakao) => {
      if (cancelled || !el.current || mapRef.current) return;
      mapRef.current = new kakao.maps.Map(el.current, {
        center: new kakao.maps.LatLng(center.lat, center.lng),
        level: 5,
      });
    });
    return () => { cancelled = true; };
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
        content: '<div style="width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 2px #2563eb"></div>',
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
        const color = f.type === 'pharmacy' ? '#16a34a' : '#dc2626';
        const size = selected ? 22 : 14;
        const overlay = new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(f.lat, f.lng),
          yAnchor: 1,
          zIndex: selected ? 5 : 1,
          content: `<div data-id="${f.id}" title="${f.name}" style="cursor:pointer;width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
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

  return <div ref={el} className="h-64 w-full rounded-lg border sm:h-80" />;
}
