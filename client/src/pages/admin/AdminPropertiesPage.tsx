import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { inr, imgSrc } from "../../lib/format";
import type { Property } from "../../types";
import { ConfirmModal } from "../../components/ConfirmModal";
import { Badge } from "../../components/Badge";
import { toast } from "../../components/Toast";

export default function AdminPropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") || "ALL";

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>(initialStatus);

  // Mark Sold modal state
  const [soldModalProp, setSoldModalProp] = useState<Property | null>(null);
  const [customerId, setCustomerId] = useState("");

  // Disable / Enable modal state
  const [statusTarget, setStatusTarget] = useState<Property | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Sync tab with URL search parameter if changed
  useEffect(() => {
    const s = searchParams.get("status");
    if (s && s !== activeTab) {
      setActiveTab(s.toUpperCase());
    }
  }, [searchParams]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("q", debouncedSearch);
      if (activeTab !== "ALL") params.append("status", activeTab);

      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await api.get<{ results: Property[] }>(`/admin/properties${qs}`);
      setProperties(res.results || []);
    } catch {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeTab]);

  useEffect(() => {
    void fetchProperties();
  }, [fetchProperties]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "ALL") {
      searchParams.delete("status");
    } else {
      searchParams.set("status", tab);
    }
    setSearchParams(searchParams);
  };

  const handleMarkSold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!soldModalProp) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/properties/${soldModalProp.id}/sold`, {
        customerId: customerId || undefined,
      });
      toast.success("Property marked as SOLD successfully!");
      setSoldModalProp(null);
      setCustomerId("");
      void fetchProperties();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to mark as SOLD");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!statusTarget) return;
    setActionLoading(true);
    try {
      const endpoint =
        statusTarget.status === "ACTIVE"
          ? `/admin/properties/${statusTarget.id}/disable`
          : `/admin/properties/${statusTarget.id}/enable`;
      await api.patch(endpoint);
      toast.success(`Property status updated to ${statusTarget.status === "ACTIVE" ? "DISABLED" : "ACTIVE"}`);
      setStatusTarget(null);
      void fetchProperties();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update property status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProperty = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await api.delete(`/admin/properties/${deleteTarget.id}`);
      toast.success("Property permanently deleted");
      setDeleteTarget(null);
      void fetchProperties();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete property");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold">Manage Platform Inventory</h1>
        <p className="text-sm text-ink/70">
          Superadmin controls: search across catalog, verify active listings, manage inactive properties, and execute SOLD deed transitions
        </p>
      </div>

      {/* Controls: Search + Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative max-w-md w-full">
          <input
            type="text"
            placeholder="Search by title, locality, society, seller, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-ink/20 px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brass bg-white shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-2.5 text-xs text-ink/40 hover:text-ink"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Tabs */}
        <div className="flex rounded-xl bg-ink/5 p-1 text-xs font-semibold overflow-x-auto">
          {[
            { id: "ALL", label: "All Inventory" },
            { id: "ACTIVE", label: "Active" },
            { id: "INACTIVE", label: "Inactive / Disabled" },
            { id: "SOLD", label: "Marked SOLD" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`rounded-lg px-3.5 py-1.5 whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "bg-white text-ink shadow-sm font-bold"
                  : "text-ink/60 hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-ink/60">Loading properties...</div>
      ) : properties.length === 0 ? (
        <div className="rounded-3xl border border-ink/10 bg-white p-12 text-center text-sm text-ink/60">
          No properties found matching your search and filter parameters.
        </div>
      ) : (
        <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs font-semibold text-ink/60 uppercase">
                <th className="py-3 px-4">Property</th>
                <th className="py-3 px-4">Seller</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Locality</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {properties.map((p) => (
                <tr key={p.id} className="hover:bg-sand/20">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={imgSrc(p.primaryImage || p.images?.[0]?.path)}
                        alt=""
                        className="h-10 w-14 rounded-xl object-cover border border-ink/10"
                      />
                      <div>
                        <Link
                          to={`/properties/${p.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-ink hover:text-brass line-clamp-1"
                        >
                          {p.title}
                        </Link>
                        <p className="text-xs text-ink/50">
                          {p.bhk} BHK · {p.carpetArea} sq ft {p.projectName ? `· ${p.projectName}` : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs">
                    {p.seller ? (
                      <Link
                        to={`/admin/sellers/${p.sellerId}`}
                        className="font-semibold text-ink hover:underline"
                      >
                        {p.seller.name}
                      </Link>
                    ) : (
                      <span className="text-ink/60">Direct Seller</span>
                    )}
                    <br />
                    <span className="text-[10px] text-ink/40 font-mono">{p.seller?.email}</span>
                  </td>
                  <td className="py-3 px-4 font-serif font-bold text-brass whitespace-nowrap">
                    {p.listingType === "RENT" ? `${inr(p.price)}/mo` : inr(p.price)}
                  </td>
                  <td className="py-3 px-4 text-xs capitalize whitespace-nowrap">{p.locality}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        p.status === "SOLD"
                          ? "bg-ink text-sand"
                          : p.status === "ACTIVE"
                          ? "bg-moss/10 text-moss"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to={`/properties/${p.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-ink/20 px-2 py-1 text-xs font-semibold text-ink hover:bg-sand transition"
                      >
                        View
                      </Link>

                      {p.status !== "SOLD" && (
                        <>
                          <button
                            onClick={() => setSoldModalProp(p)}
                            className="rounded-lg bg-moss/10 text-moss border border-moss/30 px-2 py-1 text-xs font-semibold hover:bg-moss/20 transition whitespace-nowrap"
                          >
                            Mark SOLD
                          </button>
                          <button
                            onClick={() => setStatusTarget(p)}
                            className={`rounded-lg border px-2 py-1 text-xs font-semibold transition whitespace-nowrap ${
                              p.status === "ACTIVE"
                                ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                                : "border-moss/40 bg-moss/10 text-moss hover:bg-moss/20"
                            }`}
                          >
                            {p.status === "ACTIVE" ? "Disable" : "Enable"}
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-2 py-1 text-xs font-semibold hover:bg-red-100 transition whitespace-nowrap"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SOLD Authority Modal */}
      {soldModalProp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-moss font-bold">Superadmin Authority</span>
              <h3 className="font-serif text-xl font-bold mt-1">Execute SOLD State Transition</h3>
              <p className="text-xs text-ink/70 mt-1">
                Property: <strong className="text-ink">{soldModalProp.title}</strong>
              </p>
            </div>

            <form onSubmit={handleMarkSold} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">
                  Customer ID (Optional deed association)
                </label>
                <input
                  type="text"
                  placeholder="e.g. usr_c1... or leave blank"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full rounded-xl border border-ink/20 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brass"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => setSoldModalProp(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-ink/70 hover:bg-ink/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-sand hover:bg-ink/90 disabled:opacity-50"
                >
                  {actionLoading ? "Executing Deed..." : "Confirm & Mark SOLD"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disable / Enable Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(statusTarget)}
        title={statusTarget?.status === "ACTIVE" ? "Disable Property Listing" : "Enable Property Listing"}
        message={
          statusTarget?.status === "ACTIVE"
            ? `Are you sure you want to disable "${statusTarget?.title}"? It will immediately stop appearing in public Buy and Rent search results.`
            : `Re-enable "${statusTarget?.title}" to make it immediately searchable on the public platform.`
        }
        confirmLabel={statusTarget?.status === "ACTIVE" ? "Disable Listing" : "Enable Listing"}
        variant={statusTarget?.status === "ACTIVE" ? "warning" : "primary"}
        loading={actionLoading}
        onConfirm={handleToggleStatus}
        onCancel={() => setStatusTarget(null)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Permanently Delete Property"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? All photographs, customer favorites, leads, and schedule records will be permanently removed.`}
        confirmLabel="Permanently Delete"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleDeleteProperty}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
