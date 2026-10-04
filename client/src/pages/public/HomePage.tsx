import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { PropertyCard } from "../../components/PropertyCard";
import { SkeletonCard } from "../../components/Skeleton";
import type { Property } from "../../types";

export default function HomePage() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [locality, setLocality] = useState("");
  const [bhk, setBhk] = useState("");
  const [type, setType] = useState<"buy" | "rent">("buy");
  const [insights, setInsights] = useState<{
    properties: number;
    sellers: number;
    avgBuyPrice: number;
  } | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get<{ results: Property[] }>("/properties?limit=8")
      .then((d) => setFeatured(d.results || []))
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));

    api
      .get<{ properties: number; sellers: number; avgBuyPrice: number }>("/properties/insights")
      .then((d) => setInsights(d))
      .catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = new URLSearchParams();
    if (locality) q.set("locality", locality);
    if (bhk) q.set("bhk", bhk);

    if (type === "rent") {
      navigate(`/rentals?${q.toString()}`);
    } else {
      navigate(`/properties?${q.toString()}`);
    }
  };

  const localities = [
    "Mansarovar",
    "Vaishali Nagar",
    "Jagatpura",
    "Malviya Nagar",
    "C-Scheme",
    "Tonk Road",
    "Raja Park",
    "Ajmer Road",
  ];

  return (
    <div className="space-y-16 pb-16 animate-fade-in">
      {/* ── Hero Section ────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-4xl bg-navy-950 px-6 py-20 text-white shadow-2xl sm:px-12 md:py-28 border border-navy-800">
        {/* Subtle glowing background orbs */}
        <div className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-pink-600/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-4xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-pink-300 backdrop-blur-md">
            <span>✨</span> Jaipur's Verified PropTech Marketplace
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight leading-tight">
            Find your sanctuary in the{" "}
            <span className="font-italic text-pink-500 italic">Pink City</span>.
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Verified luxury villas, modern apartments, and prime plots across Jaipur's most coveted micro-markets — directly from vetted owners and registered agencies.
          </p>

          {/* Interactive Search Bar Card */}
          <form
            onSubmit={handleSearch}
            className="mx-auto mt-8 flex flex-col gap-3 rounded-3xl bg-white p-3 text-navy shadow-modal sm:flex-row sm:items-center max-w-3xl border border-slate-100"
          >
            {/* Buy / Rent Switch */}
            <div className="flex rounded-2xl bg-slate-100 p-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => setType("buy")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 ${
                  type === "buy" ? "bg-navy text-white shadow-sm" : "text-slate-600 hover:text-navy"
                }`}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => setType("rent")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 ${
                  type === "rent" ? "bg-navy text-white shadow-sm" : "text-slate-600 hover:text-navy"
                }`}
              >
                Rent
              </button>
            </div>

            {/* Locality Input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Locality (e.g. Mansarovar, Vaishali Nagar, C-Scheme)"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="w-full rounded-2xl border-0 bg-transparent px-4 py-2.5 text-xs md:text-sm text-navy placeholder-slate-400 focus:outline-none focus:ring-0"
              />
            </div>

            {/* BHK Filter */}
            <div className="flex-shrink-0">
              <select
                value={bhk}
                onChange={(e) => setBhk(e.target.value)}
                className="w-full rounded-2xl border-0 bg-slate-50 px-3 py-2.5 text-xs md:text-sm font-semibold text-slate-700 focus:outline-none"
              >
                <option value="">Bedrooms</option>
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4+ BHK</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="rounded-2xl bg-pink-600 px-6 py-3 text-xs md:text-sm font-semibold text-white shadow-md hover:bg-pink-700 transition active:scale-95 flex items-center justify-center gap-2 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search Homes</span>
            </button>
          </form>

          {/* Quick Locality Pills */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Popular:</span>
            {localities.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => {
                  setLocality(loc);
                  navigate(`/properties?locality=${encodeURIComponent(loc)}`);
                }}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300 hover:bg-white/20 hover:text-white transition backdrop-blur-xs text-[11px]"
              >
                {loc}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Real Market Stats Strip ─────────────────────────────── */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card text-center sm:text-left">
          <p className="text-xs uppercase font-bold text-slate-500">Verified Properties</p>
          <p className="font-display text-2xl sm:text-3xl font-bold text-navy mt-1">
            {insights?.properties ? `${insights.properties}+` : "Verified"}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Vetted Jaipur listings</p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card text-center sm:text-left">
          <p className="text-xs uppercase font-bold text-slate-500">Partner Agencies</p>
          <p className="font-display text-2xl sm:text-3xl font-bold text-pink-600 mt-1">
            {insights?.sellers ? `${insights.sellers}+` : "Approved"}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Licensed sellers</p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card text-center sm:text-left">
          <p className="text-xs uppercase font-bold text-slate-500">Average Home Price</p>
          <p className="font-display text-2xl sm:text-3xl font-bold text-emerald-700 mt-1">
            {insights?.avgBuyPrice
              ? `₹${(insights.avgBuyPrice / 10000000).toFixed(2)} Cr`
              : "₹85L - 2Cr"}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">In prime micro-markets</p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card text-center sm:text-left">
          <p className="text-xs uppercase font-bold text-slate-500">Title Clarity</p>
          <p className="font-display text-2xl sm:text-3xl font-bold text-navy mt-1">100%</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Pre-verified registry</p>
        </div>
      </section>

      {/* ── Featured Properties ─────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-pink-600">
              Curated Homes
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-navy mt-1">
              Featured Properties in Jaipur
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Handpicked residences with verified titles and immediate site visit availability
            </p>
          </div>
          <Link
            to="/properties"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-pink-600 hover:text-pink-700 transition"
          >
            <span>Explore all properties</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <SkeletonCard count={4} />
          </div>
        ) : featured.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
            No properties found at this moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((p) => (
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
                projectName={p.projectName}
                listingType={p.listingType}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Property Types Grid ─────────────────────────────────── */}
      <section className="space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-pink-600">Categories</span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-navy mt-1">
            Browse by Property Style
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/properties?type=APARTMENT"
            className="group rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card hover:shadow-card-hover hover:border-pink-300 transition-all duration-200"
          >
            <div className="h-12 w-12 rounded-2xl bg-pink-50 text-2xl flex items-center justify-center text-pink-600 group-hover:scale-110 transition-transform">
              🏢
            </div>
            <h3 className="font-display text-lg font-bold text-navy mt-4 group-hover:text-pink-600 transition">
              Luxury Apartments
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Gated societies with clubhouses, 24/7 security, and modern amenities.
            </p>
          </Link>

          <Link
            to="/properties?type=VILLA"
            className="group rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card hover:shadow-card-hover hover:border-pink-300 transition-all duration-200"
          >
            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-2xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              🏰
            </div>
            <h3 className="font-display text-lg font-bold text-navy mt-4 group-hover:text-pink-600 transition">
              Independent Villas
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Expansive multi-story private villas with private gardens and terrace decks.
            </p>
          </Link>

          <Link
            to="/properties?type=INDEPENDENT_HOUSE"
            className="group rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card hover:shadow-card-hover hover:border-pink-300 transition-all duration-200"
          >
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              🏡
            </div>
            <h3 className="font-display text-lg font-bold text-navy mt-4 group-hover:text-pink-600 transition">
              Independent Houses
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Autonomous family homes in established colonies like Malviya Nagar &amp; C-Scheme.
            </p>
          </Link>

          <Link
            to="/properties?type=PLOT"
            className="group rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card hover:shadow-card-hover hover:border-pink-300 transition-all duration-200"
          >
            <div className="h-12 w-12 rounded-2xl bg-sky-50 text-2xl flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform">
              📐
            </div>
            <h3 className="font-display text-lg font-bold text-navy mt-4 group-hover:text-pink-600 transition">
              Residential Plots
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              JDA-approved residential land ready for custom architectural construction.
            </p>
          </Link>
        </div>
      </section>

      {/* ── Trust & Direct Connection Banner ─────────────────────── */}
      <section className="rounded-4xl bg-navy-950 p-8 sm:p-12 text-white border border-navy-800 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
        <div className="space-y-3 max-w-xl text-center md:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-pink-400">
            For Real Estate Sellers &amp; Agencies
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold">
            Showcase your Jaipur inventory to verified buyers.
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Gain verified partner status, manage CRM leads, coordinate site visits, and track closing milestones from a single professional dashboard.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
          <Link
            to="/register"
            className="rounded-2xl bg-pink-600 px-6 py-3 text-xs md:text-sm font-semibold text-white shadow-md hover:bg-pink-700 transition active:scale-95 text-center"
          >
            Apply as Seller Partner &rarr;
          </Link>
          <Link
            to="/seller/dashboard"
            className="rounded-2xl border border-navy-700 bg-navy-900 px-6 py-3 text-xs md:text-sm font-semibold text-slate-200 hover:text-white hover:bg-navy-800 transition active:scale-95 text-center"
          >
            Seller Portal
          </Link>
        </div>
      </section>
    </div>
  );
}
