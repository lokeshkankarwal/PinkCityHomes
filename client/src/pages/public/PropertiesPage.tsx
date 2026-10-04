import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { PropertyCard } from "../../components/PropertyCard";
import { PropertyMap, type MapProperty, type MapBounds } from "../../components/PropertyMap";
import { LocationSearchBar } from "../../components/LocationSearchBar";
import { PropertyFilterBar, type FilterState } from "../../components/PropertyFilterBar";
import { useAuth } from "../../auth";
import type { Property } from "../../types";

export default function PropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    locality: searchParams.get("locality") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    bhk: searchParams.get("bhk") || "",
    propertyType: searchParams.get("type") || "",
    furnishing: searchParams.get("furnishing") || "",
    bathrooms: searchParams.get("bathrooms") || "",
    minArea: searchParams.get("minArea") || "",
    sort: searchParams.get("sort") || "recommended",
  });

  const [properties, setProperties] = useState<Property[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Map state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);

  // Mobile view mode
  const [mobileTab, setMobileTab] = useState<"list" | "map">("list");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Sync state to URL
  const updateFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
    setMapBounds(null); // Reset explicit map bounds when user changes filters

    const p = new URLSearchParams();
    if (newFilters.locality) p.set("locality", newFilters.locality);
    if (newFilters.minPrice) p.set("minPrice", newFilters.minPrice);
    if (newFilters.maxPrice) p.set("maxPrice", newFilters.maxPrice);
    if (newFilters.bhk) p.set("bhk", newFilters.bhk);
    if (newFilters.propertyType) p.set("type", newFilters.propertyType);
    if (newFilters.furnishing) p.set("furnishing", newFilters.furnishing);
    if (newFilters.bathrooms) p.set("bathrooms", newFilters.bathrooms);
    if (newFilters.minArea) p.set("minArea", newFilters.minArea);
    if (newFilters.sort && newFilters.sort !== "recommended") p.set("sort", newFilters.sort);
    setSearchParams(p);
  };

  // Fetch properties (geospatial or filter query)
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const queryParts = new URLSearchParams();
    queryParts.set("listingType", "BUY");
    queryParts.set("page", String(page));
    queryParts.set("limit", String(pageSize));

    if (filters.locality) queryParts.set("locality", filters.locality);
    if (filters.minPrice) queryParts.set("minPrice", filters.minPrice);
    if (filters.maxPrice) queryParts.set("maxPrice", filters.maxPrice);
    if (filters.bhk) queryParts.set("bhk", filters.bhk);
    if (filters.propertyType) queryParts.set("propertyType", filters.propertyType);
    if (filters.furnishing) queryParts.set("furnishing", filters.furnishing);
    if (filters.bathrooms) queryParts.set("bathrooms", filters.bathrooms);
    if (filters.sort) queryParts.set("sort", filters.sort);

    // Apply map bounding box if "Search this area" was triggered
    if (mapBounds) {
      queryParts.set("north", String(mapBounds.north));
      queryParts.set("south", String(mapBounds.south));
      queryParts.set("east", String(mapBounds.east));
      queryParts.set("west", String(mapBounds.west));
    }

    api
      .get<{ total: number; results: Property[] }>(`/properties/search?${queryParts.toString()}`)
      .then((res) => {
        if (!isMounted) return;
        setProperties(res.results || []);
        setTotalCount(res.total ?? (res.results || []).length);
      })
      .catch(() => {
        if (!isMounted) return;
        setProperties([]);
        setTotalCount(0);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [filters, page, mapBounds]);

  const handleSearchArea = (bounds: MapBounds) => {
    setMapBounds(bounds);
    setPage(1);
  };

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

  // Prepare map properties
  const mapPoints: MapProperty[] = useMemo(() => {
    return properties.map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      latitude: p.latitude,
      longitude: p.longitude,
      locality: p.locality,
      city: p.city,
      bhk: p.bhk,
      bathrooms: p.bathrooms,
      carpetArea: p.carpetArea,
      propertyType: p.propertyType,
      listingType: "BUY",
      primaryImage: p.images?.[0]?.path || p.primaryImage,
      href: `/properties/${p.id}`,
    }));
  }, [properties]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Location Search */}
      <div className="space-y-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-bold text-pink-700">
            🏙️ Properties for Sale in Jaipur
          </div>
          <h1 className="font-serif text-3xl font-bold mt-2 sm:text-4xl text-ink">
            Find Your Dream Home in the Pink City
          </h1>
          <p className="text-sm text-ink/70 max-w-2xl mt-1">
            Explore verified residential apartments, luxury villas, and independent houses across Jaipur's top micro-markets.
          </p>
        </div>

        <LocationSearchBar
          value={filters.locality}
          onChange={(loc) => updateFilters({ ...filters, locality: loc })}
        />
      </div>

      {actionMsg && (
        <div className="rounded-2xl bg-moss/10 border border-moss/20 px-4 py-2.5 text-sm text-moss font-semibold animate-fade-in">
          {actionMsg}
        </div>
      )}

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex rounded-2xl bg-ink/5 p-1 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setMobileTab("list")}
          className={`flex-1 rounded-xl py-2 transition flex items-center justify-center gap-2 ${
            mobileTab === "list" ? "bg-white shadow text-ink" : "text-ink/60"
          }`}
        >
          <span>📋</span> List View ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("map")}
          className={`flex-1 rounded-xl py-2 transition flex items-center justify-center gap-2 ${
            mobileTab === "map" ? "bg-white shadow text-ink" : "text-ink/60"
          }`}
        >
          <span>🗺️</span> Interactive Map
        </button>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Filters + Property List */}
        <div
          className={`lg:col-span-7 xl:col-span-7 space-y-6 ${
            mobileTab === "map" ? "hidden lg:block" : "block"
          }`}
        >
          {/* Filter Bar */}
          <PropertyFilterBar
            filters={filters}
            onChange={updateFilters}
            listingType="BUY"
            totalCount={totalCount}
            loading={loading}
          />

          {/* Properties List */}
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-pink-600 border-r-transparent"></div>
              <p className="text-sm font-semibold text-ink/60">Searching verified Jaipur homes...</p>
            </div>
          ) : properties.length === 0 ? (
            /* Friendly Empty State */
            <div className="rounded-3xl border border-ink/10 bg-white p-8 sm:p-12 text-center space-y-4 shadow-sm">
              <span className="text-4xl">🏡</span>
              <h3 className="font-serif text-2xl font-bold text-ink">No homes found with these filters</h3>
              <div className="text-sm text-ink/70 max-w-md mx-auto text-left space-y-2 bg-sand/40 p-4 rounded-2xl border border-ink/5">
                <p className="font-semibold text-ink">Helpful suggestions:</p>
                <ul className="list-disc list-inside text-xs space-y-1 text-ink/70">
                  <li>Try increasing your budget range or choosing fewer bedrooms</li>
                  <li>Search nearby localities (e.g. Malviya Nagar, Mansarovar, Jagatpura)</li>
                  <li>Clear some filters to see all available listings in Jaipur</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateFilters({
                    locality: "",
                    minPrice: "",
                    maxPrice: "",
                    bhk: "",
                    propertyType: "",
                    furnishing: "",
                    bathrooms: "",
                    minArea: "",
                    sort: "recommended",
                  })
                }
                className="inline-block rounded-xl bg-pink-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-pink-700 transition shadow"
              >
                Clear Filters & Show All Homes
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {properties.map((item) => (
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
                    projectName={item.projectName || undefined}
                    listingType="BUY"
                    isSelected={selectedId === item.id}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onFav={user?.role === "SELLER" ? undefined : () => void handleFav(item.id, item.title)}
                    onCart={
                      user?.role === "SELLER" || item.status === "SOLD"
                        ? undefined
                        : () => void handleCart(item.id, item.title)
                    }
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button
                    disabled={page <= 1}
                    onClick={() => {
                      setPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 120, behavior: "smooth" });
                    }}
                    className="rounded-xl border border-ink/20 px-4 py-2 text-xs font-bold disabled:opacity-40 hover:bg-sand transition"
                  >
                    &larr; Previous
                  </button>
                  <span className="text-xs font-bold text-ink/70 px-3">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => {
                      setPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 120, behavior: "smooth" });
                    }}
                    className="rounded-xl border border-ink/20 px-4 py-2 text-xs font-bold disabled:opacity-40 hover:bg-sand transition"
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Side: Sticky Interactive Map */}
        <div
          className={`lg:col-span-5 xl:col-span-5 sticky top-20 ${
            mobileTab === "list" ? "hidden lg:block" : "block"
          } h-[550px] lg:h-[calc(100vh-140px)]`}
        >
          <PropertyMap
            properties={mapPoints}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelectProperty={setSelectedId}
            onSearchArea={handleSearchArea}
            listingType="BUY"
          />
        </div>
      </div>
    </div>
  );
}
