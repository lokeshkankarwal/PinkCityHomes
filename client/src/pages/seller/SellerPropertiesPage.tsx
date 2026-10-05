import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { inr, imgSrc } from "../../lib/format";
import type { Property } from "../../types";
import { LocationPickerMap } from "../../components/LocationPickerMap";
import { searchJaipurLocations, type JaipurLocation } from "../../services/jaipurLocations";
import { ConfirmModal } from "../../components/ConfirmModal";
import { Badge } from "../../components/Badge";
import { EmptyState } from "../../components/EmptyState";
import { toast } from "../../components/Toast";

export default function SellerPropertiesPage() {
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "SOLD">("ALL");

  // Deactivate and Delete modal states
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Property | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState<Property | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);

  // Wizard state (Steps 1 to 6)
  const [step, setStep] = useState(1);
  const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);

  // Locality autocomplete state
  const [localitySuggestions, setLocalitySuggestions] = useState<JaipurLocation[]>([]);
  const [showLocalityDropdown, setShowLocalityDropdown] = useState(false);

  // Form state
  const initialForm = {
    title: "",
    description: "",
    propertyType: "APARTMENT" as Property["propertyType"],
    listingType: "BUY" as "BUY" | "RENT",
    projectName: "",
    bhk: 2,
    bathrooms: 2,
    price: 7500000,
    carpetArea: 1150,
    superBuiltUpArea: 1400,
    furnishing: "SEMI_FURNISHED" as Property["furnishing"],
    floor: 4,
    totalFloors: 14,
    parking: 1,
    address: "",
    locality: "",
    city: "Jaipur",
    latitude: 26.9124,
    longitude: 75.7873,
    contactName: "",
    contactPhone: "",
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchMine = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ results: Property[] }>("/properties/mine");
      setProperties(res.results || []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setEditingProperty(null);
    setFormError(null);
    setStep(1);
    setIsLocationConfirmed(false);
    setShowAddModal(true);
  };

  useEffect(() => {
    void fetchMine();
    if (searchParams.get("new") === "1") {
      handleOpenAdd();
    }
    const statusParam = searchParams.get("status");
    if (statusParam && ["ACTIVE", "INACTIVE", "SOLD"].includes(statusParam.toUpperCase())) {
      setStatusFilter(statusParam.toUpperCase() as any);
    }
  }, [searchParams]);

  const handleOpenEdit = (p: Property) => {
    setFormData({
      title: p.title || "",
      description: p.description || "",
      propertyType: p.propertyType || "APARTMENT",
      listingType: (p.listingType as "BUY" | "RENT") || "BUY",
      projectName: p.projectName || "",
      bhk: p.bhk || 2,
      bathrooms: p.bathrooms || 1,
      price: p.price || 0,
      carpetArea: p.carpetArea || 0,
      superBuiltUpArea: p.superBuiltUpArea || p.carpetArea || 0,
      furnishing: p.furnishing || "SEMI_FURNISHED",
      floor: p.floor ?? 1,
      totalFloors: p.totalFloors ?? 1,
      parking: p.parking ?? 0,
      address: p.address || "",
      locality: p.locality || "",
      city: p.city || "Jaipur",
      latitude: p.latitude || 26.9124,
      longitude: p.longitude || 75.7873,
      contactName: p.contactName || "",
      contactPhone: p.contactPhone || "",
    });
    setEditingProperty(p);
    setFormError(null);
    setStep(1);
    setIsLocationConfirmed(true);
    setShowAddModal(true);
  };

  // Locality input handler with autocomplete
  const handleLocalityInput = (text: string) => {
    setFormData((prev) => ({ ...prev, locality: text }));
    setIsLocationConfirmed(false);
    if (text.trim().length >= 2) {
      const matches = searchJaipurLocations(text);
      setLocalitySuggestions(matches.slice(0, 6));
      setShowLocalityDropdown(true);
    } else {
      setLocalitySuggestions([]);
      setShowLocalityDropdown(false);
    }
  };

  const handleSelectLocality = (loc: JaipurLocation) => {
    setFormData((prev) => ({
      ...prev,
      locality: loc.name,
      latitude: loc.latitude,
      longitude: loc.longitude,
    }));
    setShowLocalityDropdown(false);
    setIsLocationConfirmed(true);
  };

  // Validation before going to next wizard step
  const handleNextStep = () => {
    setFormError(null);

    if (step === 1) {
      if (!formData.title.trim()) {
        setFormError("Please enter a property title.");
        return;
      }
      if (!formData.description.trim()) {
        setFormError("Please provide a property description.");
        return;
      }
    }

    if (step === 2) {
      if (formData.carpetArea <= 0) {
        setFormError("Please enter a valid carpet area.");
        return;
      }
    }

    if (step === 3) {
      if (!formData.locality.trim()) {
        setFormError("Please specify a locality in Jaipur.");
        return;
      }
      if (!formData.address.trim()) {
        setFormError("Please provide the street or residential address.");
        return;
      }
      if (!isLocationConfirmed) {
        setFormError("Please click 'Confirm Location' to verify the map coordinates.");
        return;
      }
    }

    if (step === 4) {
      if (formData.price <= 0) {
        setFormError("Please enter a valid price / monthly rent.");
        return;
      }
    }

    if (step === 5) {
      if (!formData.contactName.trim()) {
        setFormError("Please provide a representative contact name.");
        return;
      }
      if (!formData.contactPhone.trim()) {
        setFormError("Please provide a valid contact phone number.");
        return;
      }
    }

    setStep((s) => Math.min(6, s + 1));
  };

  const handlePrevStep = () => {
    setFormError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      if (editingProperty) {
        await api.patch(`/properties/${editingProperty.id}`, formData);
      } else {
        await api.post("/properties", formData);
      }
      setShowAddModal(false);
      setEditingProperty(null);
      void fetchMine();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed to save property");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivateTarget) return;
    setActionLoading(true);
    try {
      await api.patch(`/properties/${deactivateTarget.id}/status`);
      toast.success("Property status updated successfully");
      setDeactivateTarget(null);
      void fetchMine();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await api.delete(`/properties/${deleteTarget.id}`);
      toast.success("Property permanently deleted");
      setDeleteTarget(null);
      void fetchMine();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete property");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadImages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showUploadModal || !selectedFiles || selectedFiles.length === 0) return;
    setUploading(true);
    try {
      await api.upload(`/properties/${showUploadModal.id}/images`, selectedFiles);
      toast.success("Photos uploaded successfully!");
      setSelectedFiles(null);
      void fetchMine();
      setShowUploadModal(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to upload photos");
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      await api.post(`/properties/images/${imageId}/primary`);
      toast.success("Primary cover photo updated!");
      void fetchMine();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to set primary image");
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      await api.del(`/properties/images/${imageId}`);
      toast.success("Photo removed");
      void fetchMine();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete image");
    }
  };

  const stepsList = [
    { num: 1, label: "Basic" },
    { num: 2, label: "Specs" },
    { num: 3, label: "Location" },
    { num: 4, label: "Pricing" },
    { num: 5, label: "Contact" },
    { num: 6, label: "Review" },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-pink-600">Partner Inventory</span>
          <h1 className="font-display text-3xl font-bold text-slate-900 mt-1">My Property Listings</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Create, edit, and manage your inventory for sale or rent in Jaipur
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="rounded-2xl bg-pink-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-pink-700 transition active:scale-95 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>+</span> Add New Property
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-800">
          {error}
        </div>
      )}

      {/* Status Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", "ACTIVE", "INACTIVE", "SOLD"] as const).map((tab) => {
          const count =
            tab === "ALL"
              ? properties.length
              : properties.filter((p) => p.status === tab).length;
          const labels = {
            ALL: "All Properties",
            ACTIVE: "Active Listings",
            INACTIVE: "Inactive / Deactivated",
            SOLD: "Sold",
          };
          const isActive = statusFilter === tab;
          return (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`rounded-2xl px-4 py-2 text-xs font-bold transition-all active:scale-95 border ${
                isActive
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"
              }`}
            >
              {labels[tab]} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs font-semibold text-slate-400">Loading listings...</div>
      ) : properties.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <p className="font-display text-xl font-bold text-slate-900">No properties listed yet</p>
          <p className="text-xs text-slate-500">
            Add your first property listing for sale or rent to begin receiving customer inquiries and scheduling tours.
          </p>
          <button
            onClick={handleOpenAdd}
            className="rounded-2xl bg-pink-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-pink-700 transition"
          >
            + Create Property
          </button>
        </div>
      ) : properties.filter((p) => (statusFilter === "ALL" ? true : p.status === statusFilter)).length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-xs font-semibold text-slate-500">
          No properties found under "{statusFilter === "INACTIVE" ? "Inactive / Deactivated" : statusFilter}".
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties
            .filter((p) => (statusFilter === "ALL" ? true : p.status === statusFilter))
            .map((p) => (
            <div
              key={p.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative">
                  <img
                    src={imgSrc(p.primaryImage)}
                    alt=""
                    className="h-48 w-full object-cover bg-slate-100"
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                    <Badge status={p.status} />
                    <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-900/90 text-white backdrop-blur-sm">
                      {p.listingType === "RENT" ? "FOR RENT" : "FOR SALE"}
                    </span>
                    {p.projectName && (
                      <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider bg-slate-900/80 text-white truncate max-w-[130px]">
                        🏢 {p.projectName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-display text-base font-bold text-slate-900 line-clamp-1">{p.title}</h3>
                  <p className="font-display text-xl font-bold text-slate-900">
                    {p.listingType === "RENT" ? `${inr(p.price)}/mo` : inr(p.price)}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">
                    {p.bhk} BHK · {p.carpetArea} sq ft · {p.locality}
                    {p.city ? `, ${p.city}` : ""}
                  </p>
                  <div className="flex gap-4 text-xs text-slate-400 pt-2 border-t border-slate-100">
                    <span>👁 Views: {p.views ?? 0}</span>
                    <span>📷 Photos: {p.images?.length ?? 0}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 p-3 bg-slate-50/70 flex flex-wrap gap-2 justify-between items-center text-xs">
                <div className="flex flex-wrap gap-1.5">
                  <Link
                    to={`/properties/${p.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-slate-100 text-slate-800 border border-slate-300 px-3 py-1.5 font-bold hover:bg-slate-200 transition"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="rounded-xl bg-slate-900 text-white px-3 py-1.5 font-bold hover:bg-slate-800 transition shadow-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setShowUploadModal(p)}
                    className="rounded-xl bg-white border border-slate-300 px-3 py-1.5 font-bold text-slate-800 hover:bg-slate-100 transition shadow-xs"
                  >
                    Photos
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {p.status !== "SOLD" && (
                    <button
                      onClick={() => setDeactivateTarget(p)}
                      className={`rounded-xl border px-3 py-1.5 font-bold transition ${
                        p.status === "ACTIVE"
                          ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                          : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                      }`}
                    >
                      {p.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </button>
                  )}
                  {p.status === "SOLD" && (
                    <span className="text-[11px] font-bold text-slate-400">Marked SOLD</span>
                  )}
                  <button
                    onClick={() => setDeleteTarget(p)}
                    className="rounded-xl border border-rose-300 bg-rose-50 text-rose-700 px-3 py-1.5 font-bold hover:bg-rose-100 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6-STEP PROPERTY CREATION & EDIT WIZARD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-[1.25rem] bg-white p-6 sm:p-8 shadow-2xl space-y-5 my-8 max-h-[92vh] overflow-y-auto flex flex-col justify-between">
            {/* Modal Header */}
            <div>
              <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-[-0.02em]">
                    {editingProperty ? "Edit Property Listing" : "Add Property Listing"}
                  </h2>
                  <p className="text-xs text-ink/60 mt-0.5">
                    Step {step} of 6: {stepsList[step - 1].label} Details
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-2xl text-ink/40 hover:text-ink font-light"
                >
                  &times;
                </button>
              </div>

              {/* Wizard Steps Progress Indicator */}
              <div className="grid grid-cols-6 gap-1.5 pt-4">
                {stepsList.map((s) => {
                  const isCurrent = s.num === step;
                  const isDone = s.num < step;
                  return (
                    <div
                      key={s.num}
                      className={`text-center py-1.5 px-1 rounded-xl border text-[10px] sm:text-[11px] font-bold transition ${
                        isCurrent
                          ? "bg-pink-600 text-white border-pink-600 shadow-sm"
                          : isDone
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-slate-50 text-slate-400 border-slate-200"
                      }`}
                    >
                      <span className="hidden sm:inline">{isDone ? `✓ ${s.label}` : `${s.num}. ${s.label}`}</span>
                      <span className="sm:hidden">{isDone ? "✓" : s.num}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="rounded-2xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-800 flex items-start gap-2.5 animate-fade-in">
                <span className="text-base leading-none">⚠️</span>
                <div>
                  <p className="font-bold text-red-900">Please review:</p>
                  <p className="mt-0.5">{formError}</p>
                </div>
              </div>
            )}

            {/* Form Steps Body */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* ── STEP 1: BASIC DETAILS ────────────────────────────────────── */}
              {step === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block font-semibold text-ink/70 mb-1.5">Listing Purpose</label>
                    <div className="flex rounded-xl bg-ink/5 p-1 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, listingType: "BUY" })}
                        className={`flex-1 rounded-lg py-2.5 transition ${
                          formData.listingType === "BUY" ? "bg-white shadow text-ink" : "text-ink/60 hover:text-ink"
                        }`}
                      >
                        🏷️ For Sale (Buy)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, listingType: "RENT" })}
                        className={`flex-1 rounded-lg py-2.5 transition ${
                          formData.listingType === "RENT" ? "bg-white shadow text-ink" : "text-ink/60 hover:text-ink"
                        }`}
                      >
                        🔑 For Rent (Lease)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-ink/70 mb-1">Property Type</label>
                    <select
                      value={formData.propertyType}
                      onChange={(e) => setFormData({ ...formData, propertyType: e.target.value as Property["propertyType"] })}
                      className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                    >
                      <option value="APARTMENT">Apartment</option>
                      <option value="VILLA">Villa</option>
                      <option value="INDEPENDENT_HOUSE">Independent House</option>
                      <option value="PLOT">Plot</option>
                      <option value="BUILDER_FLOOR">Builder Floor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-ink/70 mb-1">
                      Society / Apartment / Building Name <span className="font-normal text-ink/50">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mahima Panache, Manglam Grand City, Royal Oasis..."
                      value={formData.projectName}
                      onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                      className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-ink/70 mb-1">Listing Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Spacious 3 BHK with Modular Kitchen & Park View in Malviya Nagar"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-ink/70 mb-1">Detailed Description *</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Highlight property amenities, ventilation, natural light, proximity to schools, metro, hospitals..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                    />
                  </div>
                </div>
              )}

              {/* ── STEP 2: PROPERTY SPECIFICATIONS ────────────────────────────── */}
              {step === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-ink/70 mb-1">Bedrooms (BHK)</label>
                      <input
                        type="number"
                        min={0}
                        value={formData.bhk}
                        onChange={(e) => setFormData({ ...formData, bhk: Number(e.target.value) })}
                        className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-ink/70 mb-1">Bathrooms</label>
                      <input
                        type="number"
                        min={1}
                        value={formData.bathrooms}
                        onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
                        className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-ink/70 mb-1">Carpet Area (sq ft) *</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={formData.carpetArea}
                        onChange={(e) => setFormData({ ...formData, carpetArea: Number(e.target.value) })}
                        className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-ink/70 mb-1">Super Built-up Area (sq ft)</label>
                      <input
                        type="number"
                        min={1}
                        value={formData.superBuiltUpArea}
                        onChange={(e) => setFormData({ ...formData, superBuiltUpArea: Number(e.target.value) })}
                        className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-ink/70 mb-1">Furnishing</label>
                      <select
                        value={formData.furnishing}
                        onChange={(e) => setFormData({ ...formData, furnishing: e.target.value as Property["furnishing"] })}
                        className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                      >
                        <option value="UNFURNISHED">Unfurnished</option>
                        <option value="SEMI_FURNISHED">Semi-Furnished</option>
                        <option value="FULLY_FURNISHED">Fully Furnished</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-ink/70 mb-1">Floor / Total</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Floor"
                          value={formData.floor}
                          onChange={(e) => setFormData({ ...formData, floor: Number(e.target.value) })}
                          className="w-1/2 rounded-xl border border-ink/20 px-2 py-2 text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Total"
                          value={formData.totalFloors}
                          onChange={(e) => setFormData({ ...formData, totalFloors: Number(e.target.value) })}
                          className="w-1/2 rounded-xl border border-ink/20 px-2 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-ink/70 mb-1">Parking Slots</label>
                      <input
                        type="number"
                        min={0}
                        value={formData.parking}
                        onChange={(e) => setFormData({ ...formData, parking: Number(e.target.value) })}
                        className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 3: LOCATION & INTERACTIVE MAP ──────────────────────────── */}
              {step === 3 && (
                <div className="space-y-4 animate-fade-in">
                  {/* Locality Autocomplete */}
                  <div className="relative">
                    <label className="block font-semibold text-ink/70 mb-1">
                      Jaipur Locality * <span className="font-normal text-ink/50">(Type to search micro-markets)</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mansarovar, Malviya Nagar, Jagatpura, Vaishali Nagar..."
                      value={formData.locality}
                      onChange={(e) => handleLocalityInput(e.target.value)}
                      onFocus={() => {
                        if (formData.locality.trim().length >= 2) {
                          setLocalitySuggestions(searchJaipurLocations(formData.locality).slice(0, 6));
                          setShowLocalityDropdown(true);
                        }
                      }}
                      className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                    />

                    {/* Suggestions Dropdown */}
                    {showLocalityDropdown && localitySuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-2xl border border-ink/10 bg-white shadow-xl">
                        {localitySuggestions.map((loc) => (
                          <button
                            key={loc.name}
                            type="button"
                            onClick={() => handleSelectLocality(loc)}
                            className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs hover:bg-sand/50 transition border-b border-ink/5 last:border-0"
                          >
                            <span className="font-semibold text-ink">📍 {loc.name}</span>
                            <span className="text-[10px] text-pink-700 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200">
                              {loc.category}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-ink/70 mb-1">City</label>
                      <input
                        type="text"
                        disabled
                        value="Jaipur, Rajasthan"
                        className="w-full rounded-xl border border-ink/15 bg-sand/30 px-3 py-2 text-sm text-ink/70"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-ink/70 mb-1">Full Street Address *</label>
                      <input
                        type="text"
                        required
                        placeholder="Plot / Flat No., Road, Landmark"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                      />
                    </div>
                  </div>

                  {/* Leaflet Location Picker Map */}
                  <div>
                    <label className="block font-semibold text-ink/70 mb-1">
                      Set Exact Pin on Map * <span className="font-normal text-ink/50">(Drag pin or tap map)</span>
                    </label>
                    <LocationPickerMap
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      onChange={({ latitude, longitude }) => {
                        setFormData((prev) => ({ ...prev, latitude, longitude }));
                        setIsLocationConfirmed(false);
                      }}
                      isConfirmed={isLocationConfirmed}
                      onConfirm={() => setIsLocationConfirmed(true)}
                      locality={formData.locality}
                    />
                  </div>
                </div>
              )}

              {/* ── STEP 4: PRICING & FINANCIALS ──────────────────────────────── */}
              {step === 4 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block font-semibold text-ink/70 mb-1">
                      {formData.listingType === "RENT" ? "Monthly Rent (₹ INR / month) *" : "Total Property Price (₹ INR) *"}
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm font-display font-bold text-ink focus:outline-none focus:ring-2 focus:ring-pink-300"
                    />
                    <p className="mt-1 text-xs font-display font-bold text-pink-700">
                      Formatted: {inr(formData.price)} {formData.listingType === "RENT" ? "/ month" : ""}
                    </p>
                  </div>

                  {/* Financial calculation snippet */}
                  {formData.carpetArea > 0 && formData.listingType !== "RENT" && (
                    <div className="rounded-2xl bg-sand/30 border border-ink/5 p-4 space-y-1">
                      <p className="font-semibold text-ink">Estimated Unit Rate</p>
                      <p className="text-sm font-display font-bold text-ink">
                        ₹{Math.round(formData.price / formData.carpetArea).toLocaleString("en-IN")} / sq ft
                      </p>
                      <p className="text-[11px] text-ink/60">
                        Based on {formData.carpetArea} sq ft carpet area.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 5: CONTACT REPRESENTATIVE ────────────────────────────── */}
              {step === 5 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block font-semibold text-ink/70 mb-1">Contact Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-ink/70 mb-1">Contact Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98290 12345"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                    />
                  </div>

                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800">
                    <p className="font-bold">Representative Inquiries:</p>
                    <p className="mt-0.5">
                      Interested buyers or tenants will contact this phone number and arrange scheduled site visits.
                    </p>
                  </div>
                </div>
              )}

              {/* ── STEP 6: REVIEW & PUBLISH ─────────────────────────────────── */}
              {step === 6 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="rounded-2xl bg-sand/30 border border-ink/10 p-5 space-y-3">
                    <h3 className="font-display text-lg font-bold text-ink tracking-[-0.01em] border-b border-ink/10 pb-2">
                      Listing Summary
                    </h3>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-ink/60">Title:</span>
                        <p className="font-bold text-ink">{formData.title}</p>
                      </div>

                      <div>
                        <span className="text-ink/60">Purpose:</span>
                        <p className="font-bold text-ink">
                          {formData.listingType === "RENT" ? "For Rent" : "For Sale"} ({formData.propertyType})
                        </p>
                      </div>

                      <div>
                        <span className="text-ink/60">Specs:</span>
                        <p className="font-bold text-ink">
                          {formData.bhk} BHK · {formData.bathrooms} Baths · {formData.carpetArea} sq ft
                        </p>
                      </div>

                      <div>
                        <span className="text-ink/60">Price:</span>
                        <p className="font-bold text-pink-700 font-display text-base">
                          {inr(formData.price)} {formData.listingType === "RENT" ? "/mo" : ""}
                        </p>
                      </div>

                      <div>
                        <span className="text-ink/60">Location:</span>
                        <p className="font-bold text-ink capitalize">
                          📍 {formData.locality}, Jaipur
                        </p>
                        <p className="text-[11px] text-ink/60 truncate">{formData.address}</p>
                      </div>

                      <div>
                        <span className="text-ink/60">Contact:</span>
                        <p className="font-bold text-ink">{formData.contactName}</p>
                        <p className="text-[11px] text-ink/60">{formData.contactPhone}</p>
                      </div>
                    </div>

                    {/* Verification Checklist */}
                    <div className="pt-3 border-t border-ink/10 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                        <span>✓</span>
                        <span>Basic details &amp; specifications complete</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                        <span>✓</span>
                        <span>Map coordinates verified</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                        <span>✓</span>
                        <span>Representative contact details attached</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard Bottom Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-ink/10">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="rounded-xl border border-ink/20 px-4 py-2 text-xs font-bold text-ink hover:bg-sand/60 transition"
                  >
                    ← Back
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-xl border border-ink/20 px-4 py-2 text-xs font-bold text-ink/70 hover:bg-sand/60 transition"
                  >
                    Cancel
                  </button>
                )}

                {step < 6 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="rounded-xl bg-ink px-6 py-2.5 text-xs font-bold text-sand hover:bg-pink-700 transition shadow"
                  >
                    Next: {stepsList[step].label} →
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-pink-600 px-7 py-2.5 text-xs font-bold text-white hover:bg-pink-700 transition shadow disabled:opacity-50"
                  >
                    {submitting ? "Publishing..." : editingProperty ? "Save Changes" : "Publish Property Listing"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Photos Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[1.25rem] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold tracking-[-0.02em]">Property Photos</h3>
              <button
                onClick={() => setShowUploadModal(null)}
                className="text-xl text-ink/50 hover:text-ink"
              >
                &times;
              </button>
            </div>
            <p className="text-xs text-ink/70">
              Manage uploaded images for <span className="font-bold">{showUploadModal.title}</span>.
            </p>

            {/* Current Images */}
            {showUploadModal.images && showUploadModal.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                {showUploadModal.images.map((img) => (
                  <div key={img.id} className="relative group rounded-lg overflow-hidden border border-ink/10">
                    <img src={imgSrc(img.path)} alt="" className="h-24 w-full object-cover" />
                    {img.isPrimary && (
                      <span className="absolute top-1 left-1 bg-brass text-ink text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                        Primary
                      </span>
                    )}
                    <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 p-1">
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={() => void handleSetPrimary(img.id)}
                          className="bg-white text-ink text-[10px] font-bold px-2 py-1 rounded shadow hover:bg-sand"
                        >
                          Star
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleDeleteImage(img.id)}
                        className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow hover:bg-red-700"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Input */}
            <form onSubmit={handleUploadImages} className="space-y-4 pt-2 border-t border-ink/10">
              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">
                  Upload High-Resolution Photos
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setSelectedFiles(e.target.files)}
                  className="w-full text-xs text-ink/70 file:mr-3 file:rounded-xl file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-sand hover:file:bg-ink/80"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-ink/70 hover:bg-ink/5"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFiles || selectedFiles.length === 0}
                  className="rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-sand hover:bg-ink/90 disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload Photos"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate / Reactivate Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deactivateTarget)}
        title={deactivateTarget?.status === "ACTIVE" ? "Deactivate Property Listing" : "Reactivate Property Listing"}
        message={
          deactivateTarget?.status === "ACTIVE"
            ? `Are you sure you want to deactivate "${deactivateTarget?.title}"? The property will be hidden from public Buy and Rent searches, but will remain safely in your account under the Inactive section.`
            : `Reactivate "${deactivateTarget?.title}" to make it immediately visible to prospective buyers and tenants in public search results.`
        }
        confirmLabel={deactivateTarget?.status === "ACTIVE" ? "Deactivate Listing" : "Reactivate Listing"}
        variant={deactivateTarget?.status === "ACTIVE" ? "warning" : "primary"}
        loading={actionLoading}
        onConfirm={handleDeactivateConfirm}
        onCancel={() => setDeactivateTarget(null)}
      />

      {/* Permanent Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Permanently Delete Property"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? This action cannot be undone. All photos, customer favorites, leads, and schedule records will be permanently removed.`}
        confirmLabel="Permanently Delete"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
