import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { inr, imgSrc } from "../../lib/format";
import { EmptyState } from "../../components/EmptyState";
import { SkeletonCard } from "../../components/Skeleton";
import { toast } from "../../components/Toast";
import type { Property } from "../../types";

type FavItem = {
  id: string;
  propertyId?: string | null;
  property?: Property | null;
  title?: string;
  price?: number;
  locality?: string;
};

export default function FavouritesPage() {
  const [items, setItems] = useState<FavItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavs = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ count: number; results: FavItem[] }>("/favourites");
      setItems(res.results || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchFavs();
  }, []);

  const handleRemove = async (favId: string, title?: string) => {
    try {
      await api.del(`/favourites/${favId}`);
      setItems((prev) => prev.filter((i) => i.id !== favId));
      window.dispatchEvent(new Event("favourites-updated"));
      toast.success(`Removed "${title || "Property"}" from saved homes`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to remove favourite");
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-pink-600">Saved Shortlist</span>
        <h1 className="font-display text-3xl font-bold text-navy mt-1">Saved Properties</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Your shortlisted homes and luxury residences for quick comparison and site visits
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard count={3} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="❤️"
          title="Your shortlist is empty"
          body="Click the heart icon on any listing to save properties for future review and easy comparison."
          action={{
            label: "Explore Jaipur Properties",
            href: "/properties",
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((fav) => {
            const p = fav.property;
            const targetId = fav.property?.id || fav.propertyId || fav.id;
            const title = p?.title || "Saved Property";
            const price = p?.price;
            const locality = p?.locality;
            const image = p?.images?.[0]?.path;

            return (
              <article
                key={fav.id}
                className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <Link to={`/properties/${targetId}`} className="block relative aspect-[16/10] overflow-hidden bg-slate-100">
                    <img
                      src={imgSrc(image)}
                      alt=""
                      className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="rounded-full bg-navy-950/80 text-white text-[10px] font-bold px-2.5 py-0.5 tracking-wider uppercase backdrop-blur-sm">
                        {p?.bhk ? `${p.bhk} BHK` : "Saved Home"}
                      </span>
                    </div>
                  </Link>

                  <div className="p-4 space-y-1.5">
                    <Link to={`/properties/${targetId}`}>
                      <h3 className="font-display text-base font-bold text-navy line-clamp-1 hover:text-pink-600 transition">
                        {title}
                      </h3>
                    </Link>
                    {price != null && (
                      <p className="font-display text-xl font-bold text-navy">{inr(price)}</p>
                    )}
                    {locality && (
                      <p className="text-xs text-slate-500 capitalize flex items-center gap-1">
                        <span>📍</span> {locality}, Jaipur
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 p-3.5 flex justify-between items-center bg-slate-50/60">
                  <Link
                    to={`/properties/${targetId}`}
                    className="text-xs font-bold text-pink-600 hover:text-pink-700 transition"
                  >
                    View Details &rarr;
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleRemove(fav.id, title)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition"
                  >
                    Remove
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
