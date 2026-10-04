import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { PropertyCard } from "../../components/PropertyCard";
import { useAuth } from "../../auth";
import type { Property } from "../../types";

export default function PropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // Filter input states
  const [localityInput, setLocalityInput] = useState(searchParams.get("locality") || "");
  const [bhkInput, setBhkInput] = useState(searchParams.get("bhk") || "");
  const [propertyTypeInput, setPropertyTypeInput] = useState(searchParams.get("type") || "");
  const [furnishingInput, setFurnishingInput] = useState(searchParams.get("furnishing") || "");
  const [minPriceInput, setMinPriceInput] = useState(searchParams.get("minPrice") || "");
  const [maxPriceInput, setMaxPriceInput] = useState(searchParams.get("maxPrice") || "");
  const [sortBy, setSortBy] = useState("newest");

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState({
    locality: searchParams.get("locality") || "",
    bhk: searchParams.get("bhk") || "",
    propertyType: searchParams.get("type") || "",
    furnishing: searchParams.get("furnishing") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
  });

  const [platformProps, setPlatformProps] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Load properties
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api
      .get<{ results: Property[] }>("/properties?limit=200")
      .then((d) => (isMounted ? setPlatformProps(d.results || []) : null))
      .catch(() => (isMounted ? setPlatformProps([]) : null))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const applyFilters = () => {
    const trimmedLocality = localityInput.trim();
    setAppliedFilters({
      locality: trimmedLocality,
      bhk: bhkInput,
      propertyType: propertyTypeInput,
      furnishing: furnishingInput,
      minPrice: minPriceInput,
      maxPrice: maxPriceInput,
    });
    const params = new URLSearchParams();
    if (trimmedLocality) params.set("locality", trimmedLocality);
    if (bhkInput) params.set("bhk", bhkInput);
    if (propertyTypeInput) params.set("type", propertyTypeInput);
    if (furnishingInput) params.set("furnishing", furnishingInput);
    if (minPriceInput) params.set("minPrice", minPriceInput);
    if (maxPriceInput) params.set("maxPrice", maxPriceInput);
    setSearchParams(params);
    setPage(1);
  };

  const clearFilters = () => {
    setLocalityInput("");
    setBhkInput("");
    setPropertyTypeInput("");
    setFurnishingInput("");
    setMinPriceInput("");
    setMaxPriceInput("");
    setAppliedFilters({
      locality: "",
      bhk: "",
      propertyType: "",
      furnishing: "",
      minPrice: "",
      maxPrice: "",
    });
    setSearchParams(new URLSearchParams());
    setPage(1);
  };

  // Filter properties (only show BUY listings on sale page)
  const buyProperties = useMemo(() => {
    return platformProps.filter((p) => (p.listingType || "BUY") === "BUY");
  }, [platformProps]);

  const filteredItems = useMemo(() => {
    return buyProperties.filter((item) => {
      if (appliedFilters.locality) {
        const needle = appliedFilters.locality.toLowerCase().trim();
        const tokens = needle.split(/[,\s]+/).filter(Boolean);
        const haystack = `${item.title} ${item.locality} ${item.city || ""} ${item.address || ""} ${item.projectName || ""}`.toLowerCase();
        const matches = tokens.every((token) => haystack.includes(token));
        if (!matches) return false;
      }
      if (appliedFilters.bhk) {
        if (item.bhk !== Number(appliedFilters.bhk)) return false;
      }
      if (appliedFilters.furnishing) {
        const f = item.furnishing.toLowerCase().replace(/_/g, "-");
        const target = appliedFilters.furnishing.toLowerCase().replace(/_/g, "-");
        if (!f.includes(target)) return false;
      }
      if (appliedFilters.propertyType) {
        const pt = item.propertyType.toLowerCase().replace(/_/g, " ");
        const target = appliedFilters.propertyType.toLowerCase().replace(/_/g, " ");
        if (!pt.includes(target)) return false;
      }
      if (appliedFilters.minPrice && item.price < Number(appliedFilters.minPrice)) return false;
      if (appliedFilters.maxPrice && item.price > Number(appliedFilters.maxPrice)) return false;
      return true;
    });
  }, [buyProperties, appliedFilters]);

  // Autocomplete suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);
  const locationSuggestions = useMemo(() => {
    if (!localityInput || localityInput.trim().length === 0) return [];
    const needle = localityInput.toLowerCase().trim();
    const suggestions = new Set<string>();

    buyProperties.forEach((item) => {
      if (item.locality && item.locality.toLowerCase().includes(needle)) {
        suggestions.add(item.locality);
      }
      if (item.projectName && item.projectName.toLowerCase().includes(needle)) {
        suggestions.add(item.projectName);
      }
    });

    return Array.from(suggestions).slice(0, 6);
  }, [buyProperties, localityInput]);

  // Sorting
  const sortedItems = useMemo(() => {
    const copy = [...filteredItems];
    if (sortBy === "price_asc") copy.sort((a, b) => a.price - b.price);
    else if (sortBy === "price_desc") copy.sort((a, b) => b.price - a.price);
    else if (sortBy === "area_desc") copy.sort((a, b) => (b.carpetArea || 0) - (a.carpetArea || 0));
    return copy;
  }, [filteredItems, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const paginatedItems = sortedItems.slice((page - 1) * pageSize, page * pageSize);

  const handleFav = async (propertyId: string, title: string) => {
    if (!user) {
      setActionMsg("Please log in to save favourites.");
      setTimeout(() => setActionMsg(null), 3000);
      return;
    }
    try {
      await api.post("/favourites", { propertyId });
      setActionMsg(`Saved "${title}" to favourites!`);
      setTimeout(() => setActionMsg(null), 3000);
    } catch (e: unknown) {
      setActionMsg(e instanceof Error ? e.message : "Failed to save favourite");
      setTimeout(() => setActionMsg(null), 3000);
    }
  };

  const handleCart = async (propertyId: string, title: string) => {
    if (!user) {
      setActionMsg("Please log in to add to cart.");
      setTimeout(() => setActionMsg(null), 3000);
      return;
    }
    try {
      await api.post("/cart", { propertyId });
      setActionMsg(`Added "${title}" to your cart!`);
      setTimeout(() => setActionMsg(null), 3000);
    } catch (e: unknown) {
      setActionMsg(e instanceof Error ? e.message : "Failed to add to cart");
      setTimeout(() => setActionMsg(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Properties for Sale in Jaipur</h1>
          <p className="text-sm text-ink/70">
            {sortedItems.length} verified propert{sortedItems.length === 1 ? "y" : "ies"} in the Pink City
          </p>
        </div>
      </div>

      {actionMsg && (
        <div className="rounded-xl bg-moss/10 border border-moss/20 px-4 py-2 text-sm text-moss font-semibold animate-fade-in">
          {actionMsg}
        </div>
      )}

      {/* Filter Bar */}
      <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Locality (e.g. Malviya Nagar, Mansarovar)"
              value={localityInput}
              onChange={(e) => {
                setLocalityInput(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setShowSuggestions(false);
                  applyFilters();
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
            value={bhkInput}
            onChange={(e) => setBhkInput(e.target.value)}
            className="rounded-xl border border-ink/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
          >
            <option value="">All BHKs</option>
            <option value="1">1 BHK</option>
            <option value="2">2 BHK</option>
            <option value="3">3 BHK</option>
            <option value="4">4+ BHK</option>
          </select>

          <select
            value={propertyTypeInput}
            onChange={(e) => setPropertyTypeInput(e.target.value)}
            className="rounded-xl border border-ink/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
          >
            <option value="">All Types</option>
            <option value="APARTMENT">Apartment</option>
            <option value="VILLA">Villa</option>
            <option value="INDEPENDENT_HOUSE">Independent House</option>
            <option value="PLOT">Plot</option>
            <option value="BUILDER_FLOOR">Builder Floor</option>
          </select>

          <select
            value={furnishingInput}
            onChange={(e) => setFurnishingInput(e.target.value)}
            className="rounded-xl border border-ink/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
          >
            <option value="">Any Furnishing</option>
            <option value="UNFURNISHED">Unfurnished</option>
            <option value="SEMI_FURNISHED">Semi-Furnished</option>
            <option value="FULLY_FURNISHED">Fully Furnished</option>
          </select>

          <input
            type="number"
            placeholder="Min Price (₹)"
            value={minPriceInput}
            onChange={(e) => setMinPriceInput(e.target.value)}
            className="rounded-xl border border-ink/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
          />

          <input
            type="number"
            placeholder="Max Price (₹)"
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value)}
            className="rounded-xl border border-ink/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/5 pt-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-ink/60 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-ink/10 bg-sand/30 px-2.5 py-1 text-xs"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="area_desc">Carpet Area: Large to Small</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={applyFilters}
              className="rounded-lg bg-ink px-4 py-1.5 font-semibold text-sand hover:bg-ink/90"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="rounded-lg border border-ink/20 px-3 py-1.5 text-ink/70 hover:bg-ink/5"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center text-ink/60">Loading properties...</div>
      ) : sortedItems.length === 0 ? (
        <div className="rounded-2xl border border-ink/10 bg-white p-12 text-center text-ink/60">
          No properties match your active filters. Try adjusting or clearing your filters.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedItems.map((item) => (
              <PropertyCard
                key={item.id}
                id={item.id}
                title={item.title}
                price={item.price}
                locality={item.locality}
                bhk={item.bhk}
                area={item.carpetArea}
                image={item.images?.[0]?.path}
                href={`/properties/${item.id}`}
                sold={item.status === "SOLD"}
                projectName={item.projectName || undefined}
                listingType={item.listingType}
                onFav={user?.role === "SELLER" ? undefined : () => void handleFav(item.id, item.title)}
                onCart={user?.role === "SELLER" || item.status === "SOLD" ? undefined : () => void handleCart(item.id, item.title)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-ink/20 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm font-semibold text-ink/80 px-2">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-ink/20 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
