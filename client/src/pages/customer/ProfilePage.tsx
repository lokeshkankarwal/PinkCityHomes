import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth";
import { api } from "../../api/client";
import { imgSrc } from "../../lib/format";
import { Badge } from "../../components/Badge";
import { ConfirmModal } from "../../components/ConfirmModal";
import { toast } from "../../components/Toast";

export default function ProfilePage() {
  const { user, refresh, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Modal
  const [showRemovePhotoModal, setShowRemovePhotoModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <div className="py-24 text-center space-y-4">
        <p className="font-display text-2xl font-bold text-navy">Account Profile</p>
        <p className="text-xs text-slate-500">Please log in to view and manage your profile.</p>
        <Link to="/login" className="inline-block rounded-2xl bg-navy px-5 py-2.5 text-xs font-semibold text-white shadow">
          Sign In
        </Link>
      </div>
    );
  }

  const handleStartEdit = () => {
    setName(user.name);
    setPhone(user.phone || "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setName(user.name);
    setPhone(user.phone || "");
    setIsEditing(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch("/auth/profile", { name: name.trim(), phone: phone.trim() || undefined });
      await refresh();
      toast.success("Profile information updated successfully!");
      setIsEditing(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Please select a JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile image must be less than 5MB.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile) return;
    setAvatarLoading(true);

    const formData = new FormData();
    formData.append("avatar", selectedFile);

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
      toast.success("Profile photo updated successfully!");
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleCancelPhotoUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveAvatar = async () => {
    setAvatarLoading(true);
    try {
      await api.del("/auth/profile/avatar");
      await refresh();
      toast.success("Profile photo removed.");
      setShowRemovePhotoModal(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to remove photo");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate("/login");
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto max-w-3xl py-8 space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-pink-600">Account Management</span>
        <h1 className="font-display text-3xl font-bold text-navy mt-1">Profile &amp; Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage your personal details, profile image, and review account permissions
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-8 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          {/* Avatar with Preview & Edit */}
          <div className="relative group">
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden border-4 border-slate-100 bg-gradient-to-tr from-pink-600 via-rose-500 to-amber-500 flex items-center justify-center text-white font-display text-3xl font-bold shadow-md">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
              ) : user.avatarUrl ? (
                <img src={imgSrc(user.avatarUrl)} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-navy text-white flex items-center justify-center shadow-md hover:bg-pink-600 transition"
              title="Change profile photo"
            >
              📷
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="font-display text-2xl font-bold text-navy truncate">{user.name}</h2>
              <Badge status={user.role} />
            </div>
            <p className="text-xs text-slate-500">{user.email}</p>
            {user.companyName && (
              <p className="text-xs font-semibold text-pink-600">🏢 {user.companyName}</p>
            )}
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={handleStartEdit}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition active:scale-95 shadow-xs"
            >
              Edit Details
            </button>
          )}
        </div>

        {/* Photo Upload Confirmation Ribbon if a file is selected */}
        {selectedFile && (
          <div className="rounded-3xl border border-pink-200 bg-pink-50/70 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-slide-in-up">
            <div className="text-xs text-pink-900 font-medium">
              New profile image selected: <span className="font-bold">{selectedFile.name}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancelPhotoUpload}
                disabled={avatarLoading}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadPhoto}
                disabled={avatarLoading}
                className="rounded-xl bg-pink-600 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-pink-700 disabled:opacity-50"
              >
                {avatarLoading ? "Uploading..." : "Save Photo"}
              </button>
            </div>
          </div>
        )}

        {/* Remove photo action if photo exists and not previewing */}
        {user.avatarUrl && !selectedFile && (
          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => setShowRemovePhotoModal(true)}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 transition"
            >
              Remove profile photo
            </button>
          </div>
        )}
      </div>

      {/* Personal Information Form / View */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-8 shadow-card space-y-6">
        <h3 className="font-display text-xl font-bold text-navy">Personal Information</h3>

        {isEditing ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98000 00000"
                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email Address</label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Account email cannot be modified directly.</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-navy px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-navy-800 disabled:opacity-50 transition active:scale-95"
              >
                {loading ? "Saving Changes..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={loading}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="space-y-1 rounded-2xl bg-slate-50/70 p-4 border border-slate-100">
              <span className="text-slate-400 text-xs">Full Name</span>
              <p className="font-semibold text-navy">{user.name}</p>
            </div>
            <div className="space-y-1 rounded-2xl bg-slate-50/70 p-4 border border-slate-100">
              <span className="text-slate-400 text-xs">Email Address</span>
              <p className="font-semibold text-navy">{user.email}</p>
            </div>
            <div className="space-y-1 rounded-2xl bg-slate-50/70 p-4 border border-slate-100">
              <span className="text-slate-400 text-xs">Phone Number</span>
              <p className="font-semibold text-navy">{user.phone || "Not specified"}</p>
            </div>
            <div className="space-y-1 rounded-2xl bg-slate-50/70 p-4 border border-slate-100">
              <span className="text-slate-400 text-xs">Account Role</span>
              <p className="font-semibold text-navy uppercase tracking-wider">{user.role}</p>
            </div>
          </div>
        )}
      </div>

      {/* Account Security & Sign Out */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-base sm:text-lg font-bold text-navy">Session &amp; Security</h3>
          <p className="text-xs text-slate-500">Signed in securely on this device</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-2xl border border-rose-200 bg-rose-50/60 px-5 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition active:scale-95 self-start sm:self-auto"
        >
          Sign Out of Account
        </button>
      </div>

      {/* Remove Avatar Confirmation Modal */}
      <ConfirmModal
        isOpen={showRemovePhotoModal}
        title="Remove Profile Photo"
        message="Are you sure you want to remove your profile photo? Your avatar will revert to your initials."
        confirmLabel="Remove Photo"
        variant="danger"
        loading={avatarLoading}
        onConfirm={handleRemoveAvatar}
        onCancel={() => setShowRemovePhotoModal(false)}
      />
    </div>
  );
}
