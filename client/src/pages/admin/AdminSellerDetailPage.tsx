import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { inr, imgSrc } from "../../lib/format";
import type { Property } from "../../types";
import { ConfirmModal } from "../../components/ConfirmModal";
import { Badge } from "../../components/Badge";
import { toast } from "../../components/Toast";

type SellerData = {
  seller: {
    id: string;
    userId: string;
    companyName?: string | null;
    status: string;
    createdAt: string;
    approvedAt?: string | null;
    rejectionReason?: string | null;
    isDisabled?: boolean;
  };
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string | null;
    avatar?: string | null;
    avatarUrl?: string | null;
    createdAt: string;
    emailVerifiedAt?: string | null;
    isDisabled?: boolean;
  };
  stats: {
    totalProperties: number;
    activeProperties: number;
    inactiveProperties: number;
    soldProperties: number;
    totalViews: number;
  };
  properties: Property[];
};

export default function AdminSellerDetailPage() {
  const { sellerId } = useParams<{ sellerId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<SellerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [deletePropTarget, setDeletePropTarget] = useState<Property | null>(null);
  const [togglePropTarget, setTogglePropTarget] = useState<Property | null>(null);
  const [sellerStatusTarget, setSellerStatusTarget] = useState<"DISABLE" | "ENABLE" | null>(null);
  const [showDeleteSellerModal, setShowDeleteSellerModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSellerDetails = useCallback(async () => {
    if (!sellerId) return;
    setLoading(true);
    try {
      const res = await api.get<SellerData>(`/admin/sellers/${sellerId}`);
      setData(res);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load seller details");
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    void fetchSellerDetails();
  }, [fetchSellerDetails]);

  const handleApproveSeller = async () => {
    if (!data) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/sellers/${data.seller.id}/approve`);
      toast.success(`Approved "${data.user.name}" as an active seller!`);
      void fetchSellerDetails();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSeller = async () => {
    if (!data) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/sellers/${data.seller.id}/reject`, { reason: rejectReason });
      toast.success("Seller application rejected.");
      setShowRejectModal(false);
      setRejectReason("");
      void fetchSellerDetails();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Rejection failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePropertyStatus = async () => {
    if (!togglePropTarget) return;
    setActionLoading(true);
    try {
      const endpoint =
        togglePropTarget.status === "ACTIVE"
          ? `/admin/properties/${togglePropTarget.id}/disable`
          : `/admin/properties/${togglePropTarget.id}/enable`;
      await api.patch(endpoint);
      toast.success("Property status updated successfully");
      setTogglePropTarget(null);
      void fetchSellerDetails();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update property status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProperty = async () => {
    if (!deletePropTarget) return;
    setActionLoading(true);
    try {
      await api.delete(`/admin/properties/${deletePropTarget.id}`);
      toast.success("Property permanently deleted");
      setDeletePropTarget(null);
      void fetchSellerDetails();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete property");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSellerStatus = async () => {
    if (!sellerStatusTarget || !data) return;
    setActionLoading(true);
    try {
      if (sellerStatusTarget === "DISABLE") {
        await api.patch(`/admin/sellers/${data.seller.id}/disable`);
        toast.success("Seller and all listings disabled.");
      } else {
        await api.patch(`/admin/sellers/${data.seller.id}/enable`);
        toast.success("Seller account re-enabled.");
      }
      setSellerStatusTarget(null);
      void fetchSellerDetails();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update seller status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSeller = async () => {
    if (!data) return;
    setActionLoading(true);
    try {
      const res = await api.delete<{ ok: boolean; message: string }>(`/admin/sellers/${data.seller.id}`);
      toast.success(res.message || "Seller and properties permanently deleted.");
      navigate("/admin/sellers");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete seller");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="py-24 text-center text-ink/60">Loading seller profile &amp; inventory...</div>;
  if (error || !data) {
    return (
      <div className="rounded-[1.25rem] border border-red-200 bg-red-50 p-8 text-center space-y-3">
        <h3 className="font-display text-xl font-bold text-red-900 tracking-[-0.02em]">Seller Not Found</h3>
        <p className="text-sm text-red-700">{error || "Could not retrieve seller profile."}</p>
        <button
          onClick={() => navigate("/admin/sellers")}
          className="rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-sand hover:bg-ink/90"
        >
          ← Back to Sellers Directory
        </button>
      </div>
    );
  }

  const { seller, user, stats, properties } = data;
  const isSuspended = seller.status === "SUSPENDED" || seller.status === "DISABLED" || seller.isDisabled || user.isDisabled;
  const isPending = seller.status === "PENDING" || seller.status === "PENDING_APPROVAL" || seller.status === "PENDING_VERIFICATION";
  const isRejected = seller.status === "REJECTED";
  const isApproved = seller.status === "APPROVED" && !isSuspended;

  return (
    <div className="space-y-8 pb-16 animate-in-page">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-ink/60">
        <Link to="/admin/sellers" className="hover:text-ink font-semibold">
          ← Sellers Directory
        </Link>
        <span>/</span>
        <span className="text-ink">{user.name}</span>
      </div>

      {/* Seller Header Profile Card */}
      <div className="rounded-[1.25rem] border border-ink/10 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-5">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-pink-500 to-amber-500 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold font-display shadow-sm overflow-hidden flex-shrink-0">
              {(user.avatarUrl || user.avatar) ? (
                <img src={imgSrc(user.avatarUrl || user.avatar)} alt="" className="h-full w-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-[-0.02em]">{user.name}</h1>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                    isSuspended
                      ? "bg-red-100 text-red-800 border border-red-300"
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
                {user.emailVerifiedAt && (
                  <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold">
                    Email Verified ✓
                  </span>
                )}
              </div>

              {seller.companyName && (
                <p className="text-sm font-semibold text-brass">🏢 {seller.companyName}</p>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/70 pt-1">
                <span>✉️ {user.email}</span>
                {user.phone && <span>📞 {user.phone}</span>}
                <span>📅 Registered: {new Date(user.createdAt).toLocaleDateString()}</span>
                <span className="font-mono text-[10px] text-ink/40">ID: {seller.id}</span>
              </div>
            </div>
          </div>

          {/* Superadmin Controls: Approve, Reject, Disable, Enable */}
          <div className="flex flex-wrap items-center gap-2">
            {isPending && (
              <>
                <button
                  onClick={() => void handleApproveSeller()}
                  disabled={actionLoading}
                  className="rounded-xl bg-moss px-4 py-2 text-xs font-semibold text-white shadow hover:bg-moss/90 transition disabled:opacity-50"
                >
                  Approve Seller
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-2 text-xs font-semibold hover:bg-red-100 transition disabled:opacity-50"
                >
                  Reject Seller
                </button>
              </>
            )}

            {isApproved && (
              <button
                onClick={() => setSellerStatusTarget("DISABLE")}
                disabled={actionLoading}
                className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-2 text-xs font-semibold hover:bg-red-100 transition disabled:opacity-50"
              >
                Disable Seller
              </button>
            )}

            {isSuspended && (
              <button
                onClick={() => setSellerStatusTarget("ENABLE")}
                disabled={actionLoading}
                className="rounded-xl bg-moss px-4 py-2 text-xs font-semibold text-white shadow hover:bg-moss/90 transition disabled:opacity-50"
              >
                Enable Seller
              </button>
            )}

            {isRejected && (
              <button
                onClick={() => void handleApproveSeller()}
                disabled={actionLoading}
                className="rounded-xl bg-moss px-4 py-2 text-xs font-semibold text-white shadow hover:bg-moss/90 transition disabled:opacity-50"
              >
                Approve Seller
              </button>
            )}

            <Link
              to={`/sellers/${seller.id}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-ink/20 px-3.5 py-2 text-xs font-semibold text-ink hover:bg-sand transition"
            >
              Public Profile ↗
            </Link>

            <button
              onClick={() => setShowDeleteSellerModal(true)}
              disabled={actionLoading}
              className="rounded-xl border border-red-300 bg-red-50 text-red-700 px-3.5 py-2 text-xs font-semibold hover:bg-red-100 transition disabled:opacity-50"
              title="Permanently delete seller and all their properties"
            >
              Delete Seller
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-6 mt-6 border-t border-ink/10">
          <div className="rounded-2xl bg-sand/40 p-3">
            <span className="text-[10px] uppercase font-bold text-ink/50">Total Properties</span>
            <p className="font-display text-xl font-bold text-ink tracking-[-0.02em] mt-0.5">{stats.totalProperties}</p>
          </div>
          <div className="rounded-2xl bg-sand/40 p-3">
            <span className="text-[10px] uppercase font-bold text-moss">Active Searchable</span>
            <p className="font-display text-xl font-bold text-moss tracking-[-0.02em] mt-0.5">{stats.activeProperties}</p>
          </div>
          <div className="rounded-2xl bg-sand/40 p-3">
            <span className="text-[10px] uppercase font-bold text-amber-800">Inactive / Deactivated</span>
            <p className="font-display text-xl font-bold text-amber-800 tracking-[-0.02em] mt-0.5">{stats.inactiveProperties}</p>
          </div>
          <div className="rounded-2xl bg-sand/40 p-3">
            <span className="text-[10px] uppercase font-bold text-ink/50">Marked SOLD</span>
            <p className="font-display text-xl font-bold text-ink tracking-[-0.02em] mt-0.5">{stats.soldProperties}</p>
          </div>
          <div className="rounded-2xl bg-sand/40 p-3">
            <span className="text-[10px] uppercase font-bold text-ink/50">Total Views</span>
            <p className="font-display text-xl font-bold text-ink tracking-[-0.02em] mt-0.5">{stats.totalViews}</p>
          </div>
        </div>
      </div>

      {/* Seller Inventory Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold tracking-[-0.02em]">Seller Properties ({properties.length})</h2>
            <p className="text-xs text-ink/60">
              Complete catalogued inventory listed by {user.name}
            </p>
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="rounded-[1.25rem] border border-ink/10 bg-white p-12 text-center text-ink/60">
            This seller has not posted any property listings yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <div
                key={p.id}
                className="overflow-hidden rounded-[1.25rem] border border-ink/10 bg-white shadow-sm transition hover:shadow-md card-hover flex flex-col justify-between"
              >
                <div>
                  <div className="relative">
                    <img
                      src={imgSrc(p.primaryImage || p.images?.[0]?.path)}
                      alt=""
                      className="h-44 w-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          p.status === "ACTIVE"
                            ? "bg-moss text-white"
                            : p.status === "SOLD"
                            ? "bg-ink text-sand"
                            : "bg-amber-600 text-white"
                        }`}
                      >
                        {p.status}
                      </span>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-brass text-ink">
                        {p.listingType === "RENT" ? "FOR RENT" : "FOR SALE"}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-display text-base font-bold line-clamp-1 tracking-[-0.01em]">{p.title}</h3>
                    <p className="font-display text-lg font-bold text-brass tracking-[-0.02em]">
                      {p.listingType === "RENT" ? `${inr(p.price)}/mo` : inr(p.price)}
                    </p>
                    <p className="text-xs text-ink/70">
                      {p.bhk} BHK · {p.carpetArea} sq ft · <span className="capitalize">{p.locality}</span>
                    </p>

                    <div className="text-[11px] text-ink/50 pt-1 border-t border-ink/5 flex items-center justify-between">
                      <span>📍 {p.latitude?.toFixed(4)}, {p.longitude?.toFixed(4)}</span>
                      <span>👁 {p.views ?? 0} views</span>
                    </div>
                  </div>
                </div>

                {/* Property Admin Action Bar */}
                <div className="border-t border-ink/5 p-3 bg-sand/20 flex flex-wrap gap-2 justify-between items-center text-xs">
                  <Link
                    to={`/properties/${p.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-moss/10 text-moss border border-moss/30 px-2.5 py-1 font-semibold hover:bg-moss/20 transition"
                  >
                    View
                  </Link>

                  <div className="flex items-center gap-1.5">
                    {p.status !== "SOLD" && (
                      <button
                        onClick={() => setTogglePropTarget(p)}
                        className={`rounded-lg border px-2.5 py-1 font-semibold transition ${
                          p.status === "ACTIVE"
                            ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                            : "border-moss/40 bg-moss/10 text-moss hover:bg-moss/20"
                        }`}
                      >
                        {p.status === "ACTIVE" ? "Disable" : "Enable"}
                      </button>
                    )}
                    <button
                      onClick={() => setDeletePropTarget(p)}
                      className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-2.5 py-1 font-semibold hover:bg-red-100 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={Boolean(togglePropTarget)}
        title={togglePropTarget?.status === "ACTIVE" ? "Disable Property Listing" : "Enable Property Listing"}
        message={
          togglePropTarget?.status === "ACTIVE"
            ? `Disable "${togglePropTarget?.title}"? It will immediately stop appearing in customer Buy and Rent searches.`
            : `Re-enable "${togglePropTarget?.title}"? It will immediately be made visible to prospective buyers and tenants in public search.`
        }
        confirmLabel={togglePropTarget?.status === "ACTIVE" ? "Disable Listing" : "Enable Listing"}
        variant={togglePropTarget?.status === "ACTIVE" ? "warning" : "primary"}
        loading={actionLoading}
        onConfirm={handleTogglePropertyStatus}
        onCancel={() => setTogglePropTarget(null)}
      />

      <ConfirmModal
        isOpen={Boolean(deletePropTarget)}
        title="Permanently Delete Property"
        message={`Are you sure you want to permanently delete "${deletePropTarget?.title}"? This action cannot be undone and will purge all photos, saved favorites, inquiries, and schedules from MongoDB.`}
        confirmLabel="Permanently Delete"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleDeleteProperty}
        onCancel={() => setDeletePropTarget(null)}
      />

      <ConfirmModal
        isOpen={Boolean(sellerStatusTarget)}
        title={sellerStatusTarget === "DISABLE" ? "Disable Seller Account" : "Enable Seller Account"}
        message={
          sellerStatusTarget === "DISABLE"
            ? `Disabling "${user.name}" will immediately prevent this seller from authenticating and will automatically hide all their properties from public search results.`
            : `Enabling "${user.name}" will restore seller login access and restore their active properties to public search results.`
        }
        confirmLabel={sellerStatusTarget === "DISABLE" ? "Disable Seller" : "Enable Seller"}
        variant={sellerStatusTarget === "DISABLE" ? "danger" : "primary"}
        loading={actionLoading}
        onConfirm={handleSellerStatus}
        onCancel={() => setSellerStatusTarget(null)}
      />

      {/* Reject Modal with Reason */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[1.25rem] bg-white p-6 shadow-xl space-y-4">
            <h3 className="font-display text-lg font-bold text-ink tracking-[-0.01em]">
              Reject Seller Application
            </h3>
            <p className="text-xs text-ink/70">
              Rejecting <span className="font-bold">{user.name}</span> ({seller.companyName || "Direct Seller"}).
            </p>
            <div>
              <label className="block text-xs font-semibold text-ink/70 mb-1">
                Reason for Rejection (Optional)
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Incomplete broker license or documentation..."
                className="w-full rounded-xl border border-ink/20 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brass"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="rounded-xl border border-ink/20 px-4 py-2 text-xs font-semibold text-ink/70 hover:bg-sand transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleRejectSeller}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanently Delete Seller & Properties Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteSellerModal}
        title="Permanently Delete Seller & All Properties"
        message={`Are you sure you want to permanently delete seller "${user.name}" (${seller.companyName || "Direct Seller"})? This will permanently delete their account and ALL ${stats.totalProperties} properties listed by them from the database. This action cannot be undone.`}
        confirmLabel="Delete Seller & Properties"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleDeleteSeller}
        onCancel={() => setShowDeleteSellerModal(false)}
      />
    </div>
  );
}
