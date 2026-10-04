import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { inr } from "../../lib/format";

type MarketInsights = {
  properties: number;
  buyCount: number;
  rentCount: number;
  sellers: number;
  avgBuyPrice: number;
  avgRentPrice: number;
  topLocalities: { name: string; count: number; avgPrice: number }[];
};

const jaipurLocalities = [
  { name: "Malviya Nagar", zone: "South", character: "Upscale residential, commercial hub" },
  { name: "Mansarovar", zone: "West", character: "Large planned township, family-friendly" },
  { name: "Vaishali Nagar", zone: "West", character: "Modern residential, well-connected" },
  { name: "C-Scheme", zone: "Central", character: "Premium, elite residences & offices" },
  { name: "Jagatpura", zone: "South", character: "Emerging IT corridor, affordable" },
  { name: "Tonk Road", zone: "South", character: "Mixed-use, good connectivity to airport" },
  { name: "Ajmer Road", zone: "West", character: "High growth, industrial proximity" },
  { name: "Civil Lines", zone: "Central", character: "Colonial heritage, premium bungalows" },
  { name: "Shyam Nagar", zone: "North", character: "Established residential, affordable" },
  { name: "Murlipura", zone: "North", character: "Growing, metro-adjacent" },
];

const marketFacts = [
  { label: "Avg. ₹/sqft (Malviya Nagar)", value: "₹5,500–₹8,000", locality: "Malviya Nagar" },
  { label: "Avg. ₹/sqft (C-Scheme)", value: "₹7,000–₹12,000", locality: "C-Scheme" },
  { label: "Avg. ₹/sqft (Mansarovar)", value: "₹4,200–₹6,500", locality: "Mansarovar" },
  { label: "Avg. ₹/sqft (Vaishali Nagar)", value: "₹4,500–₹7,000", locality: "Vaishali Nagar" },
  { label: "Avg. ₹/sqft (Jagatpura)", value: "₹3,500–₹5,500", locality: "Jagatpura" },
  { label: "Typical 2BHK Price (city-wide)", value: "₹45L–₹90L", locality: "" },
  { label: "Typical 3BHK Price (city-wide)", value: "₹70L–₹1.5Cr", locality: "" },
  { label: "Avg. Rental Yield", value: "3%–4.5% annually", locality: "" },
];

