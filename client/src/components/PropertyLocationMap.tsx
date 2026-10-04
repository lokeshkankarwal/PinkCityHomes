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
  const bgClass = isRent ? "bg-emerald-600" : "bg-navy";

  return L.divIcon({
    className: "pinkcity-location-pill",
    html: `
      <div style="transform: translate(-50%, -50%);" class="px-3.5 py-1.5 rounded-full text-xs font-sans font-bold text-white ${bgClass} shadow-xl border-2 border-white ring-2 ring-pink-400/50 flex items-center gap-1.5 whitespace-nowrap">
        <span class="inline-block w-2 h-2 rounded-full bg-pink-400 animate-pulse"></span>
        <span>${priceText}</span>
      </div>
    `,
    iconSize: [100, 36],
    iconAnchor: [50, 18],
  });
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15);
    map.invalidateSize();
  }, [lat, lng, map]);
  return null;
}

function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    // Invalidate size immediately, and after brief timeouts for layout completion
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 400);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener("resize", handleResize);

    const container = map.getContainer();
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && container) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(container);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", handleResize);
      resizeObserver?.disconnect();
    };
  }, [map]);
  return null;
}

export function PropertyLocationMap({
  latitude,
  longitude,
  title: _title,
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
    <div className="rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-card">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold text-navy">Property Location</h3>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-pink-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="capitalize font-semibold text-slate-700">{locality}</span>, {city}
          </p>
        </div>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-2xl bg-navy text-white px-4 py-2 text-xs font-semibold hover:bg-navy-800 transition shadow-sm active:scale-95"
        >
          <svg className="w-3.5 h-3.5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Get Directions</span>
        </a>
      </div>

      {/* Map Container — Stable responsive dimensions, strictly overflow hidden, non-participating tiles */}
      <div className="h-[290px] sm:h-[360px] lg:h-[400px] w-full relative overflow-hidden z-0 bg-slate-100">
        <MapContainer
          key={`${lat}-${lng}`}
          center={[lat, lng]}
          zoom={15}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <Marker
            position={[lat, lng]}
            icon={createPriceMarkerIcon(price, listingType)}
          />
          <RecenterMap lat={lat} lng={lng} />
          <MapResizeHandler />
        </MapContainer>

        {/* Small floating badge */}
        <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md rounded-2xl px-3.5 py-1.5 text-[11px] font-bold text-navy shadow-md border border-slate-200/80 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-pink-600 animate-ping" />
          <span>{locality}, Jaipur</span>
        </div>
      </div>

      {/* Address Footer */}
      {address && (
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 text-xs text-slate-700 flex items-start gap-2.5">
          <svg className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <div>
            <span className="font-semibold text-navy">Exact Address: </span>
            <span className="text-slate-600">{address}</span>
          </div>
        </div>
      )}
    </div>
  );
}
