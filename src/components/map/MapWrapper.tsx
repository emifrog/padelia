'use client';

import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed text-muted-foreground">
      Chargement de la carte...
    </div>
  ),
});

export default function MapWrapper() {
  return <MapView />;
}
