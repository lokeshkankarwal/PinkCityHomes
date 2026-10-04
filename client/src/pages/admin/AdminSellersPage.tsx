import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { ConfirmModal } from "../../components/ConfirmModal";
import { Badge } from "../../components/Badge";
import { toast } from "../../components/Toast";

type SellerItem = {
  id: string;
  userId: string;
  companyName?: string | null;
  status: string;
  createdAt: string;
  propertiesCount?: number;
  isDisabled?: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string | null;
    emailVerifiedAt?: string | null;
    isDisabled?: boolean;
  };
};

export default function AdminSellersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") || "ALL";

  const [sellers, setSellers] = useState<SellerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>(initialStatus);

  // Modal actions
  const [rejectTarget, setRejectTarget] = useState<SellerItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SellerItem | null>(null);
  const [statusModalTarget, setStatusModalTarget] = useState<{
    seller: SellerItem;
    action: "DISABLE" | "ENABLE";
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Sync tab with URL
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

  const fetchSellers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("q", debouncedSearch);
      if (activeTab !== "ALL") params.append("status", activeTab);

      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await api.get<{ results: SellerItem[] }>(`/admin/sellers${qs}`);
      setSellers(res.results || []);
    } catch {
      setSellers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeTab]);

  useEffect(() => {
    void fetchSellers();
  }, [fetchSellers]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "ALL") {
      searchParams.delete("status");
    } else {
      searchParams.set("status", tab);
    }
    setSearchParams(searchParams);
  };

  const handleApprove = async (seller: SellerItem) => {
    setActionLoading(true);
    try {
      await api.post(`/admin/sellers/${seller.id}/approve`);
      toast.success(`Approved seller "${seller.user.name}" successfully!`);
      void fetchSellers();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/sellers/${rejectTarget.id}/reject`, { reason: rejectReason });
      toast.success("Seller application rejected.");
      setRejectTarget(null);
      setRejectReason("");
      void fetchSellers();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Rejection failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSellerStatus = async () => {
    if (!statusModalTarget) return;
    setActionLoading(true);
    try {
      if (statusModalTarget.action === "DISABLE") {
        await api.patch(`/admin/sellers/${statusModalTarget.seller.id}/disable`);
        toast.success("Seller account disabled.");
      } else {
        await api.patch(`/admin/sellers/${statusModalTarget.seller.id}/enable`);
        toast.success("Seller account re-enabled.");
      }
      setStatusModalTarget(null);
      void fetchSellers();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update seller status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSeller = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      const res = await api.delete<{ ok: boolean; message: string }>(`/admin/sellers/${deleteTarget.id}`);
      toast.success(res.message || "Seller and properties permanently deleted.");
      setDeleteTarget(null);
      void fetchSellers();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete seller");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold">Seller Management</h1>
        <p className="text-sm text-ink/70">
          Review, approve, reject, and govern property seller and agency access on PinkCityHomes
        </p>
      </div>

      {/* Controls: Search + Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative max-w-md w-full">
          <input
            type="text"
            placeholder="Search by name, company, email, phone, or ID..."
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

        {/* Status Filter Tabs */}
        <div className="flex rounded-xl bg-ink/5 p-1 text-xs font-semibold overflow-x-auto">
          {[
            { id: "ALL", label: "All Sellers" },
            { id: "PENDING", label: "Pending" },
            { id: "APPROVED", label: "Approved" },
            { id: "DISABLED", label: "Disabled" },
            { id: "REJECTED", label: "Rejected" },
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
        <div className="py-20 text-center text-ink/60">Loading sellers directory...</div>
      ) : sellers.length === 0 ? (
        <div className="rounded-3xl border border-ink/10 bg-white p-12 text-center text-sm text-ink/60">
          No sellers found in the &ldquo;{activeTab}&rdquo; view.
        </div>
      ) : (
        <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs font-semibold text-ink/60 uppercase">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Registration Date</th>
                <th className="py-3 px-4">Approval Status</th>
                <th className="py-3 px-4">Total Properties</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {sellers.map((s) => {
                const isSuspended = s.status === "SUSPENDED" || s.status === "DISABLED" || s.isDisabled || s.user?.isDisabled;
                const isPending = s.status === "PENDING" || s.status === "PENDING_APPROVAL" || s.status === "PENDING_VERIFICATION";
                const isRejected = s.status === "REJECTED";
                const isApproved = s.status === "APPROVED" && !isSuspended;

                return (
                  <tr key={s.id} className="hover:bg-sand/20 transition">
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/admin/sellers/${s.id}`}
                        className="font-semibold text-ink hover:text-pink-600 transition"
                      >
                        {s.user?.name}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-medium text-brass">
                      {s.companyName ? `🏢 ${s.companyName}` : "—"}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs text-ink/70">
                      {s.user?.email}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-ink/70">
                      {s.user?.phone || "—"}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-ink/60">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isSuspended
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : isPending
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : isRejected
                            ? "bg-stone-100 text-stone-700 border border-stone-300"
                            : "bg-moss/10 text-moss border border-moss/30"
                        }`}
                      >
                        {isSuspended
                          ? "Disabled"
                          : isPending
                          ? "Pending Approval"
                          : isRejected
                          ? "Rejected"
                          : "Approved"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-semibold text-ink/80">
                      🏡 {s.propertiesCount ?? 0}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/admin/sellers/${s.id}`}
                          className="rounded-lg border border-ink/20 px-2.5 py-1 text-xs font-semibold text-ink hover:bg-sand transition"
                        >
                          View Details
                        </Link>

                        {isPending && (
                          <>
                            <button
                              onClick={() => void handleApprove(s)}
                              disabled={actionLoading}
                              className="rounded-lg bg-moss px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-moss/90 transition disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectTarget(s)}
                              disabled={actionLoading}
                              className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <button
                            onClick={() => setStatusModalTarget({ seller: s, action: "DISABLE" })}
                            disabled={actionLoading}
                            className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-2.5 py-1 text-xs font-semibold hover:bg-red-100 transition"
                          >
                            Disable
                          </button>
                        )}

                        {isSuspended && (
                          <button
                            onClick={() => setStatusModalTarget({ seller: s, action: "ENABLE" })}
                            disabled={actionLoading}
                            className="rounded-lg bg-moss/10 text-moss border border-moss/30 px-2.5 py-1 text-xs font-semibold hover:bg-moss/20 transition"
                          >
                            Enable
                          </button>
                        )}

                        {isRejected && (
                          <button
                            onClick={() => void handleApprove(s)}
                            disabled={actionLoading}
                            className="rounded-lg bg-moss/10 text-moss border border-moss/30 px-2.5 py-1 text-xs font-semibold hover:bg-moss/20 transition"
                          >
                            Approve
                          </button>
                        )}

                        <button
                          onClick={() => setDeleteTarget(s)}
                          disabled={actionLoading}
                          className="rounded-lg border border-red-200 bg-white text-red-600 px-2.5 py-1 text-xs font-semibold hover:bg-red-50 transition"
                          title="Permanently delete seller and all their properties"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal with Reason */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-ink">
              Reject Seller Application
            </h3>
            <p className="text-xs text-ink/70">
              Rejecting <span className="font-bold">{rejectTarget.user?.name}</span> ({rejectTarget.companyName || "Direct Seller"}). They will not be able to log in or publish property listings.
            </p>
            <div>
              <label className="block text-xs font-semibold text-ink/70 mb-1">
                Reason for Rejection (Optional)
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Incomplete company documentation, license verification failure..."
                className="w-full rounded-xl border border-ink/20 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brass"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason("");
                }}
                className="rounded-xl border border-ink/20 px-4 py-2 text-xs font-semibold text-ink/70 hover:bg-sand transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleReject}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend / Re-enable Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(statusModalTarget)}
        title={statusModalTarget?.action === "DISABLE" ? "Disable Seller Account" : "Enable Seller Account"}
        message={
          statusModalTarget?.action === "DISABLE"
            ? `Disabling "${statusModalTarget?.seller.user?.name}" (${statusModalTarget?.seller.companyName || "Direct Seller"}) will immediately revoke their ability to log in and automatically hide all their properties from public search results.`
            : `Enabling "${statusModalTarget?.seller.user?.name}" will restore login credentials and return active property listings to public Buy and Rent search results.`
        }
        confirmLabel={statusModalTarget?.action === "DISABLE" ? "Disable Seller" : "Enable Seller"}
        variant={statusModalTarget?.action === "DISABLE" ? "danger" : "primary"}
        loading={actionLoading}
        onConfirm={handleToggleSellerStatus}
        onCancel={() => setStatusModalTarget(null)}
      />

      {/* Delete Seller & Properties Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Permanently Delete Seller & All Properties"
        message={`Are you sure you want to permanently delete seller "${deleteTarget?.user?.name}" (${deleteTarget?.companyName || "Direct Seller"})? This will permanently delete their account AND all properties listed by them from the database. This action cannot be undone.`}
        confirmLabel="Delete Seller & Properties"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleDeleteSeller}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

