import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { SkeletonStatCard } from "../../components/Skeleton";
import { EmptyState } from "../../components/EmptyState";

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

  if (loading) {
    return (
      <div className="space-y-8 pb-16 animate-in-page">
        <div className="skeleton h-12 w-1/3 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          <SkeletonStatCard count={7} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <EmptyState
          icon="👑"
          title="Access Denied"
          body={error || "Superadmin privileges are required to access this control center."}
          action={{
            label: "Sign in as Superadmin",
            href: "/login",
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-in-page">
      {/* Console Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="stagger-0">
          <span className="page-eyebrow">Platform Governance</span>
          <h1 className="page-title mt-1">Superadmin Console</h1>
          <p className="page-subtitle mt-2">
            Real-time platform metrics, seller verification, user directory, inventory governance, and audit trails
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/admin/sellers?status=PENDING"
            className="btn-accent px-4 py-2.5 text-[14px] flex items-center gap-1.5"
          >
            <span>Review Sellers ({stats?.pendingSellerApprovals ?? 0} Pending)</span>
          </Link>
          <Link
            to="/admin/disabled"
            className="btn-danger px-4 py-2.5 text-[14px]"
          >
            Disabled Items ({stats?.disabledItems ?? 0})
          </Link>
          <Link
            to="/admin/audit"
            className="btn-ghost text-[13px] px-4 py-2.5"
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
          className="group stagger-1 rounded-[1.25rem] border border-amber-200 bg-amber-50/60 p-5 shadow-card card-hover flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="label-ui text-amber-900 font-bold">Pending</span>
              <span className="text-xs group-hover:translate-x-0.5 transition">→</span>
            </div>
            <p className="font-display text-3xl font-bold tracking-[-0.02em] text-amber-900 mt-2">
              {stats?.pendingSellerApprovals ?? 0}
            </p>
          </div>
          <p className="text-[12px] text-slate-500 leading-snug mt-2 font-medium">Sellers awaiting review</p>
        </Link>

        {/* Approved Sellers */}
        <Link
          to="/admin/sellers?status=APPROVED"
          className="group stagger-2 rounded-[1.25rem] border border-slate-200/70 bg-white p-5 shadow-card card-hover flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="label-ui font-bold">Approved Sellers</span>
              <span className="text-xs group-hover:translate-x-0.5 transition text-slate-400">→</span>
            </div>
            <p className="font-display text-3xl font-bold tracking-[-0.02em] text-ink mt-2">{stats?.sellers ?? 0}</p>
          </div>
          <p className="text-[12px] text-slate-500 leading-snug mt-2">Verified agents &amp; agencies</p>
        </Link>

        {/* Registered Users */}
        <Link
          to="/admin/users"
          className="group stagger-3 rounded-[1.25rem] border border-slate-200/70 bg-white p-5 shadow-card card-hover flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="label-ui font-bold">Registered Users</span>
              <span className="text-xs group-hover:translate-x-0.5 transition text-slate-400">→</span>
            </div>
            <p className="font-display text-3xl font-bold tracking-[-0.02em] text-ink mt-2">{stats?.customers ?? 0}</p>
          </div>
          <p className="text-[12px] text-slate-500 leading-snug mt-2">Buyers &amp; clients</p>
        </Link>

        {/* Platform Properties */}
        <Link
          to="/admin/properties"
          className="group stagger-1 rounded-[1.25rem] border border-slate-200/70 bg-white p-5 shadow-card card-hover flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="label-ui font-bold">Properties</span>
              <span className="text-xs group-hover:translate-x-0.5 transition text-slate-400">→</span>
            </div>
            <p className="font-display text-3xl font-bold tracking-[-0.02em] text-ink mt-2">{stats?.properties ?? 0}</p>
          </div>
          <p className="text-[12px] text-slate-500 leading-snug mt-2">All listed inventory</p>
        </Link>

        {/* Marked SOLD */}
        <Link
          to="/admin/properties?status=SOLD"
          className="group stagger-2 rounded-[1.25rem] border border-emerald-200 bg-emerald-50/50 p-5 shadow-card card-hover flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="label-ui text-emerald-800 font-bold">Marked SOLD</span>
              <span className="text-xs group-hover:translate-x-0.5 transition text-emerald-700">→</span>
            </div>
            <p className="font-display text-3xl font-bold tracking-[-0.02em] text-emerald-800 mt-2">{stats?.sold ?? 0}</p>
          </div>
          <p className="text-[12px] text-slate-500 leading-snug mt-2 font-medium">Deeds confirmed sold</p>
        </Link>

        {/* Orders Issued */}
        <Link
          to="/admin/users"
          className="group stagger-3 rounded-[1.25rem] border border-slate-200/70 bg-white p-5 shadow-card card-hover flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="label-ui font-bold">Orders Issued</span>
              <span className="text-xs group-hover:translate-x-0.5 transition text-slate-400">→</span>
            </div>
            <p className="font-display text-3xl font-bold tracking-[-0.02em] text-ink mt-2">{stats?.orders ?? 0}</p>
          </div>
          <p className="text-[12px] text-slate-500 leading-snug mt-2">Transactional deeds</p>
        </Link>

        {/* Disabled Items */}
        <Link
          to="/admin/disabled"
          className="group stagger-1 rounded-[1.25rem] border border-rose-200 bg-rose-50/60 p-5 shadow-card card-hover flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="label-ui text-rose-800 font-bold">Disabled Items</span>
              <span className="text-xs group-hover:translate-x-0.5 transition text-rose-700">→</span>
            </div>
            <p className="font-display text-3xl font-bold tracking-[-0.02em] text-rose-800 mt-2">
              {stats?.disabledItems ?? 0}
            </p>
          </div>
          <p className="text-[12px] text-slate-500 leading-snug mt-2 font-medium">Users, sellers &amp; listings</p>
        </Link>
      </div>

      {/* Admin Quick Action Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stagger-1 rounded-[1.5rem] border border-slate-200/70 bg-white p-7 shadow-card space-y-3 card-hover">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-ink tracking-[-0.01em] leading-snug">Seller Verification &amp; Vetting</h3>
            <span className="label-ui bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold">
              {stats?.pendingSellerApprovals ?? 0} Pending
            </span>
          </div>
          <p className="text-[12px] text-slate-500 leading-snug">
            Review identity, verify company credentials, approve or suspend seller permissions, and inspect all properties owned by any seller.
          </p>
          <div className="pt-2">
            <Link
              to="/admin/sellers"
              className="btn-primary px-4 py-2.5 text-[14px] inline-block"
            >
              Review Sellers →
            </Link>
          </div>
        </div>

        <div className="stagger-2 rounded-[1.5rem] border border-slate-200/70 bg-white p-7 shadow-card space-y-3 card-hover">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-ink tracking-[-0.01em] leading-snug">Platform Inventory Authority</h3>
            <span className="label-ui bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
              {stats?.properties ?? 0} Total
            </span>
          </div>
          <p className="text-[12px] text-slate-500 leading-snug">
            Manage all listings across Jaipur localities. Exercise exclusive Superadmin authority to transition properties to SOLD or delete non-compliant inventory.
          </p>
          <div className="pt-2">
            <Link
              to="/admin/properties"
              className="btn-primary px-4 py-2.5 text-[14px] inline-block"
            >
              Manage Inventory →
            </Link>
          </div>
        </div>

        <div className="stagger-3 rounded-[1.5rem] border border-slate-200/70 bg-white p-7 shadow-card space-y-3 card-hover">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-ink tracking-[-0.01em] leading-snug">Disabled Items &amp; Recovery</h3>
            <span className="label-ui bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-full font-bold">
              {stats?.disabledItems ?? 0} Disabled
            </span>
          </div>
          <p className="text-[12px] text-slate-500 leading-snug">
            Centralized hub for all deactivated or suspended entities. Re-enable suspended users, reinstate approved sellers, or restore deactivated property listings.
          </p>
          <div className="pt-2">
            <Link
              to="/admin/disabled"
              className="btn-primary px-4 py-2.5 text-[14px] inline-block"
            >
              Open Disabled Items →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
