import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api/client";
import { inr, imgSrc } from "../../lib/format";
import type { Property } from "../../types";

type SellerPublicData = {
  seller: {
    id: string;
    userId: string;
    name: string;
    companyName?: string | null;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
    status: string;
    memberSince: string;
    totalProperties: number;
  };
  properties: Property[];
  stats: {
    total: number;
    buyCount: number;
    rentCount: number;
  };
};

export default function SellerProfilePage() {
  const { sellerId } = useParams<{ sellerId: string }>();

  const [data, setData] = useState<SellerPublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"ALL" | "BUY" | "RENT">("ALL");

  useEffect(() => {
    if (!sellerId) return;
    setLoading(true);
    setError(null);

    api
      .get<SellerPublicData>(`/sellers/${sellerId}`)
      .then((res) => {
        setData(res);
      })
      .catch((err: Error) => {
        setError(err.message || "Seller profile not found or currently unavailable.");
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [sellerId]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-600 border-r-transparent"></div>
        <p className="mt-4 text-xs font-semibold text-ink/60">Loading seller profile &amp; property portfolio...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg py-20 px-4 text-center">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 space-y-4">
          <div className="text-4xl">🏢</div>
          <h2 className="font-serif text-2xl font-bold text-red-900">Seller Profile Unavailable</h2>
          <p className="text-xs text-red-700 leading-relaxed">
            {error || "This seller profile is not active or does not exist."}
          </p>
          <Link
            to="/properties"
            className="inline-block rounded-xl bg-ink px-5 py-2.5 text-xs font-semibold text-sand shadow hover:bg-ink/90 transition"
          >
            Explore Jaipur Properties &rarr;
          </Link>
        </div>
      </div>
    );
  }

  const { seller, properties, stats } = data;

  const filteredProperties = properties.filter((p) => {
    if (filterType === "ALL") return true;
    return p.listingType === filterType;
  });

  return (
    <div className="space-y-8 pb-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-ink/60">
        <Link to="/properties" className="hover:text-ink font-semibold">
          Properties
        </Link>
        <span>/</span>
        <span>Verified Sellers</span>
        <span>/</span>
        <span className="text-ink font-bold">{seller.companyName || seller.name}</span>
      </div>

      {/* Seller Header Profile Card */}
      <div className="rounded-3xl border border-ink/10 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-5">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-pink-600 to-amber-500 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold font-serif shadow-md overflow-hidden flex-shrink-0">
              {seller.avatarUrl ? (
                <img src={imgSrc(seller.avatarUrl)} alt="" className="h-full w-full object-cover" />
              ) : (
                (seller.companyName || seller.name).charAt(0).toUpperCase()
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
                  {seller.companyName || seller.name}
                </h1>
                <span className="rounded-full bg-moss/10 text-moss border border-moss/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span>✓</span> Verified Partner
                </span>
              </div>

              {seller.companyName && (
                <p className="text-xs font-semibold text-brass flex items-center gap-1.5">
                  <span>👤</span> Listed by: <span className="text-ink font-bold">{seller.name}</span>
                </p>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/70 pt-1">
                {seller.email && (
                  <a href={`mailto:${seller.email}`} className="hover:text-pink-600 transition flex items-center gap-1">
                    <span>✉️</span> {seller.email}
                  </a>
                )}
                {seller.phone && (
                  <a href={`tel:${seller.phone}`} className="hover:text-pink-600 transition flex items-center gap-1 font-semibold">
                    <span>📞</span> {seller.phone}
                  </a>
                )}
                <span className="text-ink/50">
                  📅 Partner since {new Date(seller.memberSince).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Direct Contact Action */}
          <div className="flex flex-wrap items-center gap-2">
            {seller.phone && (
              <a
                href={`tel:${seller.phone}`}
                className="rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-sand shadow hover:bg-ink/90 transition flex items-center gap-1.5"
              >
                <span>📞</span> Call Agent
              </a>
            )}
            {seller.email && (
              <a
                href={`mailto:${seller.email}?subject=Inquiry about your PinkCityHomes listings`}
                className="rounded-xl border border-ink/20 bg-white px-4 py-2 text-xs font-semibold text-ink hover:bg-sand/40 transition flex items-center gap-1.5"
              >
                <span>✉️</span> Email Agency
              </a>
            )}
          </div>
        </div>

        {/* Portfolio Stats Strip */}
        <div className="grid grid-cols-3 gap-3 pt-6 mt-6 border-t border-ink/10">
          <div className="rounded-2xl bg-sand/30 p-3.5 text-center sm:text-left">
            <span className="text-[10px] uppercase font-bold text-ink/60">Total Listings</span>
            <p className="font-serif text-2xl font-bold text-ink mt-0.5">{stats.total}</p>
          </div>
          <div className="rounded-2xl bg-sand/30 p-3.5 text-center sm:text-left">
            <span className="text-[10px] uppercase font-bold text-moss">For Sale</span>
            <p className="font-serif text-2xl font-bold text-moss mt-0.5">{stats.buyCount}</p>
          </div>
          <div className="rounded-2xl bg-sand/30 p-3.5 text-center sm:text-left">
            <span className="text-[10px] uppercase font-bold text-brass">For Rent</span>
            <p className="font-serif text-2xl font-bold text-brass mt-0.5">{stats.rentCount}</p>
          </div>
        </div>
      </div>

      {/* Property Listings Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-ink">
              Properties by {seller.companyName || seller.name} ({filteredProperties.length})
            </h2>
            <p className="text-xs text-ink/60">
              Verified residential &amp; commercial inventory in Jaipur
            </p>
          </div>

          {/* Buy / Rent Filter Tabs */}
          <div className="flex rounded-xl bg-ink/5 p-1 text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setFilterType("ALL")}
              className={`rounded-lg px-3.5 py-1.5 transition ${
                filterType === "ALL" ? "bg-white text-ink shadow font-bold" : "text-ink/60 hover:text-ink"
              }`}
            >
              All ({properties.length})
            </button>
            <button
              onClick={() => setFilterType("BUY")}
              className={`rounded-lg px-3.5 py-1.5 transition ${
                filterType === "BUY" ? "bg-white text-ink shadow font-bold" : "text-ink/60 hover:text-ink"
              }`}
            >
              For Sale ({stats.buyCount})
            </button>
            <button
              onClick={() => setFilterType("RENT")}
              className={`rounded-lg px-3.5 py-1.5 transition ${
                filterType === "RENT" ? "bg-white text-ink shadow font-bold" : "text-ink/60 hover:text-ink"
              }`}
            >
              For Rent ({stats.rentCount})
            </button>
          </div>
        </div>

        {filteredProperties.length === 0 ? (
          <div className="rounded-3xl border border-ink/10 bg-white p-12 text-center text-ink/60 space-y-2">
            <p className="font-serif text-lg font-bold text-ink">No properties found</p>
            <p className="text-xs">There are no properties matching this filter under this seller.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((p) => {
              const primary = p.primaryImage || (p.images && p.images.length > 0 ? p.images[0].path : "");
              return (
                <Link
                  key={p.id}
                  to={`/properties/${p.id}`}
                  className="group block overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-sm transition hover:shadow-lg"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-sand/30">
                    <img
                      src={imgSrc(primary)}
                      alt={p.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-ink/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sand backdrop-blur-sm">
                        {p.listingType === "RENT" ? "For Rent" : "For Sale"}
                      </span>
                      <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink backdrop-blur-sm">
                        {p.propertyType.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3 rounded-xl bg-ink/90 px-3 py-1 text-sm font-bold text-sand shadow backdrop-blur-sm">
                      {p.listingType === "RENT" ? `${inr(p.price)}/mo` : inr(p.price)}
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="font-serif text-base font-bold text-ink line-clamp-1 group-hover:text-pink-600 transition">
                      {p.title}
                    </h3>
                    <p className="text-xs text-ink/60 flex items-center gap-1">
                      <span>📍</span> {p.locality}, {p.city || "Jaipur"}
                    </p>

                    <div className="flex items-center gap-3 pt-2 text-xs font-semibold text-ink/80 border-t border-ink/5">
                      <span>{p.bhk} BHK</span>
                      <span>•</span>
                      <span>{p.carpetArea} sq ft</span>
                      <span>•</span>
                      <span className="capitalize">{p.furnishing?.toLowerCase().replace(/_/g, " ")}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
