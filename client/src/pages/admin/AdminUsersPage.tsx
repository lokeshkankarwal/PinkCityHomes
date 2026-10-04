import { useState, useEffect, useCallback } from "react";
import { api } from "../../api/client";
import { ConfirmModal } from "../../components/ConfirmModal";

type UserItem = {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string | null;
  emailVerifiedAt?: string | null;
  createdAt: string;
  isDisabled?: boolean;
  sellerProfile?: { status: string; companyName?: string | null; isDisabled?: boolean } | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "DISABLED">("ALL");

  // Disable / Enable modal state
  const [targetUser, setTargetUser] = useState<{ user: UserItem; action: "DISABLE" | "ENABLE" } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("q", debouncedSearch);
      if (statusFilter !== "ALL") params.append("status", statusFilter);

      const qs = params.toString() ? `?${params.toString()}` : "";
      const d = await api.get<{ results: UserItem[] }>(`/admin/users${qs}`);
      setUsers(d.results || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const handleToggleUserStatus = async () => {
    if (!targetUser) return;
    setActionLoading(true);
    try {
      if (targetUser.action === "DISABLE") {
        await api.patch(`/admin/users/${targetUser.user.id}/disable`);
      } else {
        await api.patch(`/admin/users/${targetUser.user.id}/enable`);
      }
      setTargetUser(null);
      void fetchUsers();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to update user status");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold">User Directory</h1>
        <p className="text-sm text-ink/70">
          Search, audit, and manage buyer, seller, and client accounts across PinkCityHomes
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative max-w-md w-full">
          <input
            type="text"
            placeholder="Search by name, email, phone, or user ID..."
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
        <div className="flex rounded-xl bg-ink/5 p-1 text-xs font-semibold">
          {(["ALL", "ACTIVE", "DISABLED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`rounded-lg px-4 py-1.5 transition ${
                statusFilter === tab
                  ? "bg-white text-ink shadow-sm font-bold"
                  : "text-ink/60 hover:text-ink"
              }`}
            >
              {tab === "ALL" ? "All Users" : tab === "ACTIVE" ? "Active" : "Disabled"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-ink/60">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="rounded-3xl border border-ink/10 bg-white p-12 text-center text-sm text-ink/60">
          No users found matching your search criteria.
        </div>
      ) : (
        <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs font-semibold text-ink/60 uppercase">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status / Company</th>
                <th className="py-3 px-4">Email Verification</th>
                <th className="py-3 px-4">Registered</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {users.map((u) => {
                const isUserDisabled = u.isDisabled === true;
                return (
                  <tr key={u.id} className="hover:bg-sand/20">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-ink">{u.name}</p>
                      <p className="text-xs font-mono text-ink/60">{u.email}</p>
                      {u.phone && <p className="text-[11px] text-ink/50">{u.phone}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          u.role === "SUPERADMIN"
                            ? "bg-ink text-sand"
                            : u.role === "SELLER"
                            ? "bg-brass/20 text-ink"
                            : "bg-moss/10 text-moss"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {isUserDisabled ? (
                        <span className="rounded-full bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 text-[10px] font-bold uppercase">
                          Disabled
                        </span>
                      ) : u.sellerProfile ? (
                        <span>
                          {u.sellerProfile.companyName || "Seller"} ({u.sellerProfile.status})
                        </span>
                      ) : (
                        <span className="text-moss font-medium">Active</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {u.role === "SELLER" ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            u.sellerProfile?.status === "APPROVED"
                              ? "bg-moss/10 text-moss border border-moss/30"
                              : u.sellerProfile?.status === "REJECTED"
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : u.sellerProfile?.status === "SUSPENDED" || u.sellerProfile?.isDisabled
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : "bg-amber-100 text-amber-900 border border-amber-300"
                          }`}
                        >
                          {u.sellerProfile?.status === "APPROVED"
                            ? "Approved"
                            : u.sellerProfile?.status === "REJECTED"
                            ? "Rejected"
                            : u.sellerProfile?.status === "SUSPENDED" || u.sellerProfile?.isDisabled
                            ? "Disabled"
                            : "Pending Approval"}
                        </span>
                      ) : u.role === "SUPERADMIN" ? (
                        <span className="text-ink/40 text-[11px]">System Superadmin</span>
                      ) : u.emailVerifiedAt ? (
                        <span className="font-semibold text-moss">Verified ✓</span>
                      ) : (
                        <span className="text-amber-800 font-medium">Pending OTP</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-ink/60">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.role !== "SUPERADMIN" && (
                        isUserDisabled ? (
                          <button
                            onClick={() => setTargetUser({ user: u, action: "ENABLE" })}
                            className="rounded-xl bg-moss/10 text-moss border border-moss/30 px-3 py-1 text-xs font-semibold hover:bg-moss/20 transition"
                          >
                            Re-enable
                          </button>
                        ) : (
                          <button
                            onClick={() => setTargetUser({ user: u, action: "DISABLE" })}
                            className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-1 text-xs font-semibold hover:bg-red-100 transition"
                          >
                            Disable
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(targetUser)}
        title={targetUser?.action === "DISABLE" ? "Disable User Account" : "Re-enable User Account"}
        message={
          targetUser?.action === "DISABLE"
            ? `Are you sure you want to disable account for "${targetUser?.user.name}" (${targetUser?.user.email})? They will be unable to log in to the platform.`
            : `Re-enable account for "${targetUser?.user.name}"? They will regain access to their PinkCityHomes account immediately.`
        }
        confirmLabel={targetUser?.action === "DISABLE" ? "Disable Account" : "Re-enable Account"}
        variant={targetUser?.action === "DISABLE" ? "danger" : "primary"}
        loading={actionLoading}
        onConfirm={handleToggleUserStatus}
        onCancel={() => setTargetUser(null)}
      />
    </div>
  );
}
