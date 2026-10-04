import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { inr, imgSrc } from "../../lib/format";
import type { Property } from "../../types";
import { ConfirmModal } from "../../components/ConfirmModal";

type DisabledUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string | null;
  createdAt: string;
  disabledAt?: string | null;
  disabledBy?: string | null;
};

type DisabledSeller = {
  id: string;
  userId: string;
  companyName?: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string | null;
    createdAt: string;
  };
};

type DisabledResponse = {
  users: DisabledUser[];
  sellers: DisabledSeller[];
  properties: Property[];
};

export default function AdminDisabledPage() {
  const [data, setData] = useState<DisabledResponse>({ users: [], sellers: [], properties: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "sellers" | "properties">("users");

  // Restore Modal State
  const [restoreTarget, setRestoreTarget] = useState<{
    type: "user" | "seller" | "property";
    id: string;
    name: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get<DisabledResponse>("/admin/disabled");
      setData({
        users: res.users || [],
        sellers: res.sellers || [],
        properties: res.properties || [],
      });
    } catch {
      setData({ users: [], sellers: [], properties: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleRestoreConfirm = async () => {
    if (!restoreTarget) return;
    setActionLoading(true);
    try {
      if (restoreTarget.type === "user") {
        await api.patch(`/admin/users/${restoreTarget.id}/enable`);
      } else if (restoreTarget.type === "seller") {
        await api.patch(`/admin/sellers/${restoreTarget.id}/enable`);
      } else if (restoreTarget.type === "property") {
        await api.patch(`/admin/properties/${restoreTarget.id}/enable`);
      }
      setRestoreTarget(null);
      void fetchData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to restore item");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider text-red-700 font-bold">Platform Governance</span>
          <h1 className="font-serif text-3xl font-bold mt-1">Disabled &amp; Suspended Directory</h1>
          <p className="text-sm text-ink/70">
            Audit, inspect, and reinstate disabled customer accounts, suspended sellers, and deactivated property listings
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl bg-ink/5 p-1.5 text-xs font-semibold max-w-md">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 rounded-xl py-2 transition flex items-center justify-center gap-1.5 ${
            activeTab === "users" ? "bg-white shadow text-ink font-bold" : "text-ink/60 hover:text-ink"
          }`}
        >
          <span>Users</span>
          <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px]">
            {data.users.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("sellers")}
          className={`flex-1 rounded-xl py-2 transition flex items-center justify-center gap-1.5 ${
            activeTab === "sellers" ? "bg-white shadow text-ink font-bold" : "text-ink/60 hover:text-ink"
          }`}
        >
          <span>Sellers</span>
          <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px]">
            {data.sellers.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("properties")}
          className={`flex-1 rounded-xl py-2 transition flex items-center justify-center gap-1.5 ${
            activeTab === "properties" ? "bg-white shadow text-ink font-bold" : "text-ink/60 hover:text-ink"
          }`}
        >
          <span>Properties</span>
          <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px]">
            {data.properties.length}
          </span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-ink/60">Loading disabled records...</div>
      ) : activeTab === "users" ? (
        /* Users Tab */
        data.users.length === 0 ? (
          <div className="rounded-3xl border border-ink/10 bg-white p-12 text-center text-sm text-ink/60">
            No disabled user accounts found. All registered users are in active status.
          </div>
        ) : (
          <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-xs font-semibold text-ink/60 uppercase">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Disabled Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {data.users.map((u) => (
                  <tr key={u.id} className="hover:bg-sand/20">
                    <td className="py-3 px-4 font-semibold text-ink">{u.name}</td>
                    <td className="py-3 px-4 text-xs font-mono text-ink/70">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="rounded-full bg-ink/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-ink/60">
                      {u.disabledAt ? new Date(u.disabledAt).toLocaleDateString() : "Previously"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() =>
                          setRestoreTarget({
                            type: "user",
                            id: u.id,
                            name: u.name,
                          })
                        }
                        className="rounded-xl bg-moss/10 text-moss border border-moss/30 px-3 py-1 text-xs font-semibold hover:bg-moss/20 transition"
                      >
                        Restore / Enable
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : activeTab === "sellers" ? (
        /* Sellers Tab */
        data.sellers.length === 0 ? (
          <div className="rounded-3xl border border-ink/10 bg-white p-12 text-center text-sm text-ink/60">
            No suspended or disabled sellers found. All agency accounts are in good standing.
          </div>
        ) : (
          <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-xs font-semibold text-ink/60 uppercase">
                  <th className="py-3 px-4">Seller / Agency</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {data.sellers.map((s) => (
                  <tr key={s.id} className="hover:bg-sand/20">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-ink">{s.user?.name}</p>
                      <p className="text-xs text-brass font-medium">{s.companyName || "Direct Seller"}</p>
                    </td>
                    <td className="py-3 px-4 text-xs text-ink/70">
                      <p className="font-mono">{s.user?.email}</p>
                      {s.user?.phone && <p>{s.user.phone}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded-full bg-red-100 text-red-800 border border-red-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-ink/60">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        to={`/admin/sellers/${s.id}`}
                        className="rounded-xl border border-ink/20 px-3 py-1 text-xs font-semibold text-ink hover:bg-sand transition"
                      >
                        Inspect
                      </Link>
                      <button
                        onClick={() =>
                          setRestoreTarget({
                            type: "seller",
                            id: s.id,
                            name: s.user?.name || s.companyName || "Seller",
                          })
                        }
                        className="rounded-xl bg-moss/10 text-moss border border-moss/30 px-3 py-1 text-xs font-semibold hover:bg-moss/20 transition"
                      >
                        Restore / Enable
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Properties Tab */
        data.properties.length === 0 ? (
          <div className="rounded-3xl border border-ink/10 bg-white p-12 text-center text-sm text-ink/60">
            No inactive or disabled properties found. All platform inventory is active or marked sold.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {data.properties.map((p) => (
              <div
                key={p.id}
                className="overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-sm transition hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="relative">
                    <img
                      src={imgSrc(p.primaryImage || p.images?.[0]?.path)}
                      alt=""
                      className="h-44 w-full object-cover grayscale opacity-80"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                      <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-600 text-white">
                        {p.status}
                      </span>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-brass text-ink">
                        {p.listingType === "RENT" ? "FOR RENT" : "FOR SALE"}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-serif text-base font-bold line-clamp-1">{p.title}</h3>
                    <p className="font-serif text-lg font-bold text-brass">
                      {p.listingType === "RENT" ? `${inr(p.price)}/mo` : inr(p.price)}
                    </p>
                    <p className="text-xs text-ink/70">
                      {p.bhk} BHK · {p.carpetArea} sq ft · <span className="capitalize">{p.locality}</span>
                    </p>
                    <p className="text-xs text-ink/50">Seller: {p.seller?.name || "Agency"}</p>
                  </div>
                </div>

                <div className="border-t border-ink/5 p-3 bg-sand/20 flex items-center justify-between text-xs">
                  <Link
                    to={`/properties/${p.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-moss hover:underline"
                  >
                    View Listing &rarr;
                  </Link>
                  <button
                    onClick={() =>
                      setRestoreTarget({
                        type: "property",
                        id: p.id,
                        name: p.title,
                      })
                    }
                    className="rounded-xl bg-moss px-3 py-1 font-semibold text-white shadow-sm hover:bg-moss/90 transition"
                  >
                    Re-enable Listing
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Restore Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(restoreTarget)}
        title={`Re-enable ${
          restoreTarget?.type === "user"
            ? "User Account"
            : restoreTarget?.type === "seller"
            ? "Seller Profile"
            : "Property Listing"
        }`}
        message={`Are you sure you want to reinstate "${restoreTarget?.name}"? It will immediately be restored to active status across the platform.`}
        confirmLabel="Restore Item"
        variant="primary"
        loading={actionLoading}
        onConfirm={handleRestoreConfirm}
        onCancel={() => setRestoreTarget(null)}
      />
    </div>
  );
}
