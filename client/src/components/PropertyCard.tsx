import { Link } from "react-router-dom";
import { imgSrc, inr } from "../lib/format";

type Props = {
  id: string;
  title: string;
  price?: number;
  locality?: string;
  bhk?: number;
  area?: number;
  image?: string;
  href?: string;
  projectName?: string;
  listingType?: string;
  onFav?: () => void;
  onCart?: () => void;
  sold?: boolean;
};

export function PropertyCard(p: Props) {
  return (
    <article className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm flex flex-col justify-between">
      <Link to={p.href ?? `/properties/${p.id}`} className="block">
        <div className="relative">
          <img src={imgSrc(p.image)} alt="" className="h-44 w-full object-cover" />
          {p.projectName && (
            <span className="absolute top-3 left-3 rounded-full bg-ink/80 text-sand text-[10px] font-bold px-2.5 py-0.5 tracking-wider backdrop-blur-sm shadow">
              🏢 {p.projectName}
            </span>
          )}
        </div>
        <div className="p-4 space-y-1">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-moss font-semibold">
            <span>{p.bhk != null ? `${p.bhk} BHK` : "Property"}</span>
            {p.listingType && (
              <span className="text-[10px] font-bold text-ink/60 bg-sand/60 px-1.5 py-0.5 rounded">
                {p.listingType === "RENT" ? "FOR RENT" : "FOR SALE"}
              </span>
            )}
          </div>
          <h3 className="font-serif text-lg font-bold line-clamp-1">{p.title}</h3>
          <p className="text-brass font-serif font-bold text-xl">{p.sold ? "SOLD" : inr(p.price)}</p>
          <p className="text-xs text-ink/70">
            {p.locality}
            {p.area ? ` · ${p.area} sq ft` : ""}
          </p>
        </div>
      </Link>
      {(p.onFav || p.onCart) && (
        <div className="flex gap-2 border-t border-ink/5 px-4 py-3 text-sm">
          {p.onFav && (
            <button type="button" onClick={p.onFav} className="rounded-full border px-3 py-1">
              ♥ Save
            </button>
          )}
          {p.onCart && !p.sold && (
            <button type="button" onClick={p.onCart} className="rounded-full bg-ink px-3 py-1 text-sand">
              Add to cart
            </button>
          )}
        </div>
      )}
    </article>
  );
}
