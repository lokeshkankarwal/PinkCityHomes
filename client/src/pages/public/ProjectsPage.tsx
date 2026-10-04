import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { inr } from "../../lib/format";

type ProjectListing = {
  project_id: string;
  apartment_name: string;
  developer_name?: string;
  locality: string;
  city?: string;
  address?: string;
  description?: string;
  project_status?: string;
  total_units?: number;
  total_towers?: number;
  total_listings?: number;
  units_for_sale?: number;
  units_for_rent?: number;
  price_min?: number;
  price_max?: number;
  min_area_sqft?: number;
  max_area_sqft?: number;
  amenities?: string[];
  image?: string;
  rera_number?: string;
};

export default function ProjectsPage() {
  const [localityInput, setLocalityInput] = useState("");
  const [statusInput, setStatusInput] = useState("");

  const [appliedFilters, setAppliedFilters] = useState({
    locality: "",
    status: "",
  });

  const [projects, setProjects] = useState<ProjectListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<{ results: ProjectListing[] }>("/projects")
      .then((d) => setProjects(d.results || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const handleApplyFilters = () => {
    setAppliedFilters({
      locality: localityInput.trim(),
      status: statusInput,
    });
  };

  const handleResetFilters = () => {
    setLocalityInput("");
    setStatusInput("");
    setAppliedFilters({
      locality: "",
      status: "",
    });
  };

  // Filtered projects based strictly on applied filters using multi-token matching
  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (appliedFilters.locality) {
        const needle = appliedFilters.locality.toLowerCase().trim();
        const tokens = needle.split(/[,\s]+/).filter(Boolean);
        const haystack = `${p.apartment_name} ${p.developer_name || ""} ${p.locality} ${p.city || ""} ${p.address || ""}`.toLowerCase();
        const matches = tokens.every((t) => haystack.includes(t));
        if (!matches) return false;
      }
      if (appliedFilters.status && p.project_status?.toLowerCase() !== appliedFilters.status.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [projects, appliedFilters]);

  // Location / Project suggestions based on available listings
  const [showSuggestions, setShowSuggestions] = useState(false);
  const locationSuggestions = useMemo(() => {
    if (!localityInput || localityInput.trim().length === 0) return [];
    const needle = localityInput.toLowerCase().trim();
    const suggestions = new Set<string>();

    projects.forEach((p) => {
      if (p.apartment_name && p.apartment_name.toLowerCase().includes(needle)) {
        suggestions.add(p.apartment_name);
      }
      if (p.locality && p.locality.toLowerCase().includes(needle)) {
        suggestions.add(p.locality);
      }
      if (p.city && p.city.toLowerCase().includes(needle)) {
        suggestions.add(p.city);
      }
    });

    return Array.from(suggestions).slice(0, 6);
  }, [projects, localityInput]);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="font-serif text-3xl font-bold">Direct Builder &amp; Society Projects</h1>
        <p className="text-sm text-ink/70">
          Curated developments and societies with multiple residential flats for buy and rent
        </p>
      </div>

      {/* Filter Row */}
      <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <input
              type="text"
              placeholder="District / Locality / Project (e.g. Malviya Nagar, Jagatpura, Mansarovar)"
              value={localityInput}
              onChange={(e) => {
                setLocalityInput(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setShowSuggestions(false);
                  handleApplyFilters();
                }
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full rounded-xl border border-ink/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
            />
            {showSuggestions && locationSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 rounded-xl border border-ink/10 bg-white p-1.5 shadow-xl text-xs space-y-1 max-h-48 overflow-y-auto">
                {locationSuggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => {
                      setLocalityInput(sug);
                      setShowSuggestions(false);
                    }}
                    className="w-full rounded-lg px-2.5 py-1.5 text-left font-medium text-ink hover:bg-sand transition flex items-center gap-1.5"
                  >
                    <span>📍</span>
                    <span className="truncate capitalize">{sug}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <select
            value={statusInput}
            onChange={(e) => setStatusInput(e.target.value)}
            className="rounded-xl border border-ink/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
          >
            <option value="">All Project Statuses</option>
            <option value="ready to move">Ready to Move</option>
            <option value="under construction">Under Construction</option>
            <option value="active units">Active Units</option>
          </select>

          <button
            type="button"
            onClick={handleApplyFilters}
            className="rounded-xl bg-ink px-5 py-2 font-semibold text-sand text-sm hover:bg-ink/90 shadow transition"
          >
            Apply Filters
          </button>

          <button
            type="button"
            onClick={handleResetFilters}
            className="rounded-xl border border-ink/20 px-4 py-2 font-semibold text-ink/70 text-sm hover:bg-ink/5 transition"
          >
            Reset
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-ink/60">Loading projects...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-ink/10 bg-white p-12 text-center text-ink/60">
          No projects found matching the criteria. Try adjusting your search keyword or clearing filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <article
              key={p.project_id}
              className="overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-sm flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="h-44 bg-gradient-to-br from-ink/15 via-sand to-brass/25 p-6 flex flex-col justify-between relative">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-white/90 backdrop-blur px-3 py-1 text-xs font-bold text-moss capitalize">
                      {p.project_status || "Active Project"}
                    </span>
                    <span className="text-xs font-semibold text-ink/70 bg-white/80 px-2.5 py-0.5 rounded-full">
                      {p.total_units ? `${p.total_units} Total Units` : "Multi-Unit"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-ink/70 font-bold">
                      {p.developer_name || "Verified Developer"}
                    </p>
                    <h3 className="font-serif text-2xl font-bold text-ink">{p.apartment_name}</h3>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Units for Buy & Rent badges */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-lg bg-brass/15 text-ink font-bold px-2.5 py-1 border border-brass/30">
                      🏷️ {p.units_for_sale ?? 0} Flats for Sale
                    </span>
                    <span className="rounded-lg bg-moss/15 text-moss font-bold px-2.5 py-1 border border-moss/30">
                      🔑 {p.units_for_rent ?? 0} Flats for Rent
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-ink/60">Valuation Range</span>
                    <p className="font-serif text-xl font-bold text-brass">
                      {inr(p.price_min)} &ndash; {inr(p.price_max)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs border-t border-ink/5 pt-3">
                    <div>
                      <span className="text-ink/60">Carpet Area Range</span>
                      <p className="font-semibold text-ink">
                        {p.min_area_sqft} - {p.max_area_sqft} sq ft
                      </p>
                    </div>
                    <div>
                      <span className="text-ink/60">Locality</span>
                      <p className="font-semibold text-ink capitalize">{p.locality}</p>
                    </div>
                  </div>

                  {p.amenities && p.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {p.amenities.slice(0, 4).map((a, i) => (
                        <span
                          key={i}
                          className="rounded-lg bg-sand px-2 py-0.5 text-[11px] font-medium capitalize text-ink/80"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-ink/5 p-4 bg-sand/10 flex items-center justify-between">
                <span className="text-xs text-ink/60 font-medium">
                  {p.city ? `📍 ${p.city}` : "📍 Jaipur"}
                </span>
                <Link
                  to={`/projects/${p.project_id}`}
                  className="rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-sand hover:bg-ink/90 shadow transition"
                >
                  Explore Project Units &rarr;
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
