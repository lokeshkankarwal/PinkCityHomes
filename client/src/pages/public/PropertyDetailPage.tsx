import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api/client";
import { inr, imgSrc } from "../../lib/format";
import { useAuth } from "../../auth";
import type { Property } from "../../types";
import { PropertyLocationMap } from "../../components/PropertyLocationMap";

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [activeImage, setActiveImage] = useState<string>("");
  const [similar, setSimilar] = useState<Property[]>([]);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Visit modal state
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [visitNotes, setVisitNotes] = useState("");
  const [submittingVisit, setSubmittingVisit] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    api
      .get<Property>(`/properties/${id}`)
      .then((p) => {
        setProperty(p);
        const primary = p.images?.length ? p.images[0].path : p.primaryImage;
        setActiveImage(primary ? imgSrc(primary) : "/defaults/apartment.svg");

        // Fetch similar properties from same locality or general catalogue
        api
          .get<{ results: Property[] }>(`/properties?limit=4`)
          .then((res) => {
            const others = (res.results || []).filter((item) => item.id !== id);
            setSimilar(others.slice(0, 3));
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
      setActionMsg("Please log in to save favourites.");
      return;
    }
    if (!property) return;
    try {
      await api.post("/favourites", { propertyId: property.id });
      setActionMsg("Saved to favourites!");
    } catch (e: unknown) {
      setActionMsg(e instanceof Error ? e.message : "Failed to save favourite");
    }
  };

  const handleCart = async () => {
    if (!user) {
      setActionMsg("Please log in to add to cart.");
      return;
    }
    if (!property) return;
    try {
      await api.post("/cart", { propertyId: property.id });
      setActionMsg("Added property to cart!");
    } catch (e: unknown) {
      setActionMsg(e instanceof Error ? e.message : "Failed to add to cart");
    }
  };

  const handleScheduleVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setActionMsg("Please log in to schedule a visit.");
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
      setActionMsg("Visit scheduled successfully! The representative will contact you shortly.");
      setShowVisitModal(false);
      setVisitDate("");
      setVisitNotes("");
    } catch (e: unknown) {
      setActionMsg(e instanceof Error ? e.message : "Failed to schedule visit");
    } finally {
      setSubmittingVisit(false);
    }
  };

  if (loading) return <div className="py-24 text-center text-ink/60">Loading property details...</div>;

  if (error || !property) {
    return (
      <div className="py-24 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold">Property Not Found</h2>
        <p className="text-sm text-ink/70">The property you are looking for does not exist or has been removed.</p>
        <Link to="/properties" className="inline-block rounded-xl bg-ink px-4 py-2 text-sm text-sand">
          &larr; Back to Properties
        </Link>
      </div>
    );
  }

  const allImages = property.images?.length
    ? property.images.map((i) => imgSrc(i.path))
    : property.primaryImage
      ? [imgSrc(property.primaryImage)]
      : ["/defaults/apartment.svg"];

  return (
    <div className="space-y-8 pb-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-ink/60">
        <Link to="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link to="/properties" className="hover:text-ink">Properties</Link>
        <span>/</span>
        <span className="text-ink font-medium capitalize">{property.locality}</span>
      </nav>

      {actionMsg && (
        <div className="rounded-xl bg-moss/10 border border-moss/20 px-4 py-3 text-sm font-semibold text-moss">
          {actionMsg}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Photos, specs, overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-3xl border border-ink/10 bg-sand/30 shadow-sm aspect-video sm:aspect-[16/9]">
              <img
                src={activeImage || allImages[0]}
                alt={property.title}
                className="h-full w-full object-cover"
              />
              {property.status === "SOLD" && (
                <div className="absolute top-4 left-4 rounded-xl bg-red-600 px-3 py-1 text-xs font-bold text-white shadow">
                  SOLD
                </div>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(img)}
                    className={`h-16 w-20 flex-none overflow-hidden rounded-xl border-2 transition ${
                      activeImage === img ? "border-pink-600" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Specs Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm text-center">
            <div>
              <span className="text-xs text-ink/60 uppercase">Bedrooms</span>
              <p className="font-serif text-lg font-bold">{property.bhk} BHK</p>
            </div>
            <div>
              <span className="text-xs text-ink/60 uppercase">Carpet Area</span>
              <p className="font-serif text-lg font-bold">{property.carpetArea} sq ft</p>
            </div>
            <div>
              <span className="text-xs text-ink/60 uppercase">Bathrooms</span>
              <p className="font-serif text-lg font-bold">{property.bathrooms}</p>
            </div>
            <div>
              <span className="text-xs text-ink/60 uppercase">Furnishing</span>
              <p className="font-serif text-lg font-bold capitalize">{property.furnishing.replace(/_/g, " ").toLowerCase()}</p>
            </div>
          </div>

          {/* Overview */}
          <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm space-y-3">
            <h3 className="font-serif text-xl font-bold">Property Overview</h3>
            <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line">{property.description}</p>
          </div>

          {/* Detailed Specs */}
          <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-xl font-bold">Specifications</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-sm">
              <div>
                <span className="text-ink/60">Property Type</span>
                <p className="font-medium capitalize">{property.propertyType.replace(/_/g, " ").toLowerCase()}</p>
              </div>
              <div>
                <span className="text-ink/60">Floor</span>
                <p className="font-medium">{property.floor != null ? `${property.floor} of ${property.totalFloors || "—"}` : "—"}</p>
              </div>
              <div>
                <span className="text-ink/60">Super Built-up Area</span>
                <p className="font-medium">{property.superBuiltUpArea ? `${property.superBuiltUpArea} sq ft` : "—"}</p>
              </div>
              <div>
                <span className="text-ink/60">Parking</span>
                <p className="font-medium">{property.parking ? `${property.parking} Covered` : "Available"}</p>
              </div>
              <div>
                <span className="text-ink/60">Locality</span>
                <p className="font-medium capitalize">{property.locality}</p>
              </div>
              <div>
                <span className="text-ink/60">City</span>
                <p className="font-medium capitalize">{property.city || "Jaipur"}</p>
              </div>
            </div>
          </div>

          {/* Dedicated Property Location Map */}
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

        {/* Right Sidebar: Price & Actions */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-md space-y-6">
            <div>
              <span className="text-xs uppercase tracking-wider text-moss font-semibold">
                {property.listingType === "RENT" ? "For Rent" : "For Sale"}
              </span>
              <h1 className="mt-1 font-serif text-2xl font-bold">{property.title}</h1>
              <p className="mt-3 text-3xl font-serif font-bold text-ink">
                {inr(property.price)}
                {property.listingType === "RENT" && <span className="text-sm font-normal text-ink/60"> / month</span>}
              </p>
              {property.carpetArea > 0 && property.listingType !== "RENT" && (
                <p className="text-xs text-ink/60 mt-1">
                  ₹{Math.round(property.price / property.carpetArea).toLocaleString("en-IN")} / sq ft (Carpet)
                </p>
              )}
            </div>

            {/* Action Buttons */}
            {property.status !== "SOLD" && user?.role !== "SELLER" && (
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleCart}
                  className="w-full rounded-xl bg-ink py-3 font-semibold text-sand shadow hover:bg-ink/90 transition"
                >
                  Initiate Purchase Closing
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleFav}
                    className="flex-1 rounded-xl border border-ink/20 py-2.5 text-sm font-semibold text-ink hover:bg-sand/50 transition flex items-center justify-center gap-1.5"
                  >
                    <span>♥</span> Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowVisitModal(true)}
                    className="flex-1 rounded-xl border border-ink/20 py-2.5 text-sm font-semibold text-ink hover:bg-sand/50 transition flex items-center justify-center gap-1.5"
                  >
                    <span>📅</span> Visit
                  </button>
                </div>
              </div>
            )}

            {/* Contact Details Card */}
            <div className="rounded-2xl bg-sand/40 p-4 space-y-2 border border-ink/5">
              <p className="text-xs uppercase tracking-wider text-ink/60 font-semibold">Contact Representative</p>
              <p className="font-bold text-sm text-ink">{property.contactName || property.seller?.name || "PinkCityHomes Representative"}</p>
              {(property.contactPhone || property.seller?.phone) && (
                <p className="text-sm text-ink/80 flex items-center gap-2">
                  <span>📞</span> <a href={`tel:${property.contactPhone || property.seller?.phone}`} className="hover:underline font-semibold">{property.contactPhone || property.seller?.phone}</a>
                </p>
              )}
              {property.seller?.email && (
                <p className="text-sm text-ink/80 flex items-center gap-2">
                  <span>✉️</span> <a href={`mailto:${property.seller.email}`} className="hover:underline">{property.seller.email}</a>
                </p>
              )}
            </div>
          </div>

          {/* Location Details */}
          <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-sm space-y-3">
            <h3 className="font-serif text-base font-bold">Location &amp; Address</h3>
            <p className="text-sm font-semibold text-ink">📍 {property.locality}, {property.city || "Jaipur"}</p>
            {property.address && (
              <p className="text-xs text-ink/70">{property.address}</p>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Visit Modal */}
      {showVisitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold">Book a Property Visit</h3>
              <button
                onClick={() => setShowVisitModal(false)}
                className="text-xl text-ink/50 hover:text-ink"
              >
                &times;
              </button>
            </div>
            <p className="text-xs text-ink/70">
              Pick a date and time to visit {property.title}. The assigned representative will coordinate access.
            </p>

            <form onSubmit={handleScheduleVisit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">Visit Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">Notes / Preferences (Optional)</label>
                <textarea
                  rows={3}
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="e.g. Afternoon visit preferred, checking floor plan."
                  className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVisitModal(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-ink/70 hover:bg-ink/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingVisit}
                  className="rounded-xl bg-ink px-5 py-2 text-sm font-semibold text-sand hover:bg-ink/90 disabled:opacity-50"
                >
                  {submittingVisit ? "Scheduling..." : "Confirm Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Similar Listings */}
      {similar.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-ink/10">
          <h3 className="font-serif text-2xl font-bold">Similar Homes You May Like</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((sim) => (
              <div
                key={sim.id}
                className="overflow-hidden rounded-2xl border border-ink/10 bg-white p-4 shadow-sm space-y-2"
              >
                <Link to={`/properties/${sim.id}`} className="block">
                  <p className="text-xs uppercase text-moss font-bold">{sim.bhk} BHK</p>
                  <h4 className="font-serif text-base font-semibold">{sim.title}</h4>
                  <p className="text-brass font-bold">{inr(sim.price)}</p>
                  <p className="text-xs text-ink/60">{sim.carpetArea} sq ft · {sim.locality}</p>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
