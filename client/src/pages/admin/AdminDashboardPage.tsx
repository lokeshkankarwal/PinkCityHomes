import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";

type AdminStats = {
  sellers: number;
  customers: number;
  properties: number;
  sold: number;
  pendingSellerApprovals: number;
  orders: number;
  disabledUsers?: number;
  disabledSellers?: number;
  disabledProperties?: number;
  disabledItems?: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<AdminStats>("/admin/dashboard")
      .then((d) => setStats(d))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-24 text-center text-ink/60">Loading admin console...</div>;
  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center space-y-3">
        <h3 className="font-serif text-xl font-bold text-red-900">Access Denied</h3>
        <p className="text-sm text-red-700">{error}</p>
        <p className="text-xs text-ink/60">Superadmin privileges are required to view this area.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider text-moss font-bold">Platform Governance</span>
          <h1 className="font-serif text-3xl font-bold mt-1">Superadmin Console</h1>
          <p className="text-sm text-ink/70">
            Real-time platform metrics, seller verification, user directory, inventory governance, and audit trails
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/sellers?status=PENDING"
            className="rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-sand shadow hover:bg-ink/90 transition"
          >
            Review Sellers ({stats?.pendingSellerApprovals ?? 0} Pending)
          </Link>
          <Link
            to="/admin/disabled"
            className="rounded-xl border border-red-200 bg-red-50/50 px-4 py-2 text-xs font-semibold text-red-800 hover:bg-red-100 transition"
          >
            Disabled Items ({stats?.disabledItems ?? 0})
          </Link>
          <Link
            to="/admin/audit"
            className="rounded-xl border border-ink/20 px-4 py-2 text-xs font-semibold text-ink hover:bg-sand transition"
          >
            Audit Log
          </Link>
        </div>
      </div>

      {/* KPI Cards — All fully clickable with hover effects and direct navigation */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {/* Pending Approvals */}
        <Link
          to="/admin/sellers?status=PENDING"
          className="group rounded-3xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm hover:border-amber-400 hover:shadow-md hover:-translate-y-0.5 transition duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-amber-900 font-bold">Pending</span>
              <span className="text-xs group-hover:translate-x-0.5 transition">→</span>
            </div>
            <p className="font-serif text-3xl font-bold text-amber-900 mt-2">
              {stats?.pendingSellerApprovals ?? 0}
            </p>
          </div>
          <p className="text-[11px] text-amber-800 mt-2 font-medium">Sellers awaiting review</p>
        </Link>

        {/* Approved Sellers */}
        <Link
          to="/admin/sellers?status=APPROVED"
          className="group rounded-3xl border border-ink/10 bg-white p-5 shadow-sm hover:border-ink/30 hover:shadow-md hover:-translate-y-0.5 transition duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-ink/60 font-bold">Approved Sellers</span>
              <span className="text-xs group-hover:translate-x-0.5 transition text-ink/40">→</span>
            </div>
            <p className="font-serif text-3xl font-bold text-ink mt-2">{stats?.sellers ?? 0}</p>
          </div>
          <p className="text-[11px] text-ink/50 mt-2">Verified agents &amp; agencies</p>
        </Link>

        {/* Registered Users */}
        <Link
          to="/admin/users"
          className="group rounded-3xl border border-ink/10 bg-white p-5 shadow-sm hover:border-ink/30 hover:shadow-md hover:-translate-y-0.5 transition duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-ink/60 font-bold">Registered Users</span>
              <span className="text-xs group-hover:translate-x-0.5 transition text-ink/40">→</span>
            </div>
            <p className="font-serif text-3xl font-bold text-ink mt-2">{stats?.customers ?? 0}</p>
          </div>
          <p className="text-[11px] text-ink/50 mt-2">Buyers &amp; clients</p>
        </Link>

        {/* Platform Properties */}
        <Link
          to="/admin/properties"
          className="group rounded-3xl border border-ink/10 bg-white p-5 shadow-sm hover:border-ink/30 hover:shadow-md hover:-translate-y-0.5 transition duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-ink/60 font-bold">Properties</span>
              <span className="text-xs group-hover:translate-x-0.5 transition text-ink/40">→</span>
            </div>
            <p className="font-serif text-3xl font-bold text-ink mt-2">{stats?.properties ?? 0}</p>
          </div>
          <p className="text-[11px] text-ink/50 mt-2">All listed inventory</p>
        </Link>

        {/* Marked SOLD */}
        <Link
          to="/admin/properties?status=SOLD"
          className="group rounded-3xl border border-moss/20 bg-moss/5 p-5 shadow-sm hover:border-moss/40 hover:shadow-md hover:-translate-y-0.5 transition duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-moss font-bold">Marked SOLD</span>
              <span className="text-xs group-hover:translate-x-0.5 transition text-moss">→</span>
            </div>
            <p className="font-serif text-3xl font-bold text-moss mt-2">{stats?.sold ?? 0}</p>
          </div>
          <p className="text-[11px] text-moss/80 mt-2 font-medium">Deeds confirmed sold</p>
        </Link>

        {/* Orders Issued */}
        <Link
          to="/admin/orders"
          className="group rounded-3xl border border-ink/10 bg-white p-5 shadow-sm hover:border-ink/30 hover:shadow-md hover:-translate-y-0.5 transition duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-ink/60 font-bold">Orders Issued</span>
              <span className="text-xs group-hover:translate-x-0.5 transition text-ink/40">→</span>
            </div>
            <p className="font-serif text-3xl font-bold text-ink mt-2">{stats?.orders ?? 0}</p>
          </div>
          <p className="text-[11px] text-ink/50 mt-2">Transactional deeds</p>
        </Link>

        {/* Disabled Items */}
        <Link
          to="/admin/disabled"
          className="group rounded-3xl border border-red-200 bg-red-50/50 p-5 shadow-sm hover:border-red-400 hover:shadow-md hover:-translate-y-0.5 transition duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-red-800 font-bold">Disabled Items</span>
              <span className="text-xs group-hover:translate-x-0.5 transition text-red-700">→</span>
            </div>
            <p className="font-serif text-3xl font-bold text-red-800 mt-2">
              {stats?.disabledItems ?? 0}
            </p>
          </div>
          <p className="text-[11px] text-red-700/80 mt-2 font-medium">Users, sellers &amp; listings</p>
        </Link>
      </div>

      {/* Admin Quick Action Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold">Seller Verification &amp; Vetting</h3>
            <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
              {stats?.pendingSellerApprovals ?? 0} Pending
            </span>
          </div>
          <p className="text-xs text-ink/70 leading-relaxed">
            Review identity, verify company credentials, approve or suspend seller permissions, and inspect all properties owned by any seller.
          </p>
          <Link
            to="/admin/sellers"
            className="inline-block rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-sand hover:bg-ink/90 transition"
          >
            Review Sellers &rarr;
          </Link>
        </div>

        <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold">Platform Inventory Authority</h3>
            <span className="text-xs bg-moss/10 text-moss px-2 py-0.5 rounded-full font-bold">
              {stats?.properties ?? 0} Total
            </span>
          </div>
          <p className="text-xs text-ink/70 leading-relaxed">
            Manage all listings across Jaipur localities. Exercise exclusive Superadmin authority to transition properties to SOLD or delete non-compliant inventory.
          </p>
          <Link
            to="/admin/properties"
            className="inline-block rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-sand hover:bg-ink/90 transition"
          >
            Manage Inventory &rarr;
          </Link>
        </div>

        <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold">Disabled Items &amp; Recovery</h3>
            <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">
              {stats?.disabledItems ?? 0} Disabled
            </span>
          </div>
          <p className="text-xs text-ink/70 leading-relaxed">
            Centralized hub for all deactivated or suspended entities. Re-enable suspended users, reinstate approved sellers, or restore deactivated property listings.
          </p>
          <Link
            to="/admin/disabled"
            className="inline-block rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-sand hover:bg-ink/90 transition"
          >
            Open Disabled Items &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
