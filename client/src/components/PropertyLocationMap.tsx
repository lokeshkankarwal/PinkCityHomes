import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { formatMarkerPrice } from "./PropertyMap";

type Props = {
  latitude?: number | null;
  longitude?: number | null;
  title: string;
  price: number;
  locality: string;
  city?: string;
  address?: string;
  listingType?: string;
};

const JAIPUR_CENTER: [number, number] = [26.9124, 75.7873];

function createPriceMarkerIcon(price: number, listingType?: string) {
  const priceText = formatMarkerPrice(price, listingType);
  const isRent = listingType === "RENT";
  const bgClass = isRent ? "bg-emerald-700" : "bg-ink";

  return L.divIcon({
    className: "pinkcity-location-pill",
    html: `
      <div class="px-3 py-1.5 rounded-full text-xs font-serif font-bold text-sand ${bgClass} shadow-xl border-2 border-white ring-2 ring-pink-300 flex items-center gap-1.5 whitespace-nowrap transform -translate-x-1/2 -translate-y-1/2">
        <span class="inline-block w-2 h-2 rounded-full bg-pink-400 animate-pulse"></span>
        <span>${priceText}</span>
      </div>
    `,
    iconSize: [80, 32],
    iconAnchor: [40, 16],
  });
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15);
  }, [lat, lng, map]);
  return null;
}

export function PropertyLocationMap({
  latitude,
  longitude,
  title,
  price,
  locality,
  city = "Jaipur",
  address,
  listingType = "BUY",
}: Props) {
  const hasValidCoords =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    !(latitude === 0 && longitude === 0);

  const lat = hasValidCoords ? (latitude as number) : JAIPUR_CENTER[0];
  const lng = hasValidCoords ? (longitude as number) : JAIPUR_CENTER[1];

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className="rounded-3xl border border-ink/10 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-5 border-b border-ink/5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-bold text-ink">Property Location</h3>
          <p className="text-xs text-ink/70 mt-0.5">
            📍 <span className="capitalize font-semibold">{locality}</span>, {city}
          </p>
        </div>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl bg-sand/60 border border-ink/15 px-3 py-1.5 text-xs font-bold text-ink hover:bg-ink hover:text-sand transition shadow-sm"
        >
          <span>🧭</span>
          <span>Get Directions</span>
        </a>
      </div>

      {/* Map Container */}
      <div className="h-[280px] sm:h-[320px] w-full relative z-0">
        <MapContainer
          center={[lat, lng]}
          zoom={15}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            position={[lat, lng]}
            icon={createPriceMarkerIcon(price, listingType)}
          />
          <RecenterMap lat={lat} lng={lng} />
        </MapContainer>

        {/* Small floating badge */}
        <div className="absolute bottom-3 left-3 z-[400] bg-white/90 backdrop-blur-md rounded-xl px-3 py-1.5 text-[11px] font-semibold text-ink shadow border border-ink/10">
          📍 {locality}, Jaipur
        </div>
      </div>

      {/* Address Footer */}
      {address && (
        <div className="p-4 bg-sand/20 border-t border-ink/5 text-xs text-ink/80 flex items-start gap-2">
          <span className="text-sm leading-none mt-0.5">🏠</span>
          <div>
            <span className="font-semibold text-ink">Exact Address: </span>
            <span>{address}</span>
          </div>
        </div>
      )}
    </div>
  );
}