export default function InsightsPage() {
  const [stats, setStats] = useState<MarketInsights | null>(null);
  const [tab, setTab] = useState<"overview" | "localities" | "guide">("overview");

  useEffect(() => {
    api
      .get<MarketInsights>("/properties/insights")
      .then((d) => setStats(d))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700">
          🏙️ Jaipur Real Estate Market
        </div>
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">Market Intelligence</h1>
        <p className="text-sm text-ink/70 max-w-2xl">
          Data-driven insights for Jaipur's residential real estate market. Make informed decisions with verified locality data and live listings.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl bg-ink/5 p-1 w-fit">
        {(["overview", "localities", "guide"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize transition ${
              tab === t ? "bg-white shadow text-ink" : "text-ink/60 hover:text-ink"
            }`}
          >
            {t === "overview" ? "Overview" : t === "localities" ? "Localities" : "Buyer's Guide"}
          </button>
        ))}
      </div>

      {/* Live Market Metrics */}
      {stats && (
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            to="/properties"
            className="group rounded-2xl border border-ink/10 bg-white p-4 shadow-sm text-center hover:border-pink-500 hover:shadow-md transition"
          >
            <p className="font-serif text-2xl font-bold text-pink-600 group-hover:scale-105 transition">{stats.properties}</p>
            <p className="text-xs text-ink/60 mt-1 font-medium">Active Listings</p>
          </Link>
          <Link
            to="/properties"
            className="group rounded-2xl border border-ink/10 bg-white p-4 shadow-sm text-center hover:border-pink-500 hover:shadow-md transition"
          >
            <p className="font-serif text-2xl font-bold text-ink group-hover:scale-105 transition">{stats.buyCount}</p>
            <p className="text-xs text-ink/60 mt-1 font-medium">For Sale</p>
          </Link>
          <Link
            to="/rentals"
            className="group rounded-2xl border border-ink/10 bg-white p-4 shadow-sm text-center hover:border-emerald-500 hover:shadow-md transition"
          >
            <p className="font-serif text-2xl font-bold text-moss group-hover:scale-105 transition">{stats.rentCount}</p>
            <p className="text-xs text-ink/60 mt-1 font-medium">For Rent</p>
          </Link>
          <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm text-center">
            <p className="font-serif text-2xl font-bold text-ink">{stats.sellers}</p>
            <p className="text-xs text-ink/60 mt-1 font-medium">Verified Agencies</p>
          </div>
          <Link
            to="/properties"
            className="group rounded-2xl border border-ink/10 bg-white p-4 shadow-sm text-center hover:border-brass hover:shadow-md transition"
          >
            <p className="font-serif text-xl font-bold text-brass group-hover:scale-105 transition">
              {stats.avgBuyPrice ? inr(stats.avgBuyPrice) : "—"}
            </p>
            <p className="text-xs text-ink/60 mt-1 font-medium">Avg. Buy Price</p>
          </Link>
          <Link
            to="/rentals"
            className="group rounded-2xl border border-ink/10 bg-white p-4 shadow-sm text-center hover:border-emerald-500 hover:shadow-md transition"
          >
            <p className="font-serif text-xl font-bold text-emerald-700 group-hover:scale-105 transition">
              {stats.avgRentPrice ? `${inr(stats.avgRentPrice)}/m` : "—"}
            </p>
            <p className="text-xs text-ink/60 mt-1 font-medium">Avg. Rent Price</p>
          </Link>
        </section>
      )}

      {/* Tab: Overview */}
      {tab === "overview" && (
        <div className="space-y-8">
          {/* Market Facts */}
          <section className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl font-bold mb-4">Jaipur Market Snapshot</h2>
            <p className="text-sm text-ink/70 mb-6">
              Reference data based on published market reports for Jaipur residential real estate.
              Prices vary by floor, age, and amenities. Always verify with the seller.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {marketFacts.map((f) => {
                const inner = (
                  <div className="flex items-center justify-between rounded-xl bg-sand/50 px-4 py-3 border border-ink/5 hover:border-pink-300 hover:bg-white transition">
                    <span className="text-sm text-ink/70">{f.label}</span>
                    <span className="text-sm font-bold text-ink">{f.value}</span>
                  </div>
                );
                return f.locality ? (
                  <Link key={f.label} to={`/properties?locality=${encodeURIComponent(f.locality)}`} title={`Search properties in ${f.locality}`}>
                    {inner}
                  </Link>
                ) : (
                  <div key={f.label}>{inner}</div>
                );
              })}
            </div>
            <p className="text-xs text-ink/40 mt-4">
              * Indicative ranges based on published market data. Actual prices depend on property age, specifications, and negotiation.
            </p>
          </section>

          {/* Why Jaipur */}
          <section className="rounded-3xl border border-pink-100 bg-pink-50/40 p-8">
            <h2 className="font-serif text-xl font-bold mb-4">Why Invest in Jaipur?</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { title: "Heritage & Tourism", body: "UNESCO World Heritage Site drives steady demand for short-term rentals and hospitality investments." },
                { title: "IT & Industrial Growth", body: "Sitapura Industrial Area and Jagatpura IT corridor attract working professionals seeking quality housing." },
                { title: "Metro Connectivity", body: "Jaipur Metro Phase II expansion is improving connectivity, boosting property values along corridors." },
                { title: "Affordable Luxury", body: "Premium properties at 30–50% lower prices than Mumbai or Delhi NCR, with strong appreciation potential." },
                { title: "RERA Compliance", body: "Rajasthan RERA actively monitors projects, providing buyer protection unmatched in many states." },
                { title: "Smart City Mission", body: "Jaipur is a designated Smart City with ongoing infrastructure improvements increasing livability." },
              ].map((item) => (
                <div key={item.title} className="rounded-xl bg-white border border-pink-100 p-4">
                  <h3 className="font-serif font-bold text-ink mb-1">{item.title}</h3>
                  <p className="text-xs text-ink/70">{item.body}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Tab: Localities */}
      {tab === "localities" && (
        <div className="space-y-6">
          <p className="text-sm text-ink/70">
            Jaipur's residential market spans multiple distinct zones. Click any locality to instantly view available properties for sale or rent.
          </p>
          <div className="rounded-3xl border border-ink/10 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-xs font-semibold text-ink/60 uppercase">
                  <th className="py-3 px-5">Locality</th>
                  <th className="py-3 px-5">Zone</th>
                  <th className="py-3 px-5">Character</th>
                  <th className="py-3 px-5 text-right">Explore</th>
                </tr>
              </thead>
              <tbody>
                {jaipurLocalities.map((loc, i) => (
                  <tr key={loc.name} className={`border-b border-ink/5 hover:bg-sand/30 ${i % 2 === 0 ? "" : "bg-sand/10"}`}>
                    <td className="py-3 px-5 font-semibold text-ink">
                      <Link
                        to={`/properties?locality=${encodeURIComponent(loc.name)}`}
                        className="text-ink hover:text-pink-600 transition"
                      >
                        📍 {loc.name}
                      </Link>
                    </td>
                    <td className="py-3 px-5 text-ink/60">{loc.zone}</td>
                    <td className="py-3 px-5 text-ink/70">{loc.character}</td>
                    <td className="py-3 px-5 text-right">
                      <Link
                        to={`/properties?locality=${encodeURIComponent(loc.name)}`}
                        className="rounded-lg border border-ink/15 px-3 py-1 text-xs font-semibold text-ink hover:bg-ink hover:text-sand transition"
                      >
                        View Listings &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Buyer's Guide */}
      {tab === "guide" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-ink/10 bg-white p-8 shadow-sm space-y-6">
            <h2 className="font-serif text-2xl font-bold">Buying Property in Jaipur — Key Steps</h2>
            {[
              { step: "1", title: "Define Budget & Locality", body: "Factor in registration charges (5–7% of circle rate), stamp duty, and GST for new construction. Set aside funds for interior work." },
              { step: "2", title: "Verify RERA Registration", body: "For new projects, check the Rajasthan RERA portal (rera.rajasthan.gov.in) for registration status, completion timeline, and developer track record." },
              { step: "3", title: "Legal Due Diligence", body: "Verify title deed, encumbrance certificate, property tax receipts, and NOC from the housing society or builder before signing." },
              { step: "4", title: "Negotiate & Agree Terms", body: "Get all commitments in writing. Builder/seller must provide carpet area (not just super built-up area) calculations transparently." },
              { step: "5", title: "Sale Agreement & Registration", body: "Execute sale agreement with token amount. Complete sub-registrar registration within stipulated period to avoid penalty." },
              { step: "6", title: "Mutation & Possession", body: "After registration, apply for mutation at the local municipality. Conduct a final inspection before taking possession." },
            ].map((s) => (
              <div key={s.step} className="flex gap-4">
                <div className="flex-none w-8 h-8 rounded-full bg-pink-100 text-pink-700 font-bold text-sm flex items-center justify-center">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-ink">{s.title}</h3>
                  <p className="text-sm text-ink/70 mt-0.5">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm text-amber-900">
              <strong>Disclaimer:</strong> This guide is for general informational purposes only. Consult a qualified property lawyer and registered real estate agent for advice specific to your transaction.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
