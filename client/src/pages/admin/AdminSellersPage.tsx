import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { ConfirmModal } from "../../components/ConfirmModal";

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

  // Rejection modal
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Disable / Enable modal
  const [statusModalTarget, setStatusModalTarget] = useState<{
    seller: SellerItem;
    action: "DISABLE" | "ENABLE";
  } | null>(null);
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

  const handleReview = async (id: string, action: "APPROVE" | "REJECT", reason?: string) => {
    setActionLoading(true);
    try {
      await api.post(`/admin/sellers/${id}/review`, { action, reason });
      setRejectId(null);
      setRejectReason("");
      void fetchSellers();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Review action failed");
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
      } else {
        await api.patch(`/admin/sellers/${statusModalTarget.seller.id}/enable`);
      }
      setStatusModalTarget(null);
      void fetchSellers();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to update seller status");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold">Seller Verification &amp; Governance</h1>
        <p className="text-sm text-ink/70">
          Superadmin approval controls, credentials review, and listing inventory oversight for agencies and individual sellers
        </p>
      </div>

      {/* Controls: Search + Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative max-w-md w-full">
          <input
            type="text"
            placeholder="Search by company, agent name, email, phone, or ID..."
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
            { id: "PENDING", label: "Pending Approvals" },
            { id: "APPROVED", label: "Approved" },
            { id: "SUSPENDED", label: "Suspended / Disabled" },
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
          No sellers found matching your search and filter criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {sellers.map((s) => {
            const isSuspended = s.status === "SUSPENDED" || s.isDisabled || s.user?.isDisabled;
            const isPending = s.status === "PENDING_APPROVAL" || s.status === "PENDING_VERIFICATION";

            return (
              <div
                key={s.id}
                className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-sand flex items-center justify-center text-ink font-serif font-bold text-lg flex-shrink-0 border border-ink/10">
                      {s.user?.name?.charAt(0).toUpperCase()}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/admin/sellers/${s.id}`}
                          className="font-serif text-lg font-bold text-ink hover:text-brass transition"
                        >
                          {s.user?.name}
                        </Link>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isSuspended
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : isPending
                              ? "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
                              : "bg-moss/10 text-moss border border-moss/30"
                          }`}
                        >
                          {isSuspended ? "SUSPENDED" : s.status}
                        </span>
                        <span className="rounded-full bg-ink/5 px-2.5 py-0.5 text-[10px] font-semibold text-ink/70">
                          🏡 {s.propertiesCount ?? 0} Properties
                        </span>
                      </div>

                      {s.companyName && (
                        <p className="text-xs font-semibold text-brass">🏢 {s.companyName}</p>
                      )}

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/60">
                        <span className="font-mono">{s.user?.email}</span>
                        {s.user?.phone && <span>📞 {s.user.phone}</span>}
                        <span>Registered {new Date(s.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/admin/sellers/${s.id}`}
                      className="rounded-xl border border-ink/20 px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-sand transition"
                    >
                      View Properties &amp; Profile &rarr;
                    </Link>

                    {isPending && (
                      <>
                        <button
                          onClick={() => void handleReview(s.id, "APPROVE")}
                          disabled={actionLoading}
                          className="rounded-xl bg-moss px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-moss/90 transition disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectId(s.id)}
                          disabled={actionLoading}
                          className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {!isPending && (
                      isSuspended ? (
                        <button
                          onClick={() => setStatusModalTarget({ seller: s, action: "ENABLE" })}
                          className="rounded-xl bg-moss/10 text-moss border border-moss/30 px-3.5 py-1.5 text-xs font-semibold hover:bg-moss/20 transition"
                        >
                          Re-enable Seller
                        </button>
                      ) : (
                        <button
                          onClick={() => setStatusModalTarget({ seller: s, action: "DISABLE" })}
                          className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-3.5 py-1.5 text-xs font-semibold hover:bg-red-100 transition"
                        >
                          Suspend Seller
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Reject Reason Form Inline */}
                {rejectId === s.id && (
                  <div className="rounded-2xl bg-red-50/60 border border-red-200 p-4 space-y-3">
                    <label className="block text-xs font-semibold text-red-900">
                      Reason for Rejection (visible to applicant)
                    </label>
                    <textarea
                      rows={2}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="e.g., Incomplete broker license information, identity verification mismatch..."
                      className="w-full rounded-xl border border-red-200 p-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setRejectId(null);
                          setRejectReason("");
                        }}
                        className="rounded-lg px-3 py-1 text-xs text-ink/70 hover:bg-sand"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => void handleReview(s.id, "REJECT", rejectReason)}
                        className="rounded-lg bg-red-700 px-4 py-1 text-xs font-semibold text-white hover:bg-red-800"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Suspend / Re-enable Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(statusModalTarget)}
        title={statusModalTarget?.action === "DISABLE" ? "Suspend Seller Account" : "Re-enable Seller Account"}
        message={
          statusModalTarget?.action === "DISABLE"
            ? `Suspending "${statusModalTarget?.seller.user?.name}" (${statusModalTarget?.seller.companyName || "Direct Seller"}) will block them from accessing the seller console and will immediately exclude their properties from public search results.`
            : `Re-enabling "${statusModalTarget?.seller.user?.name}" will restore login credentials and return active property listings to public Buy and Rent search results.`
        }
        confirmLabel={statusModalTarget?.action === "DISABLE" ? "Suspend Account" : "Restore Account"}
        variant={statusModalTarget?.action === "DISABLE" ? "danger" : "primary"}
        loading={actionLoading}
        onConfirm={handleToggleSellerStatus}
        onCancel={() => setStatusModalTarget(null)}
      />
    </div>
  );
}
