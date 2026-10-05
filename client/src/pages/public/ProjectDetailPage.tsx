import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api/client";
import { inr, imgSrc } from "../../lib/format";
import type { ProjectDetail, Property } from "../../types";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "BUY" | "RENT">("ALL");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<ProjectDetail>(`/projects/${id}`)
      .then((p) => setProject(p))
      .catch(() => {
        setProject(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="py-24 text-center text-ink/60">Loading project details...</div>;
  if (!project) {
    return (
      <div className="py-24 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold">Project Not Found</h2>
        <Link to="/projects" className="inline-block rounded-xl bg-ink px-4 py-2 text-sm text-sand">
          &larr; Back to Projects
        </Link>
      </div>
    );
  }

  const saleUnits = project.saleUnits || [];
  const rentUnits = project.rentUnits || [];

  return (
    <div className="space-y-8 pb-16">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-ink/60">
        <Link to="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link to="/projects" className="hover:text-ink">Projects</Link>
        <span>/</span>
        <span className="text-ink font-medium capitalize">{project.apartment_name}</span>
      </nav>

      {/* Main Hero Header */}
      <div className="rounded-3xl bg-gradient-to-br from-ink via-[#1c3854] to-ink p-8 text-sand shadow-lg space-y-4 relative overflow-hidden">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brass/20 text-brass px-3 py-1 text-xs font-bold uppercase tracking-wider">
            {project.project_status || "Active Society"}
          </span>
          <span className="rounded-full bg-sand/10 text-sand px-3 py-1 text-xs font-semibold">
            📍 {project.locality}, {project.city}
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold">{project.apartment_name}</h1>
        
        <p className="text-sand/80 text-sm max-w-2xl">
          Developed by <span className="font-semibold text-sand">{project.developer_name || "Verified Builder"}</span>
          {project.address && ` · ${project.address}`}
        </p>

        {project.description && (
          <p className="text-sand/70 text-xs sm:text-sm max-w-3xl pt-2 border-t border-sand/10 leading-relaxed">
            {project.description}
          </p>
        )}
      </div>

      {/* Project Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
        <div>
          <span className="text-xs text-ink/60 uppercase font-semibold">Total Society Units</span>
          <p className="font-serif text-xl font-bold text-ink">{project.total_units || "—"}</p>
        </div>
        <div>
          <span className="text-xs text-ink/60 uppercase font-semibold">Towers / Blocks</span>
          <p className="font-serif text-xl font-bold text-ink">{project.total_towers || "—"}</p>
        </div>
        <div>
          <span className="text-xs text-ink/60 uppercase font-semibold">For Sale (Buy)</span>
          <p className="font-serif text-xl font-bold text-moss">
            {saleUnits.length} {saleUnits.length === 1 ? "Flat" : "Flats"}
          </p>
        </div>
        <div>
          <span className="text-xs text-ink/60 uppercase font-semibold">For Rent</span>
          <p className="font-serif text-xl font-bold text-brass">
            {rentUnits.length} {rentUnits.length === 1 ? "Flat" : "Flats"}
          </p>
        </div>
      </div>

      {/* Layout Grid: Units Showcase (Left) + Project Info / Contact (Right) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Section Filter Tabs */}
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <h2 className="font-serif text-2xl font-bold">Flats & Units in this Project</h2>
            <div className="flex rounded-xl bg-ink/5 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("ALL")}
                className={`rounded-lg px-3 py-1.5 transition ${
                  activeTab === "ALL" ? "bg-white shadow text-ink" : "text-ink/60 hover:text-ink"
                }`}
              >
                All ({saleUnits.length + rentUnits.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("BUY")}
                className={`rounded-lg px-3 py-1.5 transition ${
                  activeTab === "BUY" ? "bg-white shadow text-ink" : "text-ink/60 hover:text-ink"
                }`}
              >
                🏷️ Buy ({saleUnits.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("RENT")}
                className={`rounded-lg px-3 py-1.5 transition ${
                  activeTab === "RENT" ? "bg-white shadow text-ink" : "text-ink/60 hover:text-ink"
                }`}
              >
                🔑 Rent ({rentUnits.length})
              </button>
            </div>
          </div>

          {/* SECTION 1: Units For Sale (Buy) */}
          {(activeTab === "ALL" || activeTab === "BUY") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl font-bold flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-moss"></span>
                  Units Available for Purchase (Buy)
                </h3>
                <span className="text-xs text-ink/60 font-semibold">{saleUnits.length} available</span>
              </div>

              {saleUnits.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-ink/15 bg-sand/20 p-6 text-center text-sm text-ink/60">
                  No flats are currently listed for sale in this project.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {saleUnits.map((unit) => (
                    <ProjectUnitCard key={unit.id} unit={unit} type="BUY" />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: Units For Rent (Rentals) */}
          {(activeTab === "ALL" || activeTab === "RENT") && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl font-bold flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-brass"></span>
                  Units Available for Rent (Lease)
                </h3>
                <span className="text-xs text-ink/60 font-semibold">{rentUnits.length} available</span>
              </div>

              {rentUnits.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-ink/15 bg-sand/20 p-6 text-center text-sm text-ink/60">
                  No flats are currently listed for rent in this project.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rentUnits.map((unit) => (
                    <ProjectUnitCard key={unit.id} unit={unit} type="RENT" />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Amenities */}
          {project.amenities && project.amenities.length > 0 && (
            <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm space-y-3">
              <h3 className="font-serif text-xl font-bold">Society Amenities & Features</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {project.amenities.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl bg-sand/40 p-3 text-sm font-medium capitalize text-ink">
                    <span className="text-moss font-bold">✓</span> {a}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing & Units Overview */}
          <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-md space-y-4">
            <span className="text-xs uppercase tracking-wider text-moss font-semibold">Society Overview</span>
            <div>
              <span className="text-xs text-ink/60">Typical Price Range</span>
              <p className="font-serif text-2xl font-bold text-brass">
                {inr(project.price_min || 5000000)} &ndash; {inr(project.price_max || 20000000)}
              </p>
            </div>
            {(project.min_area_sqft || project.max_area_sqft) && (
              <p className="text-xs text-ink/60">
                Configurations range from {project.min_area_sqft || 900} to {project.max_area_sqft || 2400} sq ft
              </p>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <Link
                to={`/properties?locality=${encodeURIComponent(project.locality)}`}
                className="block text-center w-full rounded-xl bg-ink py-2.5 text-xs font-semibold text-sand hover:bg-ink/90 shadow"
              >
                Browse All Properties in {project.locality} &rarr;
              </Link>
              <Link
                to={`/rentals?locality=${encodeURIComponent(project.locality)}`}
                className="block text-center w-full rounded-xl border border-ink/20 py-2.5 text-xs font-semibold text-ink hover:bg-sand"
              >
                Browse Rentals in {project.locality} &rarr;
              </Link>
            </div>
          </div>

          {/* Location Card */}
          <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm space-y-2">
            <h3 className="font-serif text-base font-bold">Project Address</h3>
            <p className="text-sm font-medium text-ink">📍 {project.address || `${project.locality}, ${project.city}`}</p>
            <p className="text-xs text-ink/60 capitalize">Locality: {project.locality}</p>
            <p className="text-xs text-ink/60">City: {project.city}</p>
          </div>

          {/* Developer / Seller Contact Card */}
          <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm space-y-3">
            <h3 className="font-serif text-base font-bold">Developer / Sales Office</h3>
            <p className="text-sm font-semibold text-ink">{project.developer_name || "Authorized Sales Team"}</p>
            {project.contactPhone && (
              <p className="text-xs text-ink/70">📞 Phone: {project.contactPhone}</p>
            )}
            {project.contactEmail && (
              <p className="text-xs text-ink/70">✉️ Email: {project.contactEmail}</p>
            )}
            <p className="text-xs text-moss font-semibold">✓ Verified Society Listing</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectUnitCard({ unit, type }: { unit: Property; type: "BUY" | "RENT" }) {
  const thumb = imgSrc(unit.primaryImage || unit.images?.[0]?.path);

  return (
    <div className="rounded-2xl border border-ink/10 bg-white overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
      <div>
        <div className="relative h-40 bg-sand/30">
          <img
            src={thumb}
            alt={unit.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/defaults/apartment.svg";
            }}
          />
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ${
                type === "BUY" ? "bg-moss" : "bg-brass text-ink"
              }`}
            >
              {type === "BUY" ? "FOR SALE" : "FOR RENT"}
            </span>
            <span className="rounded-full bg-ink/70 text-sand px-2 py-0.5 text-[10px] font-medium">
              {unit.bhk} BHK
            </span>
          </div>
        </div>

        <div className="p-4 space-y-2">
          <h4 className="font-serif text-base font-bold text-ink line-clamp-1">{unit.title}</h4>
          <p className="font-serif text-lg font-bold text-brass">
            {type === "BUY" ? inr(unit.price) : `${inr(unit.price)}/mo`}
          </p>
          <div className="grid grid-cols-2 gap-1 text-[11px] text-ink/70 pt-1 border-t border-ink/5">
            <span>📐 {unit.carpetArea} sq ft</span>
            <span>🛋️ {unit.furnishing?.replace(/_/g, " ").toLowerCase()}</span>
            <span>🏢 Floor {unit.floor ?? 1}/{unit.totalFloors ?? 1}</span>
            <span>🚿 {unit.bathrooms} Baths</span>
          </div>
        </div>
      </div>

      <div className="p-3 bg-sand/20 border-t border-ink/5">
        <Link
          to={`/properties/${unit.id}`}
          className="block text-center w-full rounded-xl bg-ink py-2 text-xs font-semibold text-sand hover:bg-ink/90 transition shadow-sm"
        >
          {type === "BUY" ? "View Unit Details & Tour →" : "View Rental Details →"}
        </Link>
      </div>
    </div>
  );
}
