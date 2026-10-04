import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { inr } from "../../lib/format";
import { Tabs } from "../../components/Tabs";

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
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    api
      .get<MarketInsights>("/properties/insights")
      .then((d) => setStats(d))
      .catch(() => {});
  }, []);

  const tabs = [
    { key: "overview", label: "Market Overview" },
    { key: "localities", label: "Jaipur Localities" },
    { key: "guide", label: "Buyer's Guide" },
  ];

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span>Jaipur Real Estate Market Intelligence</span>
        </div>
        <h1 className="font-display text-3xl font-bold sm:text-4xl text-navy">Market Intelligence &amp; Trends</h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
          Data-driven pricing, rental yields, and verified inventory metrics across Jaipur's top residential micro-markets.
        </p>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Live Market Metrics */}
      {stats && (
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          <Link
            to="/properties"
            className="group rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-card text-center hover:border-pink-500 hover:shadow-card-hover transition active:scale-95"
          >
            <p className="font-display text-xl sm:text-2xl font-bold text-pink-600 group-hover:scale-105 transition">{stats.properties}</p>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 font-semibold">Active Listings</p>
          </Link>
          <Link
            to="/properties"
            className="group rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-card text-center hover:border-navy hover:shadow-card-hover transition active:scale-95"
          >
            <p className="font-display text-xl sm:text-2xl font-bold text-navy group-hover:scale-105 transition">{stats.buyCount}</p>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 font-semibold">For Sale</p>
          </Link>
          <Link
            to="/rentals"
            className="group rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-card text-center hover:border-emerald-500 hover:shadow-card-hover transition active:scale-95"
          >
            <p className="font-display text-xl sm:text-2xl font-bold text-emerald-700 group-hover:scale-105 transition">{stats.rentCount}</p>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 font-semibold">For Rent</p>
          </Link>
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-card text-center">
            <p className="font-display text-xl sm:text-2xl font-bold text-navy">{stats.sellers}</p>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 font-semibold">Verified Sellers</p>
          </div>
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-card text-center">
            <p className="font-display text-base sm:text-xl font-bold text-navy mt-1 truncate">{inr(stats.avgBuyPrice)}</p>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 font-semibold">Avg. Sale Price</p>
          </div>
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-card text-center">
            <p className="font-display text-base sm:text-xl font-bold text-navy mt-1 truncate">{inr(stats.avgRentPrice)}/mo</p>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 font-semibold">Avg. Rent</p>
          </div>
        </section>
      )}

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Localities Table */}
          {stats?.topLocalities && stats.topLocalities.length > 0 && (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-card space-y-3 sm:space-y-4">
              <h2 className="font-display text-lg sm:text-xl font-bold text-navy">Top Localities by Inventory</h2>
              <div className="overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] sm:text-[11px] font-bold">
                      <th className="pb-3 px-2">Locality</th>
                      <th className="pb-3 px-2 text-center">Active Listings</th>
                      <th className="pb-3 px-2 text-right">Avg. Listed Price</th>
                      <th className="pb-3 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {stats.topLocalities.map((loc) => (
                      <tr key={loc.name} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-2 font-bold text-navy capitalize">{loc.name}</td>
                        <td className="py-3 px-2 text-center text-slate-600">{loc.count} homes</td>
                        <td className="py-3 px-2 text-right text-navy font-bold font-display">{inr(loc.avgPrice)}</td>
                        <td className="py-3 px-2 text-right">
                          <Link
                            to={`/properties?locality=${encodeURIComponent(loc.name)}`}
                            className="inline-block rounded-xl bg-slate-100 hover:bg-navy hover:text-white px-2.5 py-1.5 text-xs font-semibold text-navy transition"
                          >
                            Explore &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Benchmark Facts */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-card space-y-3 sm:space-y-4">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-navy">Price Benchmarks in Jaipur</h2>
              <p className="text-xs text-slate-500 mt-0.5">Verified micro-market capital &amp; rental rates across primary residential belts.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {marketFacts.map((fact) => (
                <div
                  key={fact.label}
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 sm:p-4 space-y-1 transition hover:border-pink-200"
                >
                  <p className="text-xs text-slate-500 font-medium">{fact.label}</p>
                  <p className="font-display text-base sm:text-lg font-bold text-navy">{fact.value}</p>
                  {fact.locality && (
                    <Link
                      to={`/properties?locality=${encodeURIComponent(fact.locality)}`}
                      className="text-[11px] font-bold text-pink-600 hover:underline block pt-0.5"
                    >
                      View in {fact.locality} &rarr;
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Localities */}
      {activeTab === "localities" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 animate-fade-in">
          {jaipurLocalities.map((loc) => (
            <div
              key={loc.name}
              className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-card space-y-2 hover:border-pink-300 transition"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-navy">{loc.name}</h3>
                <span className="rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                  {loc.zone} Zone
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{loc.character}</p>
              <div className="pt-2 flex gap-2">
                <Link
                  to={`/properties?locality=${encodeURIComponent(loc.name)}`}
                  className="flex-1 rounded-xl bg-slate-100 hover:bg-navy hover:text-white py-2 text-center text-xs font-semibold text-navy transition"
                >
                  Buy Here
                </Link>
                <Link
                  to={`/rentals?locality=${encodeURIComponent(loc.name)}`}
                  className="flex-1 rounded-xl border border-slate-200 hover:bg-slate-50 py-2 text-center text-xs font-semibold text-slate-700 transition"
                >
                  Rent Here
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Guide */}
      {activeTab === "guide" && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-8 shadow-card space-y-4 sm:space-y-6 animate-fade-in">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-navy">Jaipur Homebuyer's Essential Guide</h2>
            <p className="text-xs text-slate-500 mt-0.5">Crucial legal and financial checks for purchasing properties in Rajasthan.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-xs sm:text-sm text-slate-600">
            <div className="space-y-2 rounded-2xl bg-slate-50/80 p-4 sm:p-5 border border-slate-100">
              <span className="text-2xl">📜</span>
              <h3 className="font-display text-base font-bold text-navy">1. Title &amp; JDA Verification</h3>
              <p className="leading-relaxed">
                Always verify whether the land is JDA-approved or 90A converted. Ensure clear demarcation, patta title deed, and non-encumbrance certificate.
              </p>
            </div>
            <div className="space-y-2 rounded-2xl bg-slate-50/80 p-4 sm:p-5 border border-slate-100">
              <span className="text-2xl">🏦</span>
              <h3 className="font-display text-base font-bold text-navy">2. Home Loan Approval</h3>
              <p className="leading-relaxed">
                Leading banks (SBI, HDFC, ICICI) pre-approve projects with clear JDA titles. Check with the seller for approved project APF codes.
              </p>
            </div>
            <div className="space-y-2 rounded-2xl bg-slate-50/80 p-4 sm:p-5 border border-slate-100">
              <span className="text-2xl">🤝</span>
              <h3 className="font-display text-base font-bold text-navy">3. Direct Registration</h3>
              <p className="leading-relaxed">
                PinkCityHomes facilitates transparent escrow, title reviews, and scheduling direct sub-registrar deed execution in Jaipur.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
