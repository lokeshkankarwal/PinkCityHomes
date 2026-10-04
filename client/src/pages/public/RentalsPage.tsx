import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { PropertyCard } from "../../components/PropertyCard";
import { LocationSearchBar } from "../../components/LocationSearchBar";
import { PropertyFilterBar, type FilterState } from "../../components/PropertyFilterBar";
import { useAuth } from "../../auth";
import type { Property } from "../../types";

export default function RentalsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    locality: searchParams.get("locality") || "",
    minPrice: searchParams.get("minRent") || searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxRent") || searchParams.get("maxPrice") || "",
    bhk: searchParams.get("bhk") || "",
    propertyType: searchParams.get("type") || "",
    furnishing: searchParams.get("furnishing") || "",
    bathrooms: searchParams.get("bathrooms") || "",
    minArea: searchParams.get("minArea") || "",
    sort: searchParams.get("sort") || "recommended",
  });

  const [rentals, setRentals] = useState<Property[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Sync state to URL
  const updateFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);

    const p = new URLSearchParams();
    if (newFilters.locality) p.set("locality", newFilters.locality);
    if (newFilters.minPrice) p.set("minRent", newFilters.minPrice);
    if (newFilters.maxPrice) p.set("maxRent", newFilters.maxPrice);
    if (newFilters.bhk) p.set("bhk", newFilters.bhk);
    if (newFilters.propertyType) p.set("type", newFilters.propertyType);
    if (newFilters.furnishing) p.set("furnishing", newFilters.furnishing);
    if (newFilters.bathrooms) p.set("bathrooms", newFilters.bathrooms);
    if (newFilters.minArea) p.set("minArea", newFilters.minArea);
    if (newFilters.sort && newFilters.sort !== "recommended") p.set("sort", newFilters.sort);
    setSearchParams(p);
  };

  // Fetch rental properties
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const queryParts = new URLSearchParams();
    queryParts.set("listingType", "RENT");
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

    api
      .get<{ total: number; results: Property[] }>(`/properties/search?${queryParts.toString()}`)
      .then((res) => {
        if (!isMounted) return;
        setRentals(res.results || []);
        setTotalCount(res.total ?? (res.results || []).length);
      })
      .catch(() => {
        if (!isMounted) return;
        setRentals([]);
        setTotalCount(0);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [filters, page]);

  const handleFav = async (propertyId: string, title: string) => {
    if (!user) {
      setActionMsg("Please log in to save favourites.");
      setTimeout(() => setActionMsg(null), 3000);
      return;
    }
    try {
      await api.post("/favourites", { propertyId });
      window.dispatchEvent(new Event("favourites-updated"));
      setActionMsg(`Saved "${title}" to favourites!`);
      setTimeout(() => setActionMsg(null), 3000);
    } catch (e: unknown) {
      setActionMsg(e instanceof Error ? e.message : "Failed to save favourite");
      setTimeout(() => setActionMsg(null), 3000);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Location Search */}
      <div className="space-y-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
            🔑 Rental Homes in Jaipur
          </div>
          <h1 className="font-serif text-3xl font-bold mt-2 sm:text-4xl text-ink">
            Find Furnished &amp; Unfurnished Rentals in Jaipur
          </h1>
          <p className="text-sm text-ink/70 max-w-2xl mt-1">
            Browse verified flats, apartments, and villas available for monthly lease across Jaipur's premier residential localities.
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

      {/* Filter Bar (Card- & Filter-first) */}
      <PropertyFilterBar
        filters={filters}
        onChange={updateFilters}
        listingType="RENT"
        totalCount={totalCount}
        loading={loading}
      />

      {/* Rentals Grid */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-r-transparent"></div>
          <p className="text-sm font-semibold text-ink/60">Searching verified rental homes in Jaipur...</p>
        </div>
      ) : rentals.length === 0 ? (
        /* Friendly Empty State */
        <div className="rounded-3xl border border-ink/10 bg-white p-8 sm:p-12 text-center space-y-4 shadow-sm max-w-2xl mx-auto">
          <span className="text-4xl">🔑</span>
          <h3 className="font-serif text-2xl font-bold text-ink">No rental homes found with these filters</h3>
          <div className="text-sm text-ink/70 text-left space-y-2 bg-sand/40 p-5 rounded-2xl border border-ink/5">
            <p className="font-semibold text-ink">Helpful suggestions:</p>
            <ul className="list-disc list-inside text-xs space-y-1.5 text-ink/70">
              <li>Try increasing your monthly rent budget range</li>
              <li>Consider semi-furnished or unfurnished options</li>
              <li>Explore nearby localities with good metro connectivity</li>
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
            className="inline-block rounded-xl bg-ink px-6 py-2.5 text-xs font-bold text-sand hover:bg-ink/90 transition shadow"
          >
            Clear Filters & Show All Rentals
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {rentals.map((item) => (
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
                listingType="RENT"
                onFav={user?.role === "SELLER" ? undefined : () => void handleFav(item.id, item.title)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                disabled={page <= 1}
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 120, behavior: "smooth" });
                }}
                className="rounded-xl border border-ink/20 bg-white px-4 py-2 text-xs font-bold disabled:opacity-40 hover:bg-sand transition shadow-sm"
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
                className="rounded-xl border border-ink/20 bg-white px-4 py-2 text-xs font-bold disabled:opacity-40 hover:bg-sand transition shadow-sm"
              >
                Next &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
