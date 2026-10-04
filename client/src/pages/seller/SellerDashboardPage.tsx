import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";

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

  if (loading) return <div className="py-24 text-center text-ink/60">Loading seller dashboard...</div>;
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center space-y-3">
        <h3 className="font-serif text-xl font-bold text-red-900">Access Restricted</h3>
        <p className="text-sm text-red-700">{error}</p>
        <p className="text-xs text-ink/60">
          Note: Newly registered sellers must be verified and approved by a Superadmin before accessing this dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Seller CRM &amp; Inventory Dashboard</h1>
          <p className="text-sm text-ink/70">Performance metrics, lead interest levels, and upcoming property tours</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/seller/properties?new=1"
            className="rounded-xl bg-pink-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-pink-700 transition active:scale-95"
          >
            + Add Property
          </Link>
          <Link
            to="/seller/properties"
            className="rounded-xl bg-ink px-4 py-2.5 text-xs sm:text-sm font-semibold text-sand hover:bg-ink/90 transition active:scale-95"
          >
            Manage Properties
          </Link>
          <Link
            to="/seller/clients"
            className="rounded-xl border border-ink/20 px-4 py-2.5 text-xs sm:text-sm font-semibold text-ink hover:bg-sand transition active:scale-95"
          >
            Clients &amp; Leads
          </Link>
        </div>
      </div>

      {/* Clickable Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <Link
          to="/seller/properties"
          className="group rounded-2xl border border-ink/10 bg-white p-4 shadow-sm hover:border-ink hover:shadow-md transition active:scale-95 flex flex-col justify-between"
          title="Click to view all your properties"
        >
          <span className="text-[11px] font-semibold uppercase text-ink/60 group-hover:text-ink transition">Total Properties</span>
          <div className="flex items-baseline justify-between mt-1">
            <p className="font-serif text-2xl font-bold text-ink">{stats?.totalProperties ?? 0}</p>
            <span className="text-xs text-ink/40 group-hover:text-ink group-hover:translate-x-0.5 transition">&rarr;</span>
          </div>
        </Link>

        <Link
          to="/seller/properties?status=ACTIVE"
          className="group rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm hover:border-moss hover:shadow-md transition active:scale-95 flex flex-col justify-between"
          title="Click to view active searchable listings"
        >
          <span className="text-[11px] font-semibold uppercase text-emerald-800">Active Listings</span>
          <div className="flex items-baseline justify-between mt-1">
            <p className="font-serif text-2xl font-bold text-moss">{stats?.activeProperties ?? 0}</p>
            <span className="text-xs text-emerald-600 group-hover:translate-x-0.5 transition">&rarr;</span>
          </div>
        </Link>

        <Link
          to="/seller/clients"
          className="group rounded-2xl border border-ink/10 bg-white p-4 shadow-sm hover:border-ink hover:shadow-md transition active:scale-95 flex flex-col justify-between"
          title="Click to view all clients"
        >
          <span className="text-[11px] font-semibold uppercase text-ink/60 group-hover:text-ink transition">Total Clients</span>
          <div className="flex items-baseline justify-between mt-1">
            <p className="font-serif text-2xl font-bold text-ink">{stats?.totalClients ?? 0}</p>
            <span className="text-xs text-ink/40 group-hover:text-ink group-hover:translate-x-0.5 transition">&rarr;</span>
          </div>
        </Link>

        <Link
          to="/seller/clients"
          className="group rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm hover:border-brass hover:shadow-md transition active:scale-95 flex flex-col justify-between"
          title="Click to manage all leads"
        >
          <span className="text-[11px] font-semibold uppercase text-amber-900">Total Leads</span>
          <div className="flex items-baseline justify-between mt-1">
            <p className="font-serif text-2xl font-bold text-brass">{stats?.totalLeads ?? 0}</p>
            <span className="text-xs text-brass group-hover:translate-x-0.5 transition">&rarr;</span>
          </div>
        </Link>

        <Link
          to="/seller/clients?interest=HIGH"
          className="group rounded-2xl border border-red-200 bg-red-50/60 p-4 shadow-sm hover:border-red-400 hover:shadow-md transition active:scale-95 flex flex-col justify-between"
          title="Filter high interest clients"
        >
          <span className="text-[11px] font-semibold uppercase text-red-800">High Interest</span>
          <div className="flex items-baseline justify-between mt-1">
            <p className="font-serif text-2xl font-bold text-red-900">{stats?.highInterest ?? 0}</p>
            <span className="text-xs text-red-600 group-hover:translate-x-0.5 transition">&rarr;</span>
          </div>
        </Link>

        <Link
          to="/seller/clients?interest=MEDIUM"
          className="group rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm hover:border-amber-400 hover:shadow-md transition active:scale-95 flex flex-col justify-between"
          title="Filter medium interest clients"
        >
          <span className="text-[11px] font-semibold uppercase text-amber-800">Medium</span>
          <div className="flex items-baseline justify-between mt-1">
            <p className="font-serif text-2xl font-bold text-amber-900">{stats?.mediumInterest ?? 0}</p>
            <span className="text-xs text-amber-600 group-hover:translate-x-0.5 transition">&rarr;</span>
          </div>
        </Link>

        <Link
          to="/seller/clients?interest=LOW"
          className="group rounded-2xl border border-gray-200 bg-gray-50/60 p-4 shadow-sm hover:border-gray-400 hover:shadow-md transition active:scale-95 flex flex-col justify-between"
          title="Filter low interest clients"
        >
          <span className="text-[11px] font-semibold uppercase text-gray-700">Low Interest</span>
          <div className="flex items-baseline justify-between mt-1">
            <p className="font-serif text-2xl font-bold text-gray-800">{stats?.lowInterest ?? 0}</p>
            <span className="text-xs text-gray-500 group-hover:translate-x-0.5 transition">&rarr;</span>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Visits */}
        <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl font-bold">Upcoming Property Visits</h3>
            <span className="text-xs font-semibold text-moss">{upcoming.length} scheduled</span>
          </div>

          {upcoming.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <p className="text-sm text-ink/60">No upcoming visits scheduled.</p>
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
                  className="rounded-2xl border border-ink/10 bg-sand/30 p-4 hover:bg-white hover:shadow-sm transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <Link
                        to={`/seller/clients?search=${encodeURIComponent(v.client.name)}`}
                        className="font-semibold text-sm text-ink hover:text-pink-600 transition"
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
                            className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded hover:bg-emerald-100 transition"
                          >
                            WhatsApp
                          </a>
                        </div>
                      )}
                      <p className="text-xs text-ink/70">
                        🏡 {v.property.title} · <span className="capitalize">{v.property.locality}</span>
                      </p>
                      {v.notes && <p className="text-xs text-ink/60 italic">"{v.notes}"</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="rounded-full bg-moss/10 text-moss border border-moss/30 px-2 py-0.5 text-[10px] font-bold uppercase">
                        {v.status}
                      </span>
                      <p className="text-xs font-bold text-ink mt-1.5">
                        {new Date(v.scheduledAt).toLocaleDateString()}
                      </p>
                      <p className="text-[11px] text-ink/60">
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
        <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl font-bold">Recent CRM Activity</h3>
            <Link to="/seller/clients" className="text-xs font-semibold text-moss hover:underline">
              View CRM &rarr;
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <p className="text-sm text-ink/60">No recent interactions recorded.</p>
              <Link
                to="/seller/clients"
                className="inline-block text-xs font-bold text-pink-600 hover:underline"
              >
                Go to CRM &amp; log your first client interaction &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((inter) => (
                <Link
                  key={inter.id}
                  to={`/seller/clients?search=${encodeURIComponent(inter.client.name)}`}
                  className="block rounded-2xl border border-ink/10 bg-sand/30 p-4 hover:bg-white hover:border-pink-300 hover:shadow-sm transition space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[10px] text-ink uppercase tracking-wide bg-white px-2 py-0.5 rounded border border-ink/10">
                      {inter.type}
                    </span>
                    <span className="text-[11px] text-ink/50">
                      {new Date(inter.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="font-semibold text-sm text-ink hover:text-pink-600 transition flex items-center justify-between">
                    <span>👤 {inter.client.name}</span>
                    <span className="text-xs text-pink-600">&rarr;</span>
                  </p>
                  <p className="text-xs text-ink/80 line-clamp-2">{inter.notes}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
