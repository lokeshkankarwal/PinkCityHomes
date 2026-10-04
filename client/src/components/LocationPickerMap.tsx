import { useState, useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

type Props = {
  latitude: number;
  longitude: number;
  onChange: (coords: { latitude: number; longitude: number }) => void;
  isConfirmed: boolean;
  onConfirm: () => void;
  locality?: string;
};

const JAIPUR_CENTER: [number, number] = [26.9124, 75.7873];

const pickerIcon = L.divIcon({
  className: "pinkcity-picker-marker",
  html: `
    <div class="relative flex items-center justify-center">
      <div class="w-8 h-8 rounded-full bg-pink-600 border-3 border-white shadow-xl flex items-center justify-center text-white text-xs font-bold ring-4 ring-pink-300 transform -translate-y-4">
        📍
      </div>
      <div class="absolute -bottom-1 w-2.5 h-1 bg-ink/40 rounded-full blur-[1px]"></div>
    </div>
  `,
  iconSize: [32, 40],
  iconAnchor: [16, 32],
});

function MapEventsHandler({
  onLocationChange,
}: {
  onLocationChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onLocationChange(Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5)));
    },
  });
  return null;
}

function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom() || 15);
  }, [lat, lng, map]);
  return null;
}

export function LocationPickerMap({
  latitude,
  longitude,
  onChange,
  isConfirmed,
  onConfirm,
  locality,
}: Props) {
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const lat = Number.isFinite(latitude) && latitude !== 0 ? latitude : JAIPUR_CENTER[0];
  const lng = Number.isFinite(longitude) && longitude !== 0 ? longitude : JAIPUR_CENTER[1];

  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const pos = marker.getLatLng();
          onChange({
            latitude: Number(pos.lat.toFixed(5)),
            longitude: Number(pos.lng.toFixed(5)),
          });
        }
      },
    }),
    [onChange],
  );

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        const userLat = Number(pos.coords.latitude.toFixed(5));
        const userLng = Number(pos.coords.longitude.toFixed(5));
        onChange({ latitude: userLat, longitude: userLng });
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === 1) {
          setGeoError("Location permission denied. You can click or drag on the map manually.");
        } else if (err.code === 2) {
          setGeoError("Location unavailable. Please select your position on the map.");
        } else {
          setGeoError("Location request timed out. Please try again or tap the map.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  return (
    <div className="space-y-3">
      {/* Geolocation Button & Helper */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={geoLoading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-pink-50 border border-pink-200 px-3.5 py-2 text-xs font-bold text-pink-700 hover:bg-pink-100 transition shadow-sm disabled:opacity-50"
        >
          <span>🎯</span>
          <span>{geoLoading ? "Detecting location..." : "Use My Current Location"}</span>
        </button>

        <p className="text-[11px] text-ink/60">
          💡 Click anywhere on the map or drag the pin to set the exact spot
        </p>
      </div>

      {geoError && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
          {geoError}
        </div>
      )}

      {/* Interactive Map */}
      <div className="h-[280px] w-full rounded-2xl overflow-hidden border border-ink/15 relative z-0 shadow-inner">
        <MapContainer
          center={[lat, lng]}
          zoom={15}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            position={[lat, lng]}
            draggable={true}
            eventHandlers={eventHandlers}
            ref={markerRef}
            icon={pickerIcon}
          />
          <MapEventsHandler
            onLocationChange={(newLat, newLng) =>
              onChange({ latitude: newLat, longitude: newLng })
            }
          />
          <MapUpdater lat={lat} lng={lng} />
        </MapContainer>
      </div>

      {/* Confirmation Bar */}
      <div className="rounded-2xl bg-sand/30 border border-ink/10 p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📍</span>
          <div>
            <p className="text-xs font-bold text-ink">
              {locality ? `Target: ${locality}, Jaipur` : "Pin placed on Jaipur map"}
            </p>
            <p className="text-[11px] text-ink/60">
              {isConfirmed ? "Location verified and ready to save" : "Please confirm this position is accurate"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onConfirm}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 shadow ${
            isConfirmed
              ? "bg-emerald-700 text-white"
              : "bg-ink text-sand hover:bg-pink-700 hover:text-white"
          }`}
        >
          <span>{isConfirmed ? "✓" : "📍"}</span>
          <span>{isConfirmed ? "Location Confirmed ✓" : "Confirm Location"}</span>
        </button>
      </div>
    </div>
  );
}
