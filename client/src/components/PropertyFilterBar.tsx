import { useState } from "react";

export type FilterState = {
  locality: string;
  minPrice: string;
  maxPrice: string;
  bhk: string;
  propertyType: string;
  furnishing: string;
  bathrooms?: string;
  minArea?: string;
  sort: string;
};

type Props = {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  listingType: "BUY" | "RENT";
  totalCount: number;
  loading?: boolean;
};

export function PropertyFilterBar({
  filters,
  onChange,
  listingType,
  totalCount,
  loading = false,
}: Props) {
  const [showMore, setShowMore] = useState(false);

  const buyBudgetPresets = [
    { label: "Under ₹50L", min: "", max: "5000000" },
    { label: "₹50L – ₹1Cr", min: "5000000", max: "10000000" },
    { label: "₹1Cr – ₹2Cr", min: "10000000", max: "20000000" },
    { label: "₹2Cr+", min: "20000000", max: "" },
  ];

  const rentBudgetPresets = [
    { label: "Under ₹15K", min: "", max: "15000" },
    { label: "₹15K – ₹30K", min: "15000", max: "30000" },
    { label: "₹30K – ₹50K", min: "30000", max: "50000" },
    { label: "₹50K+", min: "50000", max: "" },
  ];

  const budgetPresets = listingType === "RENT" ? rentBudgetPresets : buyBudgetPresets;

  const handlePresetClick = (min: string, max: string) => {
    if (filters.minPrice === min && filters.maxPrice === max) {
      // Toggle off
      onChange({ ...filters, minPrice: "", maxPrice: "" });
    } else {
      onChange({ ...filters, minPrice: min, maxPrice: max });
    }
  };

  const handleBhkClick = (bhkVal: string) => {
    onChange({ ...filters, bhk: filters.bhk === bhkVal ? "" : bhkVal });
  };

  const handlePropertyTypeClick = (typeVal: string) => {
    onChange({ ...filters, propertyType: filters.propertyType === typeVal ? "" : typeVal });
  };

  const handleFurnishingClick = (fVal: string) => {
    onChange({ ...filters, furnishing: filters.furnishing === fVal ? "" : fVal });
  };

  const handleClearAll = () => {
    onChange({
      locality: "",
      minPrice: "",
      maxPrice: "",
      bhk: "",
      propertyType: "",
      furnishing: "",
      bathrooms: "",
      minArea: "",
      sort: "recommended",
    });
  };

  // Compute active chips
  const activeChips: { label: string; onRemove: () => void }[] = [];

  if (filters.locality) {
    activeChips.push({
      label: filters.locality,
      onRemove: () => onChange({ ...filters, locality: "" }),
    });
  }

  if (filters.bhk) {
    activeChips.push({
      label: `${filters.bhk} BHK`,
      onRemove: () => onChange({ ...filters, bhk: "" }),
    });
  }

  if (filters.propertyType) {
    activeChips.push({
      label: filters.propertyType.replace(/_/g, " "),
      onRemove: () => onChange({ ...filters, propertyType: "" }),
    });
  }

  if (filters.furnishing) {
    activeChips.push({
      label: filters.furnishing.replace(/_/g, " "),
      onRemove: () => onChange({ ...filters, furnishing: "" }),
    });
  }

  if (filters.minPrice || filters.maxPrice) {
    const preset = budgetPresets.find(
      (b) => b.min === filters.minPrice && b.max === filters.maxPrice,
    );
    const label = preset
      ? preset.label
      : `₹${filters.minPrice ? Number(filters.minPrice).toLocaleString("en-IN") : "0"} – ${
          filters.maxPrice ? "₹" + Number(filters.maxPrice).toLocaleString("en-IN") : "Any"
        }`;
    activeChips.push({
      label,
      onRemove: () => onChange({ ...filters, minPrice: "", maxPrice: "" }),
    });
  }

  if (filters.bathrooms) {
    activeChips.push({
      label: `${filters.bathrooms}+ Baths`,
      onRemove: () => onChange({ ...filters, bathrooms: "" }),
    });
  }

  if (filters.minArea) {
    activeChips.push({
      label: `>${filters.minArea} sqft`,
      onRemove: () => onChange({ ...filters, minArea: "" }),
    });
  }

  return (
    <div className="space-y-4 rounded-4xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-card">
      {/* Top row: Results count & Sorting */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="font-display text-lg font-bold text-navy flex items-center gap-2">
            <span>{loading ? "Searching..." : `${totalCount} ${listingType === "RENT" ? "rental homes" : "homes"} found`}</span>
            {totalCount > 0 && <span className="text-xs font-bold text-pink-700 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200">Jaipur</span>}
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold">Sort by:</span>
          <select
            value={filters.sort}
            onChange={(e) => onChange({ ...filters, sort: e.target.value })}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="recommended">Recommended</option>
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="area_desc">Area: Large to Small</option>
            <option value="area_asc">Area: Small to Large</option>
          </select>
        </div>
      </div>

      {/* Quick Budget Presets */}
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {listingType === "RENT" ? "Monthly Rent Budget" : "Price Range"}
        </label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {budgetPresets.map((preset) => {
            const isActive = filters.minPrice === preset.min && filters.maxPrice === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handlePresetClick(preset.min, preset.max)}
                className={`rounded-2xl px-3.5 py-1.5 text-xs font-semibold transition-all border active:scale-95 ${
                  isActive
                    ? "bg-pink-600 text-white border-pink-600 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:border-pink-300 hover:bg-pink-50/50 hover:text-pink-700"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* BHK Selector Chips */}
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Bedrooms (BHK)</label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {[
            { label: "Any", val: "" },
            { label: "1 BHK", val: "1" },
            { label: "2 BHK", val: "2" },
            { label: "3 BHK", val: "3" },
            { label: "4 BHK", val: "4" },
            { label: "5+ BHK", val: "5" },
          ].map((item) => {
            const isActive = filters.bhk === item.val;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleBhkClick(item.val)}
                className={`rounded-2xl px-3.5 py-1.5 text-xs font-semibold transition-all border active:scale-95 ${
                  isActive
                    ? "bg-navy text-white border-navy shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Property Type Chips */}
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-ink/50">Property Type</label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {[
            { label: "Any", val: "" },
            { label: "Apartment", val: "APARTMENT" },
            { label: "Villa", val: "VILLA" },
            { label: "Independent House", val: "INDEPENDENT_HOUSE" },
            { label: "Plot", val: "PLOT" },
            { label: "Builder Floor", val: "BUILDER_FLOOR" },
          ].map((item) => {
            const isActive = filters.propertyType === item.val;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handlePropertyTypeClick(item.val)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition border ${
                  isActive
                    ? "bg-pink-600 text-white border-pink-600 shadow-sm"
                    : "bg-sand/30 text-ink/80 border-ink/10 hover:border-pink-300 hover:bg-pink-50/50 hover:text-pink-700"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Furnishing Status Chips */}
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-ink/50">Furnishing</label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {[
            { label: "Any", val: "" },
            { label: "Fully Furnished", val: "FULLY_FURNISHED" },
            { label: "Semi-Furnished", val: "SEMI_FURNISHED" },
            { label: "Unfurnished", val: "UNFURNISHED" },
          ].map((item) => {
            const isActive = filters.furnishing === item.val;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleFurnishingClick(item.val)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition border ${
                  isActive
                    ? "bg-ink text-sand border-ink shadow-sm"
                    : "bg-sand/30 text-ink/80 border-ink/10 hover:border-ink/30 hover:bg-sand/60"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Expandable "More Filters" section */}
      <div>
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="flex items-center gap-1.5 text-xs font-bold text-pink-700 hover:text-pink-800 transition"
        >
          <span>{showMore ? "Fewer Filters ▲" : "More Filters ▼"}</span>
        </button>

        {showMore && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl bg-sand/30 p-4 border border-ink/5 text-xs">
            <div>
              <label className="font-semibold text-ink/70">Min Price (₹)</label>
              <input
                type="number"
                placeholder="e.g. 2500000"
                value={filters.minPrice}
                onChange={(e) => onChange({ ...filters, minPrice: e.target.value })}
                className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-1.5 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>

            <div>
              <label className="font-semibold text-ink/70">Max Price (₹)</label>
              <input
                type="number"
                placeholder="e.g. 9500000"
                value={filters.maxPrice}
                onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
                className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-1.5 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>

            <div>
              <label className="font-semibold text-ink/70">Min Carpet Area (sq ft)</label>
              <input
                type="number"
                placeholder="e.g. 1000"
                value={filters.minArea ?? ""}
                onChange={(e) => onChange({ ...filters, minArea: e.target.value })}
                className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-1.5 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>

            <div>
              <label className="font-semibold text-ink/70">Bathrooms</label>
              <select
                value={filters.bathrooms ?? ""}
                onChange={(e) => onChange({ ...filters, bathrooms: e.target.value })}
                className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-1.5 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-pink-300"
              >
                <option value="">Any</option>
                <option value="1">1+ Bath</option>
                <option value="2">2+ Baths</option>
                <option value="3">3+ Baths</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Active Filter Chips & Clear All */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-ink/5 pt-3">
          <span className="text-[11px] font-bold text-ink/50 uppercase tracking-wider mr-1">Active Filters:</span>
          {activeChips.map((chip, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 rounded-full bg-pink-50 border border-pink-200 px-3 py-1 text-xs font-semibold text-pink-800"
            >
              <span>{chip.label}</span>
              <button
                type="button"
                onClick={chip.onRemove}
                className="hover:text-pink-950 font-bold"
                title="Remove filter"
              >
                &times;
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs font-semibold text-ink/60 hover:text-red-700 underline transition ml-auto"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
