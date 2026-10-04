import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api/client";
import { inr, imgSrc } from "../../lib/format";
import type { Property } from "../../types";

export default function RentalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<Property>(`/properties/${id}`)
      .then((p) => {
        setProperty(p);
      })
      .catch(() => {
        setProperty(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="py-24 text-center text-ink/60">Loading rental details...</div>;
  if (!property) {
    return (
      <div className="py-24 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold">Rental Listing Not Found</h2>
        <p className="text-sm text-ink/70">The property you are looking for is unavailable or has been removed.</p>
        <Link to="/rentals" className="inline-block rounded-xl bg-ink px-4 py-2 text-sm text-sand">
          &larr; Back to Rentals
        </Link>
      </div>
    );
  }

  const primaryImg = property.images?.[0]?.path;

  return (
    <div className="space-y-8 pb-16">
      <nav className="flex items-center gap-2 text-xs text-ink/60">
        <Link to="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link to="/rentals" className="hover:text-ink">Rentals</Link>
        <span>/</span>
        <span className="text-ink font-medium capitalize">{property.locality}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="overflow-hidden rounded-3xl border border-ink/10 bg-sand/30 shadow-sm">
            <img src={imgSrc(primaryImg)} alt={property.title} className="h-80 w-full object-cover" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
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

          <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm space-y-3">
            <h3 className="font-serif text-xl font-bold">Rental Overview</h3>
            <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line">{property.description}</p>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-xl font-bold">Property Specifications</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-sm">
              <div>
                <span className="text-ink/60">Monthly Rent</span>
                <p className="font-bold text-base text-ink">{inr(property.price)} / mo</p>
              </div>
              <div>
                <span className="text-ink/60">Property Type</span>
                <p className="font-medium capitalize">{property.propertyType.replace(/_/g, " ").toLowerCase()}</p>
              </div>
              <div>
                <span className="text-ink/60">Floor</span>
                <p className="font-medium">{property.floor != null ? `${property.floor} of ${property.totalFloors || "—"}` : "—"}</p>
              </div>
              <div>
                <span className="text-ink/60">Parking</span>
                <p className="font-medium">{property.parking ? `${property.parking} Covered` : "Available"}</p>
              </div>
              <div>
                <span className="text-ink/60">Super Built-up Area</span>
                <p className="font-medium">{property.superBuiltUpArea ? `${property.superBuiltUpArea} sq ft` : "—"}</p>
              </div>
              <div>
                <span className="text-ink/60">Locality</span>
                <p className="font-medium capitalize">{property.locality}, Jaipur</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-md space-y-6">
            <div>
              <span className="text-xs uppercase tracking-wider text-moss font-semibold">For Rent</span>
              <h1 className="mt-1 font-serif text-2xl font-bold">{property.title}</h1>
              <p className="mt-3 text-3xl font-serif font-bold text-ink">
                {inr(property.price)} <span className="text-sm font-normal text-ink/60">/ month</span>
              </p>
            </div>

            <div className="rounded-2xl bg-sand/40 p-4 space-y-2 border border-ink/5">
              <p className="text-xs uppercase tracking-wider text-ink/60 font-semibold">Contact Details</p>
              <p className="font-bold text-sm text-ink">{property.contactName || property.seller?.name || "Authorized Contact"}</p>
              {(property.contactPhone || property.seller?.phone) && (
                <p className="text-sm text-ink/80 flex items-center gap-2">
                  <span>📞</span> <a href={`tel:${property.contactPhone || property.seller?.phone}`} className="hover:underline font-semibold">{property.contactPhone || property.seller?.phone}</a>
                </p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-sm space-y-3">
            <h3 className="font-serif text-base font-bold">Location</h3>
            <p className="text-sm font-semibold text-ink">📍 {property.locality}</p>
            <p className="text-xs text-ink/70 capitalize">{property.address || property.locality}, Jaipur, Rajasthan</p>
          </div>
        </div>
      </div>
    </div>
  );
}
