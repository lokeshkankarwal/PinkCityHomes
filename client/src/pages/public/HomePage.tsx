import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { PropertyCard } from "../../components/PropertyCard";
import { inr } from "../../lib/format";
import type { Property } from "../../types";

export default function HomePage() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<Property[]>([]);
  const [locality, setLocality] = useState("");
  const [bhk, setBhk] = useState("");
  const [type, setType] = useState("buy");

  useEffect(() => {
    api
      .get<{ results: Property[] }>("/properties?limit=6")
      .then((d) => setFeatured(d.results || []))
      .catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === "rent") {
      const q = new URLSearchParams();
      if (locality) q.set("locality", locality);
      if (bhk) q.set("bhk", bhk);
      navigate(`/rentals?${q.toString()}`);
    } else {
      const q = new URLSearchParams();
      if (locality) q.set("locality", locality);
      if (bhk) q.set("bhk", bhk);
      navigate(`/properties?${q.toString()}`);
    }
  };

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-700 via-pink-600 to-rose-700 px-6 py-20 text-white shadow-xl sm:px-12 md:py-28">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 40%, #fff 0%, transparent 60%)" }} />
        <div className="relative z-10 mx-auto max-w-3xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs tracking-wider uppercase text-white/90">
            🏡 Jaipur Verified Real Estate Platform
          </div>
          <h1 className="font-serif text-4xl font-normal tracking-tight sm:text-5xl md:text-6xl text-white">
            Find your home in the <em>Pink City</em>.
          </h1>
          <p className="text-base text-white/80 sm:text-lg">
            Verified properties, vetted sellers, and transparent pricing across Jaipur — Malviya Nagar, Mansarovar, Vaishali Nagar & beyond.
          </p>

          {/* Search Box */}
          <form
            onSubmit={handleSearch}
            className="mx-auto mt-8 flex flex-col gap-3 rounded-2xl bg-white p-3 text-ink shadow-2xl sm:flex-row sm:items-center"
          >
            <div className="flex rounded-xl bg-ink/5 p-1">
              <button
                type="button"
                onClick={() => setType("buy")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  type === "buy" ? "bg-ink text-white shadow" : "text-ink/70 hover:text-ink"
                }`}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => setType("rent")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  type === "rent" ? "bg-ink text-white shadow" : "text-ink/70 hover:text-ink"
                }`}
              >
                Rent
              </button>
            </div>

            <input
              type="text"
              placeholder="Locality (e.g. Malviya Nagar, Mansarovar, C-Scheme)"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              className="flex-1 rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            />

            <select
              value={bhk}
              onChange={(e) => setBhk(e.target.value)}
              className="rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">Any BHK</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4">4+ BHK</option>
            </select>

            <button
              type="submit"
              className="rounded-xl bg-pink-600 px-6 py-2.5 font-semibold text-white transition hover:bg-pink-700 active:scale-95 shadow-sm"
            >
              Search
            </button>
          </form>

          {/* Popular Jaipur Localities Quick Chips */}
          <div className="pt-2">
            <p className="text-xs text-white/70 font-semibold mb-2">Popular Jaipur Localities:</p>
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
              {[
                "Mansarovar",
                "Vaishali Nagar",
                "Jagatpura",
                "C-Scheme",
                "Malviya Nagar",
                "Ajmer Road",
                "Tonk Road",
              ].map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => navigate(type === "rent" ? `/rentals?locality=${encodeURIComponent(loc)}` : `/properties?locality=${encodeURIComponent(loc)}`)}
                  className="rounded-full bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-1 text-xs text-white hover:bg-white hover:text-ink transition active:scale-95"
                >
                  📍 {loc}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Property Type Shortcuts */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-bold sm:text-2xl text-ink">Browse by Property Type</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Apartments & Flats", icon: "🏢", type: "APARTMENT", desc: "1, 2, 3 & 4 BHK multi-storey homes" },
            { label: "Villas & Kothis", icon: "🏡", type: "VILLA", desc: "Independent luxury living" },
            { label: "Independent Houses", icon: "🏠", type: "INDEPENDENT_HOUSE", desc: "Private residential floors & homes" },
            { label: "Residential Plots", icon: "📐", type: "PLOT", desc: "JDA approved lands & plots" },
          ].map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => navigate(`/properties?propertyType=${item.type}`)}
              className="group rounded-3xl border border-ink/10 bg-white p-5 text-left shadow-sm hover:border-pink-500 hover:shadow-md transition active:scale-95 flex flex-col justify-between"
            >
              <div>
                <span className="text-3xl sm:text-4xl block mb-2 group-hover:scale-110 transition origin-left">{item.icon}</span>
                <h3 className="font-serif font-bold text-base text-ink group-hover:text-pink-600 transition">{item.label}</h3>
                <p className="text-xs text-ink/60 mt-1">{item.desc}</p>
              </div>
              <span className="text-xs font-semibold text-pink-600 mt-3 flex items-center gap-1 group-hover:translate-x-1 transition">
                Explore &rarr;
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Value Props */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
          <div className="mb-3 text-2xl font-serif text-pink-600">01</div>
          <h3 className="font-serif text-lg font-bold">Verified Pricing & Area</h3>
          <p className="mt-1 text-sm text-ink/70">
            Transparent carpet area and super built-up numbers for every Jaipur listing, eliminating hidden charges.
          </p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
          <div className="mb-3 text-2xl font-serif text-brass">02</div>
          <h3 className="font-serif text-lg font-bold">Vetted Sellers & Agents</h3>
          <p className="mt-1 text-sm text-ink/70">
            Every seller is reviewed and approved by our platform team. No unverified listings.
          </p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
          <div className="mb-3 text-2xl font-serif text-ink">03</div>
          <h3 className="font-serif text-lg font-bold">Jaipur Market Insights</h3>
          <p className="mt-1 text-sm text-ink/70">
            Accurate ₹/sqft analytics across Jaipur's top micro-markets — Mansarovar, Vaishali Nagar, and C-Scheme.
          </p>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold sm:text-3xl">Featured Properties</h2>
            <p className="mt-1 text-sm text-ink/70">Verified homes in Jaipur ready for inspection</p>
          </div>
          <Link to="/properties" className="text-sm font-semibold text-moss hover:underline">
            View all &rarr;
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <PropertyCard
                key={p.id}
                id={p.id}
                title={p.title}
                price={p.price}
                locality={p.locality}
                bhk={p.bhk}
                area={p.carpetArea}
                image={p.primaryImage}
                sold={p.status === "SOLD"}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-ink/10 bg-white p-8 text-center text-ink/60">
            <p className="text-lg font-serif font-bold mb-2">No listings yet</p>
            <p className="text-sm">Be the first to list your Jaipur property.</p>
            <Link
              to="/register"
              className="mt-4 inline-block rounded-xl bg-pink-600 px-5 py-2 text-sm font-semibold text-white hover:bg-pink-700"
            >
              Register as Seller &rarr;
            </Link>
          </div>
        )}
      </section>

      {/* Buy & Rental Discovery Banner */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-ink/10 bg-gradient-to-br from-sand to-pink-50/60 p-8 shadow-sm">
          <span className="text-xs uppercase tracking-wider text-pink-600 font-bold">Verified Ownership</span>
          <h3 className="mt-2 font-serif text-2xl font-bold">Buy Homes &amp; Villas</h3>
          <p className="mt-2 text-sm text-ink/70">
            Explore curated residential apartments, independent builder floors, and luxury villas across Jaipur's prime localities.
          </p>
          <Link
            to="/properties"
            className="mt-6 inline-block rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-sand hover:bg-ink/90 transition active:scale-95 shadow-sm"
          >
            Browse Buy Properties &rarr;
          </Link>
        </div>

        <div className="rounded-3xl border border-ink/10 bg-gradient-to-br from-sand to-emerald-50/50 p-8">
          <span className="text-xs uppercase tracking-wider text-moss font-bold">Zero Brokerage</span>
          <h3 className="mt-2 font-serif text-2xl font-bold">Jaipur Rentals</h3>
          <p className="mt-2 text-sm text-ink/70">
            Furnished & semi-furnished apartments in Malviya Nagar, C-Scheme, Bapu Nagar, and Tonk Road.
          </p>
          <Link
            to="/rentals"
            className="mt-6 inline-block rounded-xl bg-moss px-5 py-2.5 text-sm font-semibold text-white hover:bg-moss/90"
          >
            Browse Rentals &rarr;
          </Link>
        </div>
      </section>

      {/* Market teaser */}
      <section className="rounded-3xl border border-ink/10 bg-white p-8 sm:p-10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <h3 className="font-serif text-2xl font-bold">Jaipur Real Estate Market</h3>
          <p className="text-sm text-ink/70 max-w-2xl">
            Explore price trends, locality comparisons, and verified ₹/sqft data across Jaipur's growing residential markets.
          </p>
        </div>
        <Link
          to="/insights"
          className="whitespace-nowrap rounded-xl border-2 border-ink px-6 py-3 font-semibold text-ink hover:bg-ink hover:text-sand transition"
        >
          View Market Data &rarr;
        </Link>
      </section>

      {/* Popular Localities */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold">Popular Localities in Jaipur</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { name: "Malviya Nagar", icon: "🏢" },
            { name: "Mansarovar", icon: "🏡" },
            { name: "Vaishali Nagar", icon: "🌆" },
            { name: "C-Scheme", icon: "🏛️" },
            { name: "Jagatpura", icon: "🌳" },
            { name: "Tonk Road", icon: "🛣️" },
          ].map((loc) => (
            <Link
              key={loc.name}
              to={`/properties?locality=${encodeURIComponent(loc.name.toLowerCase())}`}
              className="rounded-2xl border border-ink/10 bg-white p-4 text-center hover:border-pink-300 hover:shadow-sm transition"
            >
              <div className="text-2xl mb-1">{loc.icon}</div>
              <p className="text-xs font-semibold text-ink">{loc.name}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
