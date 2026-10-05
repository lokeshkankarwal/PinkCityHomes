import { useState, useEffect, useRef } from "react";
import {
  searchJaipurLocations,
  getPopularJaipurLocalities,
  type JaipurLocation,
  JAIPUR_LOCATIONS,
} from "../services/jaipurLocations";

export const JAIPUR_LOCALITIES = JAIPUR_LOCATIONS.map((l) => l.name);

type Props = {
  value: string;
  onChange: (locality: string) => void;
  placeholder?: string;
  showPopularChips?: boolean;
};

export function LocationSearchBar({
  value,
  onChange,
  placeholder = "Search Jaipur locality, colony, road or area...",
  showPopularChips = true,
}: Props) {
  const [inputVal, setInputVal] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputVal(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestions = searchJaipurLocations(inputVal, 10);
  const popularList = getPopularJaipurLocalities();

  const handleSelect = (locName: string) => {
    setInputVal(locName);
    setShowDropdown(false);
    onChange(locName);
  };

  const handleClear = () => {
    setInputVal("");
    setShowDropdown(false);
    onChange("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setShowDropdown(false);
      if (suggestions.length > 0 && inputVal.trim()) {
        handleSelect(suggestions[0].name);
      } else {
        onChange(inputVal.trim());
      }
    }
  };

  // Helper to highlight matching text
  const renderHighlighted = (text: string, query: string) => {
    if (!query.trim()) return <span>{text}</span>;
    const q = query.trim().toLowerCase();
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return <span>{text}</span>;
    return (
      <span>
        {text.substring(0, idx)}
        <span className="font-bold text-pink-700 bg-pink-100 rounded px-0.5">
          {text.substring(idx, idx + q.length)}
        </span>
        {text.substring(idx + q.length)}
      </span>
    );
  };

  return (
    <div ref={containerRef} className="space-y-2 w-full">
      {/* Selected Location Chip if active */}
      {value && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-50 border border-pink-200 px-3 py-1 text-xs font-semibold text-pink-800 shadow-sm animate-fade-in">
            <span>📍</span>
            <span>{value}, Jaipur</span>
            <button
              type="button"
              onClick={handleClear}
              className="ml-1 flex h-4 w-4 items-center justify-center rounded-full hover:bg-pink-200 text-pink-700 text-xs font-bold"
              title="Remove location filter"
            >
              &times;
            </button>
          </span>
        </div>
      )}

      {/* Input Field */}
      <div className="relative flex items-center w-full min-w-0">
        <span className="absolute left-3.5 text-slate-400 text-base pointer-events-none">📍</span>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-20 text-xs sm:text-sm font-medium text-ink placeholder:text-slate-400 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 transition min-w-0"
        />
        {inputVal ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600 hover:bg-slate-200 active:scale-95"
            title="Clear location"
          >
            &times;
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onChange(inputVal.trim())}
            className="absolute right-2 rounded-xl bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-pink-600 transition active:scale-95 shadow-xs"
          >
            Search
          </button>
        )}

        {/* Autocomplete Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1.5 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl space-y-1 divide-y divide-slate-100">
            <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex justify-between items-center">
              <span>{inputVal.trim() ? "Matching Jaipur Locations" : "Popular Localities in Jaipur"}</span>
              <span className="text-[10px] text-slate-400 font-normal">Jaipur, Rajasthan</span>
            </div>

            <div className="pt-1 space-y-0.5">
              {suggestions.length > 0 ? (
                suggestions.map((loc: JaipurLocation) => (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => handleSelect(loc.name)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium text-ink hover:bg-pink-50 hover:text-pink-700 transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-pink-600 flex-shrink-0">📍</span>
                      <div className="min-w-0 truncate">
                        <p className="text-xs sm:text-sm font-semibold truncate">{renderHighlighted(loc.name, inputVal)}</p>
                        <p className="text-[10px] text-slate-400">Jaipur, Rajasthan</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 rounded px-1.5 py-0.5 flex-shrink-0 ml-2">
                      {loc.category}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-3 text-xs text-slate-600">
                  <p className="font-semibold text-ink">No exact location found for "{inputVal}".</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Press Enter to search listings with "{inputVal}" in address.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Popular Locality Quick Chips */}
      {showPopularChips && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold mr-1">Popular:</span>
          {popularList.slice(0, 8).map((loc) => (
            <button
              key={loc.name}
              type="button"
              onClick={() => handleSelect(loc.name)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition border active:scale-95 ${
                value.toLowerCase() === loc.name.toLowerCase()
                  ? "bg-pink-600 text-white border-pink-600 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:border-pink-300 hover:bg-pink-50/50 hover:text-pink-700"
              }`}
            >
              {loc.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

