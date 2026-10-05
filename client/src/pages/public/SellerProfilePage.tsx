import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api/client";
import { imgSrc } from "../../lib/format";
import { PropertyCard } from "../../components/PropertyCard";
import { SkeletonCard } from "../../components/Skeleton";
import { EmptyState } from "../../components/EmptyState";
import { Tabs } from "../../components/Tabs";
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
  const [filterType, setFilterType] = useState<string>("ALL");

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
      <div className="space-y-6 py-12">
        <div className="skeleton h-44 w-full rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard count={3} />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg py-20 px-4 text-center">
        <EmptyState
          icon="🏢"
          title="Seller Profile Unavailable"
          body={error || "This seller profile is not active or does not exist."}
          action={{
            label: "Explore Jaipur Properties",
            href: "/properties",
          }}
        />
      </div>
    );
  }

  const { seller, properties, stats } = data;

  const filteredProperties = properties.filter((p) => {
    if (filterType === "ALL") return true;
    return p.listingType === filterType;
  });

  const filterTabs = [
    { key: "ALL", label: "All Properties", count: properties.length },
    { key: "BUY", label: "For Sale", count: stats.buyCount },
    { key: "RENT", label: "For Rent", count: stats.rentCount },
  ];

  return (
    <div className="space-y-8 pb-20 animate-in-page">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/properties" className="hover:text-ink font-semibold transition">
          Properties
        </Link>
        <span>/</span>
        <span>Verified Sellers</span>
        <span>/</span>
        <span className="text-ink font-bold truncate max-w-[200px]">{seller.companyName || seller.name}</span>
      </div>

      {/* Seller Header Profile Card */}
      <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-card">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-5">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-500 to-amber-500 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold font-display shadow-md overflow-hidden flex-shrink-0">
              {seller.avatarUrl ? (
                <img src={imgSrc(seller.avatarUrl)} alt="" className="h-full w-full object-cover" />
              ) : (
                (seller.companyName || seller.name).charAt(0).toUpperCase()
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
                  {seller.companyName || seller.name}
                </h1>
                <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span>✓</span> Verified Partner
                </span>
              </div>

              {seller.companyName && (
                <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <span>👤</span> Listed by: <span className="text-ink font-bold">{seller.name}</span>
                </p>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                {seller.email && (
                  <a href={`mailto:${seller.email}`} className="hover:text-pink-600 transition flex items-center gap-1">
                    <span>✉️</span> {seller.email}
                  </a>
                )}
                {seller.phone && (
                  <a href={`tel:${seller.phone}`} className="hover:text-pink-600 transition flex items-center gap-1 font-semibold text-ink">
                    <span>📞</span> {seller.phone}
                  </a>
                )}
                <span className="text-slate-400">
                  📅 Partner since {new Date(seller.memberSince).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Direct Contact Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {seller.phone && (
              <a
                href={`tel:${seller.phone}`}
                className="rounded-2xl bg-ink px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-slate-800 transition flex items-center gap-1.5 active:scale-95"
              >
                <span>📞</span> Call Agent
              </a>
            )}
            {seller.phone && (
              <a
                href={`https://wa.me/${seller.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-emerald-700 transition flex items-center gap-1.5 active:scale-95"
              >
                <span>💬</span> WhatsApp
              </a>
            )}
            {seller.email && (
              <a
                href={`mailto:${seller.email}?subject=Inquiry about your PinkCityHomes listings`}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 active:scale-95"
              >
                <span>✉️</span> Email
              </a>
            )}
          </div>
        </div>

        {/* Portfolio Stats Strip */}
        <div className="grid grid-cols-3 gap-3 pt-6 mt-6 border-t border-slate-100">
          <div className="rounded-2xl bg-slate-50 p-4 text-center sm:text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Listings</span>
            <p className="font-display text-2xl font-bold text-ink mt-0.5">{stats.total}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-center sm:text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400">For Sale</span>
            <p className="font-display text-2xl font-bold text-pink-600 mt-0.5">{stats.buyCount}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-center sm:text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400">For Rent</span>
            <p className="font-display text-2xl font-bold text-emerald-700 mt-0.5">{stats.rentCount}</p>
          </div>
        </div>
      </div>

      {/* Property Listings Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">
              Properties by {seller.companyName || seller.name} ({filteredProperties.length})
            </h2>
            <p className="text-xs text-slate-500">
              Verified residential &amp; commercial inventory in Jaipur
            </p>
          </div>

          <Tabs tabs={filterTabs} active={filterType} onChange={setFilterType} />
        </div>

        {filteredProperties.length === 0 ? (
          <EmptyState
            icon="🏡"
            title="No properties in this category"
            body="This seller currently has no active listings matching the selected filter."
            size="sm"
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((p) => (
              <PropertyCard
                key={p.id}
                id={p.id}
                title={p.title}
                price={p.price}
                locality={p.locality}
                city={p.city || "Jaipur"}
                bhk={p.bhk}
                bathrooms={p.bathrooms}
                area={p.carpetArea}
                propertyType={p.propertyType}
                image={p.images?.[0]?.path || p.primaryImage}
                href={`/properties/${p.id}`}
                sold={p.status === "SOLD"}
                listingType={p.listingType}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
