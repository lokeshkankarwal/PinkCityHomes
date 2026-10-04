import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../../api/client";
import { inr, imgSrc } from "../../lib/format";
import type { Property } from "../../types";

export default function RentalsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [localityInput, setLocalityInput] = useState(searchParams.get("locality") || "");
  const [bhkInput, setBhkInput] = useState(searchParams.get("bhk") || "");
  const [furnishingInput, setFurnishingInput] = useState(searchParams.get("furnishing") || "");
  const [maxRentInput, setMaxRentInput] = useState(searchParams.get("maxRent") || "");
  const [sortBy, setSortBy] = useState("rent_asc");

  const [appliedFilters, setAppliedFilters] = useState({
    locality: searchParams.get("locality") || "",
    bhk: searchParams.get("bhk") || "",
    furnishing: searchParams.get("furnishing") || "",
    maxRent: searchParams.get("maxRent") || "",
  });

  const [rentals, setRentals] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    setLoading(true);
    api
      .get<{ results: Property[] }>("/properties?listingType=RENT&limit=200")
      .then((d) => setRentals(d.results || []))
      .catch(() => setRentals([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...rentals];

    if (appliedFilters.locality) {
      list = list.filter((r) =>
        r.locality.toLowerCase().includes(appliedFilters.locality.toLowerCase())
      );
    }
    if (appliedFilters.bhk) {
      list = list.filter((r) => r.bhk === Number(appliedFilters.bhk));
    }
    if (appliedFilters.furnishing) {
      list = list.filter((r) =>
        r.furnishing.toLowerCase() === appliedFilters.furnishing.toLowerCase()
      );
    }
    if (appliedFilters.maxRent) {
      list = list.filter((r) => r.price <= Number(appliedFilters.maxRent));
    }

    if (sortBy === "rent_asc") list.sort((a, b) => a.price - b.price);
    if (sortBy === "rent_desc") list.sort((a, b) => b.price - a.price);
    if (sortBy === "area_desc") list.sort((a, b) => b.carpetArea - a.carpetArea);

    return list;
  }, [rentals, appliedFilters, sortBy]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const handleApply = () => {
    setAppliedFilters({
      locality: localityInput,
      bhk: bhkInput,
      furnishing: furnishingInput,
      maxRent: maxRentInput,
    });
    setPage(1);
    const q: Record<string, string> = {};
    if (localityInput) q.locality = localityInput;
    if (bhkInput) q.bhk = bhkInput;
    if (furnishingInput) q.furnishing = furnishingInput;
    if (maxRentInput) q.maxRent = maxRentInput;
    setSearchParams(q);
  };

  const handleReset = () => {
    setLocalityInput("");
    setBhkInput("");
    setFurnishingInput("");
    setMaxRentInput("");
    setAppliedFilters({ locality: "", bhk: "", furnishing: "", maxRent: "" });
    setPage(1);
    setSearchParams({});
  };

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">Rentals in Jaipur</h1>
        <p className="mt-1 text-sm text-ink/70">
          Find furnished and unfurnished rental homes across Jaipur's best localities.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 space-y-4 flex-none">
          <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm space-y-4">
            <h2 className="font-serif text-base font-bold">Filter Rentals</h2>

            <div>
              <label className="text-xs font-semibold text-ink/60 uppercase">Locality</label>
              <input
                type="text"
                placeholder="e.g. Malviya Nagar"
                value={localityInput}
                onChange={(e) => setLocalityInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink/60 uppercase">BHK</label>
              <select
                value={bhkInput}
                onChange={(e) => setBhkInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              >
                <option value="">Any</option>
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4+ BHK</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink/60 uppercase">Furnishing</label>
              <select
                value={furnishingInput}
                onChange={(e) => setFurnishingInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              >
                <option value="">Any</option>
                <option value="FULLY_FURNISHED">Fully Furnished</option>
                <option value="SEMI_FURNISHED">Semi Furnished</option>
                <option value="UNFURNISHED">Unfurnished</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink/60 uppercase">Max Monthly Rent (₹)</label>
              <input
                type="number"
                placeholder="e.g. 30000"
                value={maxRentInput}
                onChange={(e) => setMaxRentInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink/60 uppercase">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="mt-1 w-full rounded-xl border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              >
                <option value="rent_asc">Rent: Low to High</option>
                <option value="rent_desc">Rent: High to Low</option>
                <option value="area_desc">Largest Area First</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 rounded-xl bg-ink py-2 text-sm font-semibold text-sand hover:bg-ink/90 transition"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border border-ink/20 px-3 py-2 text-sm text-ink/60 hover:text-ink transition"
              >
                Reset
              </button>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink/60">
              {loading ? "Loading..." : `${filtered.length} rental${filtered.length !== 1 ? "s" : ""} found`}
            </p>
          </div>

          {loading ? (
            <div className="py-24 text-center text-ink/60">Loading rentals...</div>
          ) : paginated.length === 0 ? (
            <div className="rounded-3xl border border-ink/10 bg-white p-12 text-center space-y-4">
              <p className="font-serif text-xl font-bold">No rentals found</p>
              <p className="text-sm text-ink/70">
                No rental listings match your filters yet. Be the first to list a rental in Jaipur.
              </p>
              <Link
                to="/register"
                className="inline-block rounded-xl bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-700"
              >
                Register as Seller &rarr;
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {paginated.map((r) => (
                  <Link
                    key={r.id}
                    to={`/properties/${r.id}`}
                    className="group overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm hover:shadow-md transition"
                  >
                    <img
                      src={imgSrc(r.images?.[0]?.path)}
                      alt=""
                      className="h-44 w-full object-cover"
                    />
                    <div className="p-4 space-y-1">
                      <p className="text-xs uppercase tracking-wider text-moss font-bold">
                        {r.bhk} BHK · {r.furnishing.replace(/_/g, " ")}
                      </p>
                      <h3 className="font-serif text-base font-bold line-clamp-1">{r.title}</h3>
                      <p className="font-serif text-xl font-bold text-ink">
                        {inr(r.price)}<span className="text-sm font-normal text-ink/60"> / mo</span>
                      </p>
                      <p className="text-xs text-ink/60 capitalize">📍 {r.locality}, Jaipur</p>
                      <p className="text-xs text-ink/50">{r.carpetArea} sq ft · {r.bathrooms} bath</p>
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="rounded-xl border border-ink/20 px-4 py-2 text-sm disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <span className="flex items-center px-4 text-sm text-ink/60">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="rounded-xl border border-ink/20 px-4 py-2 text-sm disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
