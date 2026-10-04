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
  const isRent = listingType === "RENT";
  const propertyUrl = href ?? `/properties/${id}`;

  return (
    <article
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`group relative overflow-hidden rounded-3xl border bg-white shadow-sm transition-all duration-200 flex flex-col justify-between ${
        isSelected
          ? "border-pink-600 ring-2 ring-pink-300 shadow-md scale-[1.01]"
          : "border-ink/10 hover:border-pink-300 hover:shadow-lg"
      }`}
    >
      <div>
        {/* Image & Badges */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-sand/40">
          <Link to={propertyUrl} className="block h-full w-full">
            <img
              src={imgSrc(image)}
              alt={title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase shadow-sm ${
                isRent ? "bg-emerald-700 text-white" : "bg-ink text-sand"
              }`}
            >
              {isRent ? "Rent" : "Buy"}
            </span>

            <span className="rounded-full bg-white/90 text-ink text-[10px] font-bold px-2 py-0.5 shadow-sm border border-ink/10">
              ✓ Verified
            </span>

            {projectName && (
              <span className="rounded-full bg-ink/80 text-sand text-[10px] font-bold px-2.5 py-0.5 tracking-wider backdrop-blur-sm shadow">
                🏢 {projectName}
              </span>
            )}
          </div>

          {/* Favorite Button */}
          {onFav && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFav();
              }}
              title={isFav ? "Saved to favourites" : "Save to favourites"}
              className={`absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md shadow-md transition ${
                isFav
                  ? "bg-pink-600 text-white"
                  : "bg-white/80 text-ink/70 hover:bg-white hover:text-pink-600"
              }`}
            >
              <span className="text-sm">{isFav ? "♥" : "♡"}</span>
            </button>
          )}

          {/* Sold Overlay */}
          {sold && (
            <div className="absolute inset-0 bg-ink/60 flex items-center justify-center backdrop-blur-[2px]">
              <span className="rounded-xl bg-red-600 px-4 py-1.5 font-serif text-sm font-bold text-white shadow-lg tracking-wider">
                SOLD
              </span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-2">
          {/* Price */}
          <div className="flex items-baseline justify-between">
            <p className="font-serif text-2xl font-bold text-ink">
              {sold ? "SOLD" : inr(price)}
              {isRent && !sold && <span className="text-xs font-normal text-ink/60"> / mo</span>}
            </p>
          </div>

          {/* Title & Type */}
          <div>
            <Link to={propertyUrl} className="hover:text-pink-700 transition">
              <h3 className="font-serif text-base font-bold text-ink line-clamp-1">
                {bhk != null && bhk > 0 ? `${bhk} BHK ` : ""}
                {propertyType ? propertyType.replace(/_/g, " ").toLowerCase() : "Property"}
                {title ? ` · ${title}` : ""}
              </h3>
            </Link>
            <p className="text-xs text-ink/60 capitalize mt-0.5">
              📍 {locality ? `${locality}, ${city}` : `${city}, Rajasthan`}
            </p>
          </div>

          {/* Specs */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-ink/5 text-xs text-ink/70">
            {bhk != null && (
              <span className="font-medium">{bhk} Beds</span>
            )}
            {bathrooms != null && (
              <>
                <span>•</span>
                <span className="font-medium">{bathrooms} Baths</span>
              </>
            )}
            {area != null && area > 0 && (
              <>
                <span>•</span>
                <span className="font-medium">{area.toLocaleString("en-IN")} sq.ft.</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="px-4 pb-4 pt-1 flex items-center justify-between gap-2">
        <Link
          to={propertyUrl}
          className="flex-1 rounded-xl bg-sand/50 border border-ink/10 py-2 text-center text-xs font-bold text-ink hover:bg-ink hover:text-sand transition"
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
            className="rounded-xl bg-ink px-3 py-2 text-xs font-bold text-sand hover:bg-pink-700 transition"
            title="Add to purchase cart"
          >
            Add to Cart
          </button>
        )}
      </div>
    </article>
  );
}
