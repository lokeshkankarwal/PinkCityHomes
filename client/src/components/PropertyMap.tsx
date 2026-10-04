import { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { Link } from "react-router-dom";
import L from "leaflet";
import { inr, imgSrc } from "../lib/format";

export type MapProperty = {
  id: string;
  title: string;
  price: number;
  latitude: number;
  longitude: number;
  locality: string;
  city?: string;
  bhk: number;
  bathrooms?: number;
  carpetArea?: number;
  propertyType?: string;
  listingType?: "BUY" | "RENT" | string;
  primaryImage?: string;
  href?: string;
};

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

type Props = {
  properties: MapProperty[];
  selectedId?: string | null;
  hoveredId?: string | null;
  onSelectProperty?: (id: string | null) => void;
  onSearchArea?: (bounds: MapBounds) => void;
  listingType?: "BUY" | "RENT";
  className?: string;
};

// Jaipur center coordinates
const JAIPUR_CENTER: [number, number] = [26.9124, 75.7873];

export function formatMarkerPrice(price: number, listingType?: string): string {
  if (!price || price <= 0) return "₹–";
  if (listingType === "RENT") {
    if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
    return `₹${Math.round(price / 1000)}k`;
  }
  if (price >= 10000000) {
    const cr = (price / 10000000).toFixed(1).replace(/\.0$/, "");
    return `₹${cr}Cr`;
  }
  return `₹${Math.round(price / 100000)}L`;
}

function createPillIcon(text: string, isSelected: boolean, isHovered: boolean, isRent: boolean) {
  let styleClasses = isRent
    ? "bg-emerald-700 text-white hover:bg-emerald-600"
    : "bg-ink text-sand hover:bg-pink-700 hover:text-white";

  if (isHovered) {
    styleClasses = "bg-pink-600 text-white scale-110 ring-2 ring-pink-300 z-40";
  }
  if (isSelected) {
    styleClasses = "bg-pink-600 text-white scale-115 ring-4 ring-pink-200 shadow-xl z-50";
  }

  return L.divIcon({
    className: "pinkcity-pill-wrapper",
    html: `
      <div class="px-2.5 py-1 rounded-full text-xs font-bold font-serif shadow-md transition-all duration-150 cursor-pointer border border-white/40 ${styleClasses}">
        ${text}
      </div>
    `,
    iconSize: [60, 26],
    iconAnchor: [30, 13],
    popupAnchor: [0, -14],
  });
}

/**
 * Controller inside MapContainer to handle events & bounds
 */
function MapController({
  selectedProperty,
  onMapMoved,
}: {
  selectedProperty?: MapProperty;
  onMapMoved: () => void;
}) {
  const map = useMap();

  useMapEvents({
    dragend: () => onMapMoved(),
    zoomend: () => onMapMoved(),
  });

  useEffect(() => {
    map.invalidateSize();
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);

  useEffect(() => {
    if (selectedProperty && Number.isFinite(selectedProperty.latitude) && Number.isFinite(selectedProperty.longitude)) {
      map.flyTo([selectedProperty.latitude, selectedProperty.longitude], Math.max(map.getZoom(), 14), {
        duration: 0.8,
      });
    }
  }, [selectedProperty, map]);

  return null;
}

export function PropertyMap({
  properties,
  selectedId,
  hoveredId,
  onSelectProperty,
  onSearchArea,
  listingType = "BUY",
  className = "h-full w-full",
}: Props) {
  const [showSearchArea, setShowSearchArea] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  // Filter valid points
  const validProperties = useMemo(() => {
    return properties.filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
  }, [properties]);

  const selectedProperty = useMemo(() => {
    return validProperties.find((p) => p.id === selectedId);
  }, [validProperties, selectedId]);

  const handleMapMoved = () => {
    if (onSearchArea) {
      setShowSearchArea(true);
    }
  };

  const handleSearchThisAreaClick = () => {
    if (!mapRef.current || !onSearchArea) return;
    const bounds = mapRef.current.getBounds();
    setShowSearchArea(false);
    onSearchArea({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    });
  };

  const center: [number, number] = validProperties[0]
    ? [validProperties[0].latitude, validProperties[0].longitude]
    : JAIPUR_CENTER;

  return (
    <div className={`relative ${className} overflow-hidden rounded-3xl border border-ink/10 shadow-sm bg-sand/20`}>
      {/* Floating "Search this area" button */}
      {showSearchArea && onSearchArea && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] animate-bounce">
          <button
            type="button"
            onClick={handleSearchThisAreaClick}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-ink shadow-2xl ring-1 ring-ink/10 hover:bg-pink-600 hover:text-white transition duration-150"
          >
            <span>🔍</span>
            <span>Search this area</span>
          </button>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] hidden sm:flex items-center gap-3 rounded-full bg-white/90 backdrop-blur-md px-3.5 py-1.5 text-[11px] font-semibold text-ink shadow-md border border-ink/10">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-600 inline-block"></span>
          <span>{listingType === "RENT" ? "Rentals" : "Buy Homes"}</span>
        </div>
        <span className="text-ink/30">•</span>
        <span className="text-ink/60">{validProperties.length} on map</span>
      </div>

      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom
        className="h-full w-full"
        ref={(m) => {
          if (m) mapRef.current = m;
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController selectedProperty={selectedProperty} onMapMoved={handleMapMoved} />

        {validProperties.map((p) => {
          const isSelected = p.id === selectedId;
          const isHovered = p.id === hoveredId;
          const isRent = (p.listingType || listingType) === "RENT";
          const priceText = formatMarkerPrice(p.price, p.listingType || listingType);
          const icon = createPillIcon(priceText, isSelected, isHovered, isRent);

          return (
            <Marker
              key={p.id}
              position={[p.latitude, p.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectProperty?.(p.id),
              }}
            >
              <Popup className="pinkcity-preview-popup" closeButton={false}>
                <div className="w-64 overflow-hidden rounded-2xl bg-white shadow-xl">
                  <div className="relative h-32 w-full bg-sand/40">
                    <img
                      src={imgSrc(p.primaryImage)}
                      alt={p.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <span className="absolute top-2 left-2 rounded-full bg-ink/85 text-sand text-[10px] font-bold px-2 py-0.5 tracking-wider backdrop-blur-sm">
                      {isRent ? "FOR RENT" : "FOR SALE"}
                    </span>
                  </div>
                  <div className="p-3 space-y-1.5">
                    <p className="font-serif text-xl font-bold text-ink">
                      {inr(p.price)}
                      {isRent && <span className="text-xs font-normal text-ink/60"> / mo</span>}
                    </p>
                    <p className="text-xs font-bold text-ink line-clamp-1">
                      {p.bhk} BHK {p.propertyType ? p.propertyType.replace(/_/g, " ").toLowerCase() : "Home"}
                    </p>
                    <p className="text-[11px] text-ink/70 capitalize">📍 {p.locality}, Jaipur</p>

                    <div className="flex items-center gap-2 text-[11px] text-ink/60 border-t border-ink/5 pt-1.5">
                      <span>{p.bhk} Beds</span>
                      <span>•</span>
                      <span>{p.bathrooms ?? 1} Baths</span>
                      {p.carpetArea ? (
                        <>
                          <span>•</span>
                          <span>{p.carpetArea} sqft</span>
                        </>
                      ) : null}
                    </div>

                    <Link
                      to={p.href ?? `/properties/${p.id}`}
                      className="mt-2 block w-full text-center rounded-xl bg-pink-600 py-2 text-xs font-bold text-white hover:bg-pink-700 transition shadow"
                    >
                      View Property &rarr;
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
