import MapWrapper from '@/components/map/MapWrapper';

export const metadata = { title: 'Carte' };

export default function CartePage() {
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-bold">Carte</h1>
        <p className="text-sm text-muted-foreground">
          Trouve des clubs et joueurs autour de toi
        </p>
      </div>
      <div className="h-[calc(100dvh-12rem)] overflow-hidden rounded-xl border">
        <MapWrapper />
      </div>
    </div>
  );
}
