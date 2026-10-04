import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { SkeletonStatCard } from "../../components/Skeleton";
import { EmptyState } from "../../components/EmptyState";
import { Badge } from "../../components/Badge";

type Stats = {
  totalProperties: number;
  activeProperties: number;
  totalClients: number;
  totalLeads: number;
  totalVisits: number;
  highInterest: number;
  mediumInterest: number;
  lowInterest: number;
};

type Visit = {
  id: string;
  scheduledAt: string;
  status: string;
  notes?: string;
  client: { name: string; phone: string };
  property: { title: string; locality: string };
};

type Interaction = {
  id: string;
  type: string;
  notes: string;
  timestamp: string;
  client: { name: string };
  property?: { title: string } | null;
};

export default function SellerDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [upcoming, setUpcoming] = useState<Visit[]>([]);
  const [recent, setRecent] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{
        stats: Stats;
        upcomingVisits: Visit[];
        recentInteractions: Interaction[];
      }>("/seller/dashboard")
      .then((d) => {
        setStats(d.stats);
        setUpcoming(d.upcomingVisits || []);
        setRecent(d.recentInteractions || []);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 pb-16 animate-fade-in">
        <div className="skeleton h-12 w-1/3 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <SkeletonStatCard count={7} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <EmptyState
          icon="🛡️"
          title="Access Restricted"
          body={error || "Newly registered sellers must be verified and approved by a Superadmin before accessing this dashboard."}
          action={{
            label: "Explore Marketplace",
            href: "/properties",
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* ── Dashboard Header ──────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-pink-600">Partner Workspace</span>
          <h1 className="font-display text-3xl font-bold text-navy mt-1">Seller CRM &amp; Inventory Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time listing performance, client interest pipelines, and scheduled property tours
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/seller/properties?new=1"
            className="rounded-2xl bg-pink-600 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-pink-700 transition active:scale-95 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>+</span> Add Property
          </Link>
          <Link
            to="/seller/properties"
            className="hidden sm:inline-flex rounded-2xl bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-slate-800 transition active:scale-95"
          >
            Manage Listings
          </Link>
          <Link
            to="/seller/clients"
            className="hidden sm:inline-flex rounded-2xl border-2 border-slate-300 bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 hover:bg-slate-50 hover:border-slate-400 transition active:scale-95 shadow-sm"
          >
            Clients &amp; Leads
          </Link>
        </div>
      </div>

      {/* ── KPI Metric Cards Strip ────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <Link
          to="/seller/properties"
          className="group rounded-3xl border-2 border-slate-200 bg-white p-4 shadow-sm hover:border-slate-900 hover:shadow-md transition active:scale-95 flex flex-col justify-between"
          title="Click to view all your properties"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 group-hover:text-slate-900 transition">
            Total Inventory
          </span>
          <div className="flex items-baseline justify-between mt-3">
            <p className="font-display text-3xl font-extrabold text-slate-900">{stats?.totalProperties ?? 0}</p>
            <span className="text-xs text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition font-bold">&rarr;</span>
          </div>
        </Link>

        <Link
          to="/seller/properties?status=ACTIVE"
          className="group rounded-3xl border-2 border-emerald-300 bg-emerald-50/70 p-4 shadow-sm hover:border-emerald-600 hover:shadow-md transition active:scale-95 flex flex-col justify-between"
          title="Click to view active searchable listings"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
            Active Listings
          </span>
          <div className="flex items-baseline justify-between mt-3">
            <p className="font-display text-3xl font-extrabold text-emerald-800">{stats?.activeProperties ?? 0}</p>
            <span className="text-xs text-emerald-600 group-hover:translate-x-0.5 transition font-bold">&rarr;</span>
          </div>
        </Link>

        <Link
          to="/seller/clients"
          className="group rounded-3xl border-2 border-slate-200 bg-white p-4 shadow-sm hover:border-slate-900 hover:shadow-md transition active:scale-95 flex flex-col justify-between"
          title="Click to view all clients"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 group-hover:text-slate-900 transition">
            Total Clients
          </span>
          <div className="flex items-baseline justify-between mt-3">
            <p className="font-display text-3xl font-extrabold text-slate-900">{stats?.totalClients ?? 0}</p>
            <span className="text-xs text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition font-bold">&rarr;</span>
          </div>
        </Link>

        <Link
          to="/seller/clients"
          className="group rounded-3xl border-2 border-amber-300 bg-amber-50/70 p-4 shadow-sm hover:border-amber-600 hover:shadow-md transition active:scale-95 flex flex-col justify-between"
          title="Click to manage all leads"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-950">
            Total Leads
          </span>
          <div className="flex items-baseline justify-between mt-3">
            <p className="font-display text-3xl font-extrabold text-amber-900">{stats?.totalLeads ?? 0}</p>
            <span className="text-xs text-amber-700 group-hover:translate-x-0.5 transition font-bold">&rarr;</span>
          </div>
        </Link>

        <Link
          to="/seller/clients?interest=HIGH"
          className="group rounded-3xl border-2 border-rose-300 bg-rose-50/70 p-4 shadow-sm hover:border-rose-600 hover:shadow-md transition active:scale-95 flex flex-col justify-between"
          title="Filter high interest clients"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-950">
            High Interest
          </span>
          <div className="flex items-baseline justify-between mt-3">
            <p className="font-display text-3xl font-extrabold text-rose-900">{stats?.highInterest ?? 0}</p>
            <span className="text-xs text-rose-700 group-hover:translate-x-0.5 transition font-bold">&rarr;</span>
          </div>
        </Link>

        <Link
          to="/seller/clients?interest=MEDIUM"
          className="group rounded-3xl border-2 border-amber-200 bg-white p-4 shadow-sm hover:border-amber-500 hover:shadow-md transition active:scale-95 flex flex-col justify-between"
          title="Filter medium interest clients"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
            Medium
          </span>
          <div className="flex items-baseline justify-between mt-3">
            <p className="font-display text-3xl font-extrabold text-amber-900">{stats?.mediumInterest ?? 0}</p>
            <span className="text-xs text-amber-600 group-hover:translate-x-0.5 transition font-bold">&rarr;</span>
          </div>
        </Link>

        <Link
          to="/seller/clients?interest=LOW"
          className="group rounded-3xl border-2 border-slate-200 bg-white p-4 shadow-sm hover:border-slate-500 hover:shadow-md transition active:scale-95 flex flex-col justify-between"
          title="Filter low interest clients"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Low Interest
          </span>
          <div className="flex items-baseline justify-between mt-3">
            <p className="font-display text-3xl font-extrabold text-slate-800">{stats?.lowInterest ?? 0}</p>
            <span className="text-xs text-slate-400 group-hover:translate-x-0.5 transition font-bold">&rarr;</span>
          </div>
        </Link>
      </div>

      {/* ── Main Two Column Section: Visits & CRM ─────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Visits */}
        <div className="rounded-4xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-bold text-navy">Upcoming Property Visits</h3>
            <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold">
              {upcoming.length} scheduled
            </span>
          </div>

          {upcoming.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-xs text-slate-400">No property visits scheduled yet.</p>
              <Link
                to="/seller/clients"
                className="inline-block text-xs font-bold text-pink-600 hover:underline"
              >
                + Schedule visit from Clients list &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((v) => (
                <div
                  key={v.id}
                  className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4 hover:bg-white hover:border-slate-200 hover:shadow-sm transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <Link
                        to={`/seller/clients?search=${encodeURIComponent(v.client.name)}`}
                        className="font-display font-bold text-sm text-navy hover:text-pink-600 transition"
                      >
                        👤 {v.client.name}
                      </Link>
                      {v.client.phone && (
                        <div className="flex items-center gap-2 pt-0.5">
                          <a
                            href={`tel:${v.client.phone}`}
                            className="text-xs font-semibold text-pink-600 hover:underline flex items-center gap-1"
                          >
                            📞 {v.client.phone}
                          </a>
                          <a
                            href={`https://wa.me/${v.client.phone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-full hover:bg-emerald-200 transition"
                          >
                            WhatsApp
                          </a>
                        </div>
                      )}
                      <p className="text-xs text-slate-600 pt-0.5">
                        🏡 {v.property.title} · <span className="capitalize">{v.property.locality}</span>
                      </p>
                      {v.notes && <p className="text-xs text-slate-500 italic">"{v.notes}"</p>}
                    </div>

                    <div className="text-right flex-shrink-0 space-y-1">
                      <Badge status={v.status} size="sm" />
                      <p className="text-xs font-bold text-navy">
                        {new Date(v.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(v.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Client Interactions */}
        <div className="rounded-4xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-bold text-navy">Recent CRM Activity</h3>
            <Link to="/seller/clients" className="text-xs font-semibold text-pink-600 hover:underline">
              View CRM Pipeline &rarr;
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-xs text-slate-400">No client interactions recorded yet.</p>
              <Link
                to="/seller/clients"
                className="inline-block text-xs font-bold text-pink-600 hover:underline"
              >
                Go to CRM &amp; log an interaction &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((inter) => (
                <Link
                  key={inter.id}
                  to={`/seller/clients?search=${encodeURIComponent(inter.client.name)}`}
                  className="block rounded-3xl border border-slate-100 bg-slate-50/70 p-4 hover:bg-white hover:border-pink-300 hover:shadow-sm transition space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[10px] text-navy uppercase tracking-wider bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                      {inter.type}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(inter.timestamp).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-display font-bold text-sm text-navy hover:text-pink-600 transition">
                      👤 {inter.client.name}
                    </p>
                    <span className="text-xs text-pink-600 font-bold">&rarr;</span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{inter.notes}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
