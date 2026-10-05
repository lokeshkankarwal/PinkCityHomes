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
    <div className="space-y-6 pb-16 animate-in-page">
      <div className="stagger-0">
        <span className="page-eyebrow">Saved Shortlist</span>
        <h1 className="page-title mt-1">Saved Properties</h1>
        <p className="page-subtitle mt-2">
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
                className="stagger-1 overflow-hidden rounded-[1.25rem] border border-slate-200/70 bg-white shadow-card card-hover flex flex-col justify-between group"
              >
                <div>
                  <Link to={`/properties/${targetId}`} className="block relative aspect-[16/10] overflow-hidden bg-slate-100">
                    <img
                      src={imgSrc(image)}
                      alt=""
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="rounded-full bg-navy-950/80 text-white text-[10.5px] font-bold px-2.5 py-0.5 tracking-[0.06em] uppercase backdrop-blur-sm shadow-xs">
                        {p?.bhk ? `${p.bhk} BHK` : "Saved Home"}
                      </span>
                    </div>
                  </Link>

                  <div className="p-4 space-y-2">
                    <Link to={`/properties/${targetId}`}>
                      <h3 className="font-display text-[15px] font-bold text-ink line-clamp-1 hover:text-pink-600 transition-colors duration-200 tracking-[-0.01em] leading-snug">
                        {title}
                      </h3>
                    </Link>
                    {price != null && (
                      <p className="font-display text-xl font-bold text-ink tracking-[-0.02em]">{inr(price)}</p>
                    )}
                    {locality && (
                      <p className="text-[12px] text-slate-500 capitalize flex items-center gap-1 leading-snug">
                        <span>📍</span> {locality}, Jaipur
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100/80 p-3.5 flex justify-between items-center bg-slate-50/50">
                  <Link
                    to={`/properties/${targetId}`}
                    className="btn-text"
                  >
                    View Details →
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleRemove(fav.id, title)}
                    className="text-[12px] font-semibold text-rose-600 hover:text-rose-700 transition-colors duration-200 min-h-[36px] inline-flex items-center px-2 rounded-xl hover:bg-rose-50"
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
