import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

// Approximate centre of Wajir County
const DEFAULT_CENTER: [number, number] = [1.7488, 40.0573];

// Bounding box for Wajir County — clicks outside are rejected.
const WAJIR_BOUNDS: [[number, number], [number, number]] = [
  [0.5, 38.9], // south-west
  [4.0, 41.2], // north-east
];

// Coarse area lookup (Wajir only) — we never store coordinates, only the area name.
const AREAS: { name: string; lat: number; lng: number }[] = [
  { name: "Wajir Town", lat: 1.7488, lng: 40.0573 },
  { name: "Wajir East", lat: 1.7635, lng: 40.1305 },
  { name: "Wajir West", lat: 1.7283, lng: 39.9112 },
  { name: "Wajir North (Bute)", lat: 3.3936, lng: 40.2403 },
  { name: "Wajir South (Habaswein)", lat: 1.0125, lng: 39.4944 },
  { name: "Eldas", lat: 2.5360, lng: 39.5710 },
  { name: "Tarbaj", lat: 1.9156, lng: 40.5347 },
  { name: "Buna", lat: 2.7903, lng: 39.5106 },
  { name: "Griftu", lat: 1.7300, lng: 39.6533 },
];

function inWajir(lat: number, lng: number): boolean {
  const [[s, w], [n, e]] = WAJIR_BOUNDS;
  return lat >= s && lat <= n && lng >= w && lng <= e;
}

function nearestArea(lat: number, lng: number): string {
  let best = AREAS[0]; let bestD = Infinity;
  for (const a of AREAS) {
    const d = (a.lat - lat) ** 2 + (a.lng - lng) ** 2;
    if (d < bestD) { bestD = d; best = a; }
  }
  return best.name;
}

export function MapPicker({ value, onChange }: { value: string; onChange: (areaName: string) => void }) {
  const { t } = useI18n();
  const mapEl = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  const [outOfArea, setOutOfArea] = useState(false);

  useEffect(() => {
    let map: any; let marker: any; let cleanup = () => {};
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (!mapEl.current) return;
      const bounds = L.latLngBounds(WAJIR_BOUNDS[0], WAJIR_BOUNDS[1]);
      map = L.map(mapEl.current, {
        zoomControl: true,
        attributionControl: false,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0,
        minZoom: 7,
      }).setView(DEFAULT_CENTER, 8);
      map.setMaxBounds(bounds);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18 }).addTo(map);
      // Light outline of the allowed area.
      L.rectangle(bounds, { color: "#0ea5e9", weight: 1, fill: false, dashArray: "4 4" }).addTo(map);

      const place = (lat: number, lng: number) => {
        if (!inWajir(lat, lng)) { setOutOfArea(true); return; }
        setOutOfArea(false);
        if (marker) marker.setLatLng([lat, lng]); else marker = L.marker([lat, lng]).addTo(map);
        onChange(nearestArea(lat, lng));
      };
      map.on("click", (e: any) => place(e.latlng.lat, e.latlng.lng));
      setReady(true);
      cleanup = () => { map?.remove(); };
    })();
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      <div ref={mapEl} className="h-56 w-full rounded-xl overflow-hidden border border-border bg-secondary" aria-label={t.common.map} />
      <p className="text-xs text-muted-foreground">{t.report.mapHint}{!ready ? ` · ${t.common.loading}` : ""}</p>
      {outOfArea && (
        <p className="text-xs text-destructive">{t.report.outsideWajir}</p>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t.report.areaPlaceholder}
        className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-base focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 outline-none"
      />
    </div>
  );
}
