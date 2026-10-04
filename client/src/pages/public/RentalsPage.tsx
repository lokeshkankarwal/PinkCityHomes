import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { PropertyCard } from "../../components/PropertyCard";
import { LocationSearchBar } from "../../components/LocationSearchBar";
import { PropertyFilterBar, type FilterState } from "../../components/PropertyFilterBar";
import { SkeletonCard } from "../../components/Skeleton";
import { EmptyState } from "../../components/EmptyState";
import { toast } from "../../components/Toast";
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
      toast.info("Please log in to save favourites.");
      return;
    }
    try {
      await api.post("/favourites", { propertyId });
      window.dispatchEvent(new Event("favourites-updated"));
      toast.success(`Saved "${title}" to favourites!`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save favourite");
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* Header & Location Search */}
      <div className="space-y-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
            🔑 Rental Homes in Jaipur
          </div>
          <h1 className="font-display text-3xl font-bold mt-2 sm:text-4xl text-navy">
            Find Furnished &amp; Unfurnished Rentals in Jaipur
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1">
            Browse verified flats, apartments, and villas available for monthly lease across Jaipur's premier residential localities.
          </p>
        </div>

        <LocationSearchBar
          value={filters.locality}
          onChange={(loc) => updateFilters({ ...filters, locality: loc })}
        />
      </div>

      {/* Filter Bar */}
      <PropertyFilterBar
        filters={filters}
        onChange={updateFilters}
        listingType="RENT"
        totalCount={totalCount}
        loading={loading}
      />

      {/* Rentals Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-4">
          <SkeletonCard count={8} />
        </div>
      ) : rentals.length === 0 ? (
        <EmptyState
          icon="🔑"
          title="No rental homes found with these filters"
          body="Try adjusting your monthly rent range, choosing different bedrooms, or clearing filters."
          action={{
            label: "Clear Filters & Show All Rentals",
            onClick: () =>
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
              }),
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-2">
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
            <div className="flex items-center justify-center gap-2 pt-8">
              <button
                disabled={page <= 1}
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 120, behavior: "smooth" });
                }}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition shadow-xs active:scale-95"
              >
                &larr; Previous
              </button>
              <span className="text-xs font-bold text-slate-600 px-3">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => {
                  setPage((p) => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 120, behavior: "smooth" });
                }}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition shadow-xs active:scale-95"
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
