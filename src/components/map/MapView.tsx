'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { createClient } from '@/lib/supabase/client';
import { LEVEL_LABELS, type PlayerLevel } from '@/types';
import { Loader2, Locate, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClubMarker {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  rating: number;
  total_reviews: number;
}

interface PlayerMarker {
  id: string;
  full_name: string;
  username: string;
  level: PlayerLevel;
  latitude: number;
  longitude: number;
  city: string | null;
}

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showClubs, setShowClubs] = useState(true);
  const [showPlayers, setShowPlayers] = useState(true);
  const [clubs, setClubs] = useState<ClubMarker[]>([]);
  const [players, setPlayers] = useState<PlayerMarker[]>([]);
  const supabase = createClient();

  // Get user location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Default to Paris
          setUserLocation({ lat: 48.8566, lng: 2.3522 });
        },
      );
    } else {
      setUserLocation({ lat: 48.8566, lng: 2.3522 });
    }
  }, []);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      const { data: clubsData } = await supabase
        .from('clubs')
        .select('id, name, address, city, latitude, longitude, rating, total_reviews')
        .eq('status', 'active');

      setClubs(clubsData ?? []);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: playersData } = await supabase
          .from('profiles')
          .select('id, full_name, username, level, latitude, longitude, city')
          .eq('is_onboarded', true)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .neq('id', user.id)
          .limit(100);

        setPlayers((playersData ?? []) as PlayerMarker[]);
      }
    }

    fetchData();
  }, [supabase]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !userLocation || map.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setLoading(false);
      return;
    }

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [userLocation.lng, userLocation.lat],
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    // User location marker
    new mapboxgl.Marker({ color: '#3EAF4B' })
      .setLngLat([userLocation.lng, userLocation.lat])
      .setPopup(new mapboxgl.Popup().setHTML('<p class="font-bold text-sm">📍 Ma position</p>'))
      .addTo(map.current);

    map.current.on('load', () => setLoading(false));
  }, [userLocation]);

  // Update markers
  const updateMarkers = useCallback(() => {
    if (!map.current) return;

    // Remove existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add club markers
    if (showClubs) {
      clubs.forEach((club) => {
        const el = document.createElement('div');
        el.className = 'club-marker';
        el.innerHTML = `
          <div style="
            background: #0B1A2E;
            color: white;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
          ">🏟️</div>
        `;

        const stars = club.rating > 0
          ? `<p style="font-size:12px;color:#f59e0b;">${'⭐'.repeat(Math.round(club.rating))} (${club.total_reviews})</p>`
          : '';

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="font-family:system-ui;padding:4px;">
            <p style="font-weight:700;font-size:14px;margin:0 0 4px;">${club.name}</p>
            <p style="font-size:12px;color:#666;margin:0 0 2px;">${club.address}</p>
            <p style="font-size:12px;color:#666;margin:0 0 4px;">${club.city}</p>
            ${stars}
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([club.longitude, club.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(marker);
      });
    }

    // Add player markers
    if (showPlayers) {
      players.forEach((player) => {
        const el = document.createElement('div');
        el.className = 'player-marker';
        el.innerHTML = `
          <div style="
            background: #3EAF4B;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            cursor: pointer;
          ">${player.full_name.charAt(0).toUpperCase()}</div>
        `;

        const levelLabel = LEVEL_LABELS[player.level] ?? player.level;
        const popup = new mapboxgl.Popup({ offset: 20 }).setHTML(`
          <div style="font-family:system-ui;padding:4px;">
            <p style="font-weight:700;font-size:14px;margin:0 0 2px;">${player.full_name}</p>
            <p style="font-size:12px;color:#666;margin:0;">@${player.username}</p>
            <p style="font-size:12px;margin:4px 0 0;">
              <span style="background:#3EAF4B22;color:#3EAF4B;padding:2px 6px;border-radius:99px;font-size:11px;font-weight:600;">
                ${levelLabel}
              </span>
            </p>
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([player.longitude, player.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(marker);
      });
    }
  }, [clubs, players, showClubs, showPlayers]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  // Recenter on user
  function recenter() {
    if (map.current && userLocation) {
      map.current.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 13 });
    }
  }

  return (
    <div className="relative h-full w-full">
      {/* Map container */}
      <div ref={mapContainer} className="h-full w-full rounded-xl" />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/80">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {/* Controls */}
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
        {/* Recenter */}
        <Button
          size="icon"
          variant="secondary"
          className="h-9 w-9 rounded-full shadow-md"
          onClick={recenter}
        >
          <Locate className="h-4 w-4" />
        </Button>

        {/* Layer toggle */}
        <div className="flex flex-col gap-1 rounded-xl bg-background/95 p-2 shadow-md backdrop-blur">
          <button
            type="button"
            onClick={() => setShowClubs(!showClubs)}
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors ${
              showClubs ? 'bg-navy text-white' : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            <span>🏟️</span> Clubs
          </button>
          <button
            type="button"
            onClick={() => setShowPlayers(!showPlayers)}
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors ${
              showPlayers ? 'bg-green-padel text-white' : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            <span>🎾</span> Joueurs
          </button>
        </div>
      </div>

      {/* Stats overlay */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between rounded-xl bg-background/95 px-3 py-2 shadow-md backdrop-blur">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            {clubs.length} clubs
          </span>
          <span>·</span>
          <span>{players.length} joueurs</span>
        </div>
      </div>
    </div>
  );
}
