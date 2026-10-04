import { useState, useRef } from "react";
import { useAuth } from "../../auth";
import { api } from "../../api/client";
import { imgSrc } from "../../lib/format";

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <div className="py-24 text-center space-y-4">
        <p className="font-serif text-2xl font-bold text-ink">Account Profile</p>
        <p className="text-sm text-ink/60">Please log in to view and manage your profile.</p>
      </div>
    );
  }

  const handleStartEdit = () => {
    setName(user.name);
    setPhone(user.phone || "");
    setMsg(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setName(user.name);
    setPhone(user.phone || "");
    setMsg(null);
    setIsEditing(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      await api.patch("/auth/profile", { name: name.trim(), phone: phone.trim() || undefined });
      await refresh();
      setMsg({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
    } catch (e: unknown) {
      setMsg({ type: "error", text: e instanceof Error ? e.message : "Failed to update profile" });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMsg({ type: "error", text: "Please select a JPEG, PNG, or WebP image." });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMsg({ type: "error", text: "Profile image must be less than 5MB." });
      return;
    }

    setAvatarLoading(true);
    setMsg(null);

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const token = localStorage.getItem("pch_jwt");
      const res = await fetch("/api/auth/profile/avatar", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to upload photo");
      }

      await refresh();
      setMsg({ type: "success", text: "Profile photo updated!" });
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to upload photo" });
    } finally {
      setAvatarLoading(false);
    }
  };

  // Helper for role label
  const roleLabel =
    user.role === "SUPERADMIN"
      ? "Platform Administrator"
      : user.role === "SELLER"
        ? "Verified Seller"
        : "Registered Buyer";

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto max-w-2xl py-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold sm:text-4xl text-ink">Account Profile</h1>
        <p className="text-sm text-ink/70 mt-1">
          {isEditing
            ? "Update your personal details and profile photo"
            : "View your personal account information and platform privileges"}
        </p>
      </div>

      {/* Notifications */}
      {msg && (
        <div
          className={`rounded-2xl p-4 text-sm font-semibold flex items-center justify-between animate-fade-in ${
            msg.type === "success"
              ? "bg-moss/10 border border-moss/20 text-moss"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          <span>{msg.text}</span>
          <button type="button" onClick={() => setMsg(null)} className="text-xs hover:opacity-75">
            &times;
          </button>
        </div>
      )}

      {/* READ-ONLY VIEW */}
      {!isEditing && (
        <div className="space-y-6">
          {/* Hero Profile Card */}
          <div className="rounded-3xl border border-ink/10 bg-white p-8 shadow-sm flex flex-col items-center text-center space-y-4">
            <div className="relative">
              {user.avatarUrl ? (
                <img
                  src={imgSrc(user.avatarUrl)}
                  alt={user.name}
                  className="h-28 w-28 rounded-full object-cover border-4 border-white shadow-lg ring-2 ring-pink-200"
                />
              ) : (
                <div className="h-28 w-28 rounded-full bg-gradient-to-tr from-ink to-pink-700 text-white font-serif text-3xl font-bold flex items-center justify-center border-4 border-white shadow-lg ring-2 ring-pink-200">
                  {initials || "P"}
                </div>
              )}
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-ink">{user.name}</h2>
              <p className="text-sm text-ink/60 font-mono mt-0.5">{user.email}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="rounded-full bg-ink px-3.5 py-1 text-xs font-bold text-sand shadow-sm">
                {roleLabel}
              </span>

              {user.role === "SELLER" && (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold border shadow-sm ${
                    user.sellerStatus === "APPROVED"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  {user.sellerStatus === "APPROVED" ? "✓ Approved Seller" : "⏳ Pending Approval"}
                </span>
              )}

              <span className="rounded-full bg-pink-50 text-pink-800 border border-pink-200 px-3 py-1 text-xs font-bold shadow-sm">
                ✓ Verified Account
              </span>
            </div>
          </div>

          {/* Contact Information */}
          <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-lg font-bold text-ink border-b border-ink/5 pb-2">
              Contact Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="rounded-2xl bg-sand/30 p-4 border border-ink/5 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink/50">Email Address</span>
                <p className="font-semibold text-ink break-all">{user.email}</p>
              </div>

              <div className="rounded-2xl bg-sand/30 p-4 border border-ink/5 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink/50">Phone Number</span>
                <p className="font-semibold text-ink">
                  {user.phone ? user.phone : <span className="text-ink/40 font-normal italic">Not provided</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-lg font-bold text-ink border-b border-ink/5 pb-2">
              Account Privileges
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink/50">Account Role</span>
                <p className="font-medium text-ink">{roleLabel}</p>
              </div>

              {user.companyName && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink/50">Agency / Business</span>
                  <p className="font-medium text-ink">{user.companyName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleStartEdit}
              className="inline-flex items-center gap-2 rounded-2xl bg-pink-600 px-8 py-3 font-serif text-sm font-bold text-white shadow-md hover:bg-pink-700 transition"
            >
              <span>✏️</span>
              <span>Update Profile</span>
            </button>
          </div>
        </div>
      )}

      {/* EDIT MODE VIEW */}
      {isEditing && (
        <div className="rounded-3xl border border-ink/10 bg-white p-8 shadow-sm space-y-6">
          <div className="border-b border-ink/5 pb-4">
            <h2 className="font-serif text-xl font-bold text-ink">Edit Profile</h2>
            <p className="text-xs text-ink/60 mt-0.5">
              Make changes to your profile picture and contact details below
            </p>
          </div>

          {/* Profile Photo Uploader */}
          <div className="rounded-2xl bg-sand/30 p-5 border border-ink/5 flex flex-col sm:flex-row items-center gap-5">
            <div className="relative flex-none">
              {user.avatarUrl ? (
                <img
                  src={imgSrc(user.avatarUrl)}
                  alt={user.name}
                  className="h-20 w-20 rounded-full object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-ink to-pink-700 text-white font-serif text-xl font-bold flex items-center justify-center border-2 border-white shadow-md">
                  {initials || "P"}
                </div>
              )}
              {avatarLoading && (
                <div className="absolute inset-0 bg-ink/60 rounded-full flex items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                </div>
              )}
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div>
                <p className="font-serif font-bold text-sm text-ink">Profile Picture</p>
                <p className="text-xs text-ink/60">JPEG, PNG, or WebP under 5MB.</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarFileChange}
                className="hidden"
              />

              <button
                type="button"
                disabled={avatarLoading}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-ink/20 px-4 py-2 text-xs font-bold text-ink shadow-sm hover:bg-sand transition disabled:opacity-50"
              >
                <span>📷</span>
                <span>{user.avatarUrl ? "Change Photo" : "Upload Photo"}</span>
              </button>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                Email Address (Read-only)
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full rounded-2xl border border-ink/10 bg-sand/40 px-4 py-2.5 text-sm text-ink/60 cursor-not-allowed"
              />
              <p className="text-[11px] text-ink/50 mt-1">
                Your email is verified and serves as your account login identifier.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-2xl border border-ink/20 px-4 py-2.5 text-sm font-medium text-ink focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98000 00000"
                className="w-full rounded-2xl border border-ink/20 px-4 py-2.5 text-sm font-medium text-ink focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 transition"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-ink/5">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={loading}
                className="rounded-2xl border border-ink/20 px-5 py-2.5 text-xs font-bold text-ink/80 hover:bg-sand transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-pink-600 px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-pink-700 transition disabled:opacity-50"
              >
                {loading ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
