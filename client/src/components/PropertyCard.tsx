import { useState } from "react";
import { Link } from "react-router-dom";
import { imgSrc, inr } from "../lib/format";

type Props = {
  id: string;
  title: string;
  price?: number;
  locality?: string;
  city?: string;
  bhk?: number;
  bathrooms?: number;
  area?: number;
  propertyType?: string;
  image?: string;
  href?: string;
  projectName?: string;
  listingType?: string;
  onFav?: () => void;
  isFav?: boolean;
  onCart?: () => void;
  sold?: boolean;
  isSelected?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export function PropertyCard({
  id,
  title,
  price,
  locality,
  city = "Jaipur",
  bhk,
  bathrooms,
  area,
  propertyType,
  image,
  href,
  projectName,
  listingType = "BUY",
  onFav,
  isFav,
  onCart,
  sold,
  isSelected,
  onMouseEnter,
  onMouseLeave,
}: Props) {
  const [favAnimating, setFavAnimating] = useState(false);
  const isRent = listingType === "RENT";
  const propertyUrl = href ?? `/properties/${id}`;

  const handleFavClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFav) {
      setFavAnimating(true);
      setTimeout(() => setFavAnimating(false), 400);
      onFav();
    }
  };

  return (
    <article
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white border transition-all duration-300 ${
        isSelected
          ? "border-pink-500 ring-2 ring-pink-400/40 shadow-card-hover scale-[1.01]"
          : "border-slate-200/80 shadow-card hover:shadow-card-hover hover:border-slate-300 hover:-translate-y-1"
      }`}
    >
      <div>
        {/* Image Frame */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
          <Link to={propertyUrl} className="block h-full w-full">
            <img
              src={imgSrc(image)}
              alt={title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </Link>

          {/* Gradient protection overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-navy-950/20" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 pointer-events-none">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase shadow-sm ${
                isRent
                  ? "bg-emerald-600 text-white"
                  : "bg-navy-900/90 text-white backdrop-blur-sm"
              }`}
            >
              {isRent ? "For Rent" : "For Sale"}
            </span>

            <span className="rounded-full bg-white/95 text-navy-900 text-[10px] font-bold px-2 py-0.5 shadow-sm backdrop-blur-sm flex items-center gap-1">
              <svg className="w-3 h-3 text-emerald-600 inline" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified
            </span>

            {projectName && (
              <span className="rounded-full bg-navy-900/80 text-white text-[10px] font-semibold px-2.5 py-0.5 backdrop-blur-sm shadow-sm truncate max-w-[130px]">
                {projectName}
              </span>
            )}
          </div>

          {/* Favorite Button */}
          {onFav && (
            <button
              type="button"
              onClick={handleFavClick}
              title={isFav ? "Saved to favourites" : "Save to favourites"}
              className={`absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full shadow-md backdrop-blur-md transition-all active:scale-90 ${
                favAnimating ? "animate-heartbeat" : ""
              } ${
                isFav
                  ? "bg-pink-600 text-white"
                  : "bg-white/90 text-slate-600 hover:bg-white hover:text-pink-600"
              }`}
              aria-label="Save property"
            >
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${isFav ? "scale-110" : ""}`}
                fill={isFav ? "currentColor" : "none"}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={isFav ? 0 : 2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          )}

          {/* Sold Overlay */}
          {sold && (
            <div className="absolute inset-0 bg-navy-950/70 flex items-center justify-center backdrop-blur-[2px]">
              <span className="rounded-2xl bg-rose-600 px-4 py-1.5 font-display text-sm font-bold text-white shadow-lg tracking-wider uppercase">
                SOLD
              </span>
            </div>
          )}

          {/* Price overlay on image bottom */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between text-white pointer-events-none">
            <p className="font-display text-2xl font-bold tracking-tight drop-shadow-md">
              {sold ? "SOLD" : inr(price)}
              {isRent && !sold && <span className="text-xs font-normal text-white/90"> / mo</span>}
            </p>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 space-y-2">
          {/* Title & Type */}
          <div>
            <Link to={propertyUrl} className="group-hover:text-pink-600 transition">
              <h3 className="font-display text-base font-bold text-navy line-clamp-1">
                {bhk != null && bhk > 0 ? `${bhk} BHK ` : ""}
                {propertyType ? propertyType.replace(/_/g, " ").toLowerCase() : "Property"}
                {title ? ` · ${title}` : ""}
              </h3>
            </Link>
            <p className="text-xs text-slate-500 capitalize mt-1 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{locality ? `${locality}, ${city}` : `${city}, Rajasthan`}</span>
            </p>
          </div>

          {/* Specs */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600 font-medium">
            {bhk != null && (
              <span className="flex items-center gap-1">
                <span className="text-slate-400">🛏</span> {bhk} Beds
              </span>
            )}
            {bathrooms != null && (
              <span className="flex items-center gap-1">
                <span className="text-slate-400">🚿</span> {bathrooms} Baths
              </span>
            )}
            {area != null && area > 0 && (
              <span className="flex items-center gap-1">
                <span className="text-slate-400">📐</span> {area.toLocaleString("en-IN")} sq.ft.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="px-4 pb-4 pt-1 flex items-center justify-between gap-2 border-t border-slate-50">
        <Link
          to={propertyUrl}
          className="flex-1 rounded-2xl bg-slate-100/90 py-2.5 text-center text-xs font-semibold text-navy hover:bg-navy hover:text-white transition active:scale-95"
        >
          View Details &rarr;
        </Link>

        {onCart && !sold && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCart();
            }}
            className="rounded-2xl bg-navy px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-pink-600 transition active:scale-95"
            title="Reserve / Add to cart"
          >
            Add to Cart
          </button>
        )}
      </div>
    </article>
  );
}
