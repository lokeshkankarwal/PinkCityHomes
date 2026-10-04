import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api/client";
import { inr, imgSrc } from "../../lib/format";
import { useAuth } from "../../auth";
import type { Property } from "../../types";
import { PropertyLocationMap } from "../../components/PropertyLocationMap";
import { PropertyCard } from "../../components/PropertyCard";
import { Badge } from "../../components/Badge";
import { toast } from "../../components/Toast";

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFullscreenGallery, setIsFullscreenGallery] = useState(false);
  const [similar, setSimilar] = useState<Property[]>([]);
  const [sellerOthers, setSellerOthers] = useState<Property[]>([]);

  // Visit modal state
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [visitNotes, setVisitNotes] = useState("");
  const [submittingVisit, setSubmittingVisit] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setActiveImageIndex(0);

    api
      .get<Property>(`/properties/${id}`)
      .then((p) => {
        setProperty(p);

        // Fetch other properties by this seller
        if (p.sellerId) {
          api
            .get<{ results: Property[] }>(`/properties?sellerId=${p.sellerId}&limit=4`)
            .then((res) => {
              const others = (res.results || []).filter((item) => item.id !== id);
              setSellerOthers(others.slice(0, 3));
            })
            .catch(() => {});
        }

        // Fetch similar properties from same locality or general catalogue
        api
          .get<{ results: Property[] }>(`/properties?limit=4`)
          .then((res) => {
            const others = (res.results || []).filter((item) => item.id !== id && item.sellerId !== p.sellerId);
            setSimilar(others.slice(0, 4));
          })
          .catch(() => {});
      })
      .catch((err: Error) => {
        setError(err.message || "Property not found");
        setProperty(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleFav = async () => {
    if (!user) {
      toast.info("Please log in to save favourites.");
      return;
    }
    if (!property) return;
    try {
      await api.post("/favourites", { propertyId: property.id });
      window.dispatchEvent(new Event("favourites-updated"));
      toast.success("Saved to your favourite properties!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save favourite");
    }
  };

  const handleCart = async () => {
    if (!user) {
      toast.info("Please log in to add to cart.");
      return;
    }
    if (!property) return;
    try {
      await api.post("/cart", { propertyId: property.id });
      window.dispatchEvent(new Event("cart-updated"));
      toast.success("Added property to purchase closing cart!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to add to cart");
    }
  };

  const handleScheduleVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.info("Please log in to schedule a visit.");
      setShowVisitModal(false);
      return;
    }
    if (!property || !visitDate) return;
    setSubmittingVisit(true);
    try {
      await api.post("/visits/request", {
        propertyId: property.id,
        scheduledAt: new Date(visitDate).toISOString(),
        notes: visitNotes,
      });
      toast.success("Visit scheduled successfully! The seller has been notified.");
      setShowVisitModal(false);
      setVisitDate("");
      setVisitNotes("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to schedule visit");
    } finally {
      setSubmittingVisit(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-pink-600 border-r-transparent" />
        <p className="text-xs font-semibold text-slate-500">Loading verified property details...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="py-24 text-center space-y-4 max-w-md mx-auto">
        <div className="text-5xl">🏡</div>
        <h2 className="font-display text-2xl font-bold text-navy">Property Not Found</h2>
        <p className="text-xs text-slate-500">The property you are looking for does not exist or has been deactivated.</p>
        <Link
          to="/properties"
          className="inline-block rounded-2xl bg-navy px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-navy-800 transition"
        >
          &larr; Explore Verified Properties
        </Link>
      </div>
    );
  }

  const allImages = property.images?.length
    ? property.images.map((i) => imgSrc(i.path))
    : property.primaryImage
      ? [imgSrc(property.primaryImage)]
      : ["/defaults/apartment.svg"];

  const currentImage = allImages[activeImageIndex] || allImages[0];
  const isRent = property.listingType === "RENT";
  const sellerTargetId = property.seller?.sellerProfileId || property.seller?.id || property.sellerId;

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % allImages.length);
  };
  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* ── Breadcrumb ────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-navy transition">Home</Link>
        <span>/</span>
        <Link to={isRent ? "/rentals" : "/properties"} className="hover:text-navy transition">
          {isRent ? "Rentals" : "Properties"}
        </Link>
        <span>/</span>
        <span className="text-navy font-semibold capitalize truncate max-w-[200px]">{property.locality}</span>
        <span>/</span>
        <span className="text-slate-400 truncate max-w-[150px]">{property.title}</span>
      </nav>

      {/* ── Main Layout (2 Cols: Gallery + Details vs Sticky Action Sidebar) ── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* ── Interactive Image Gallery ── */}
          <div className="space-y-3">
            <div className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-100 aspect-video sm:aspect-[16/9] shadow-card">
              <img
                src={currentImage}
                alt={property.title}
                className="h-full w-full object-cover transition-transform duration-300"
              />

              {/* Status and Type Badges */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-md ${
                  isRent ? "bg-emerald-600 text-white" : "bg-navy-950 text-white"
                }`}>
                  {isRent ? "For Rent" : "For Sale"}
                </span>

                {property.status === "SOLD" && (
                  <span className="rounded-full bg-rose-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md">
                    SOLD
                  </span>
                )}
              </div>

              {/* Image Counter & Fullscreen trigger */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <span className="rounded-full bg-navy-950/80 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white shadow">
                  📷 {activeImageIndex + 1} / {allImages.length}
                </span>
                <button
                  type="button"
                  onClick={() => setIsFullscreenGallery(true)}
                  className="rounded-full bg-navy-950/80 backdrop-blur-md p-2 text-white shadow hover:bg-navy-900 transition"
                  title="Fullscreen Gallery"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
              </div>

              {/* Next/Prev overlay buttons */}
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-navy shadow-md opacity-80 group-hover:opacity-100 hover:bg-white transition"
                    aria-label="Previous image"
                  >
                    &larr;
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-navy shadow-md opacity-80 group-hover:opacity-100 hover:bg-white transition"
                    aria-label="Next image"
                  >
                    &rarr;
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail carousel */}
            {allImages.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`h-16 w-24 flex-none overflow-hidden rounded-2xl border-2 transition active:scale-95 ${
                      activeImageIndex === idx
                        ? "border-pink-600 ring-2 ring-pink-300 shadow-sm"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Quick Specs Ribbon ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-card text-center">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bedrooms</span>
              <p className="font-display text-xl font-bold text-navy">{property.bhk} BHK</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Carpet Area</span>
              <p className="font-display text-xl font-bold text-navy">{property.carpetArea} sq ft</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bathrooms</span>
              <p className="font-display text-xl font-bold text-navy">{property.bathrooms}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Furnishing</span>
              <p className="font-display text-base font-bold text-navy capitalize truncate">
                {property.furnishing.replace(/_/g, " ").toLowerCase()}
              </p>
            </div>
          </div>

          {/* ── Overview & Description ── */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-card space-y-3">
            <h3 className="font-display text-xl font-bold text-navy">Property Description</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* ── Specifications Grid ── */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-card space-y-4">
            <h3 className="font-display text-xl font-bold text-navy">Key Specifications</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs sm:text-sm">
              <div className="space-y-0.5">
                <span className="text-slate-400">Property Type</span>
                <p className="font-semibold text-navy capitalize">{property.propertyType.replace(/_/g, " ").toLowerCase()}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400">Floor Level</span>
                <p className="font-semibold text-navy">{property.floor != null ? `${property.floor} of ${property.totalFloors || "—"}` : "Independent"}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400">Super Built-up Area</span>
                <p className="font-semibold text-navy">{property.superBuiltUpArea ? `${property.superBuiltUpArea} sq ft` : "—"}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400">Parking</span>
                <p className="font-semibold text-navy">{property.parking ? `${property.parking} Covered Space(s)` : "Available"}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400">Locality</span>
                <p className="font-semibold text-navy capitalize">{property.locality}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400">City / State</span>
                <p className="font-semibold text-navy">{property.city || "Jaipur"}, Rajasthan</p>
              </div>
            </div>
          </div>

          {/* ── Interactive Location Map ── */}
          <PropertyLocationMap
            latitude={property.latitude}
            longitude={property.longitude}
            title={property.title}
            price={property.price}
            locality={property.locality}
            city={property.city || "Jaipur"}
            address={property.address}
            listingType={property.listingType}
          />
        </div>

        {/* ── Right Column: Sticky Price & Action Sidebar ── */}
        <div className="space-y-6">
          <div className="sticky top-20 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card space-y-6">
            <div>
              <span className="text-xs uppercase tracking-wider text-pink-600 font-bold">
                {isRent ? "Monthly Lease" : "Outright Purchase"}
              </span>
              <h1 className="mt-1 font-display text-2xl font-bold text-navy">{property.title}</h1>
              <p className="mt-3 text-3xl font-display font-bold text-navy">
                {inr(property.price)}
                {isRent && <span className="text-sm font-normal text-slate-500"> / month</span>}
              </p>
              {property.carpetArea > 0 && !isRent && (
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  ₹{Math.round(property.price / property.carpetArea).toLocaleString("en-IN")} / sq ft (Carpet)
                </p>
              )}
            </div>

            {/* Action Buttons */}
            {property.status !== "SOLD" && user?.role !== "SELLER" && (
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleCart}
                  className="w-full rounded-2xl bg-navy py-3.5 font-semibold text-sm text-white shadow-md hover:bg-navy-800 transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span>Initiate Purchase Closing</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleFav}
                    className="flex-1 rounded-2xl border border-slate-200 py-3 text-xs font-semibold text-navy hover:bg-slate-50 transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>❤️</span> Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowVisitModal(true)}
                    className="flex-1 rounded-2xl border border-pink-200 bg-pink-50/50 py-3 text-xs font-semibold text-pink-700 hover:bg-pink-100 transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>📅</span> Schedule Tour
                  </button>
                </div>
              </div>
            )}

            {/* ── Seller & Agency Profile Card ── */}
            <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Property Listed By
                </span>
                <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span>✓</span> Verified Partner
                </span>
              </div>

              {/* Clickable Seller Header */}
              {sellerTargetId ? (
                <Link
                  to={`/sellers/${sellerTargetId}`}
                  className="group flex items-start gap-3 p-2 -m-2 rounded-2xl hover:bg-white transition"
                >
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-pink-600 to-amber-500 flex items-center justify-center text-white font-bold font-display text-base shadow-sm flex-shrink-0">
                    {(property.seller?.companyName || property.seller?.name || "S").charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <p className="font-display font-bold text-sm text-navy group-hover:text-pink-600 transition truncate">
                      {property.seller?.companyName || property.contactName || property.seller?.name || "Direct Seller"}
                    </p>
                    {property.seller?.companyName && property.seller?.name && (
                      <p className="text-xs text-slate-500 truncate">Agent: {property.seller.name}</p>
                    )}
                    {property.seller?.totalProperties !== undefined && (
                      <p className="text-[11px] font-semibold text-pink-600">
                        🏡 {property.seller.totalProperties} Active Listing{property.seller.totalProperties === 1 ? "" : "s"}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 group-hover:text-pink-600 group-hover:translate-x-0.5 transition">
                    &rarr;
                  </span>
                </Link>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-slate-200 flex items-center justify-center text-navy font-bold font-display text-base">
                    🏢
                  </div>
                  <div>
                    <p className="font-bold text-sm text-navy">{property.contactName || "Direct Seller"}</p>
                    <p className="text-xs text-slate-500">Jaipur Property Partner</p>
                  </div>
                </div>
              )}

              {/* Direct Communication Buttons */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200/60 text-xs">
                {(property.contactPhone || property.seller?.phone) && (
                  <a
                    href={`tel:${property.contactPhone || property.seller?.phone}`}
                    className="flex items-center gap-2 p-2 rounded-xl text-slate-700 hover:bg-white hover:text-pink-600 transition font-medium"
                  >
                    <span>📞</span> <span>{property.contactPhone || property.seller?.phone}</span>
                  </a>
                )}
                {property.seller?.email && (
                  <a
                    href={`mailto:${property.seller.email}?subject=Inquiry about ${property.title}`}
                    className="flex items-center gap-2 p-2 rounded-xl text-slate-700 hover:bg-white hover:text-pink-600 transition truncate font-medium"
                  >
                    <span>✉️</span> <span className="truncate">{property.seller.email}</span>
                  </a>
                )}
              </div>

              {/* View Full Seller Profile Link Button */}
              {sellerTargetId && (
                <Link
                  to={`/sellers/${sellerTargetId}`}
                  className="block w-full text-center rounded-2xl bg-white border border-slate-200 py-2.5 text-xs font-bold text-navy hover:bg-navy hover:text-white transition shadow-xs active:scale-95"
                >
                  View Seller Profile &amp; Inventory &rarr;
                </Link>
              )}
            </div>

            {/* Address snippet */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-2">
              <h4 className="font-display text-sm font-bold text-navy">Locality &amp; Address</h4>
              <p className="text-xs font-semibold text-slate-700">📍 {property.locality}, {property.city || "Jaipur"}</p>
              {property.address && (
                <p className="text-xs text-slate-500 leading-relaxed">{property.address}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Similar Properties Carousel / Grid ── */}
      {similar.length > 0 && (
        <section className="space-y-6 pt-10 border-t border-slate-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-pink-600">Similar Options</span>
            <h2 className="font-display text-2xl font-bold text-navy mt-1">
              You May Also Like in Jaipur
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((item) => (
              <PropertyCard
                key={item.id}
                id={item.id}
                title={item.title}
                price={item.price}
                locality={item.locality}
                city={item.city || "Jaipur"}
                bhk={item.bhk}
                bathrooms={item.bathrooms}
                area={item.carpetArea}
                propertyType={item.propertyType}
                image={item.images?.[0]?.path}
                href={`/properties/${item.id}`}
                sold={item.status === "SOLD"}
                listingType={item.listingType}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Schedule Visit Modal ── */}
      {showVisitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 p-4 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submittingVisit) setShowVisitModal(false);
          }}
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-modal space-y-4 border border-slate-200/80 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-navy">Book a Property Tour</h3>
              <button
                type="button"
                onClick={() => setShowVisitModal(false)}
                className="text-slate-400 hover:text-navy text-xl"
              >
                &times;
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Pick a convenient date and time to visit <span className="font-bold text-navy">{property.title}</span>. The partner representative will receive your request.
            </p>

            <form onSubmit={handleScheduleVisit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Preferred Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs text-navy focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Notes or Inquiries (Optional)
                </label>
                <textarea
                  rows={3}
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="e.g. Interested in morning slot, looking for loan assistance."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs text-navy focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVisitModal(false)}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingVisit}
                  className="rounded-2xl bg-navy px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-navy-800 disabled:opacity-50"
                >
                  {submittingVisit ? "Scheduling..." : "Confirm Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Fullscreen Gallery Modal ── */}
      {isFullscreenGallery && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/95 p-4 backdrop-blur-md"
          onClick={() => setIsFullscreenGallery(false)}
        >
          <div className="relative max-w-5xl w-full h-[80vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsFullscreenGallery(false)}
              className="absolute top-2 right-2 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition text-lg z-10"
            >
              &times;
            </button>
            <img
              src={currentImage}
              alt=""
              className="max-h-full max-w-full object-contain rounded-2xl"
            />
            {allImages.length > 1 && (
              <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-4">
                <button
                  onClick={prevImage}
                  className="rounded-full bg-white/20 backdrop-blur-md px-4 py-2 text-white text-xs font-bold hover:bg-white/30"
                >
                  &larr; Prev
                </button>
                <span className="text-xs text-white/80 font-mono">
                  {activeImageIndex + 1} / {allImages.length}
                </span>
                <button
                  onClick={nextImage}
                  className="rounded-full bg-white/20 backdrop-blur-md px-4 py-2 text-white text-xs font-bold hover:bg-white/30"
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
