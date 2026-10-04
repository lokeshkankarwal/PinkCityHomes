import { useState, useEffect, useRef } from "react";

export const JAIPUR_LOCALITIES = [
  "Malviya Nagar",
  "Mansarovar",
  "Vaishali Nagar",
  "C-Scheme",
  "Jagatpura",
  "Tonk Road",
  "Ajmer Road",
  "Civil Lines",
  "Shyam Nagar",
  "Murlipura",
  "Raja Park",
  "Bapu Nagar",
  "Gopalpura",
  "Vidyadhar Nagar",
];

type Props = {
  value: string;
  onChange: (locality: string) => void;
  placeholder?: string;
  showPopularChips?: boolean;
};

export function LocationSearchBar({
  value,
  onChange,
  placeholder = 'Try "Malviya Nagar", "Mansarovar", or "Vaishali Nagar"',
  showPopularChips = true,
}: Props) {
  const [inputVal, setInputVal] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputVal(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestions = JAIPUR_LOCALITIES.filter((loc) =>
    loc.toLowerCase().includes(inputVal.trim().toLowerCase()),
  );

  const handleSelect = (loc: string) => {
    setInputVal(loc);
    setShowDropdown(false);
    onChange(loc);
  };

  const handleClear = () => {
    setInputVal("");
    setShowDropdown(false);
    onChange("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setShowDropdown(false);
      onChange(inputVal.trim());
    }
  };

  return (
    <div ref={containerRef} className="space-y-2 w-full">
      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-ink/40 text-base">📍</span>
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
          className="w-full rounded-2xl border border-ink/15 bg-white py-3 pl-10 pr-10 text-sm font-medium text-ink placeholder:text-ink/40 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 transition"
        />
        {inputVal ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink/10 text-xs text-ink/70 hover:bg-ink/20"
            title="Clear locality"
          >
            &times;
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onChange(inputVal.trim())}
            className="absolute right-2 rounded-xl bg-ink px-3 py-1.5 text-xs font-semibold text-sand hover:bg-pink-700 transition"
          >
            Find
          </button>
        )}

        {/* Autocomplete Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-2xl border border-ink/10 bg-white p-2 shadow-2xl space-y-1">
            <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink/40">
              Popular Localities in Jaipur
            </p>
            {suggestions.length > 0 ? (
              suggestions.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => handleSelect(loc)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-ink hover:bg-pink-50 hover:text-pink-700 transition"
                >
                  <span className="text-pink-600">📍</span>
                  <span>{loc}, Jaipur</span>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-xs text-ink/60">
                No matching locality found. Press Enter to search "{inputVal}".
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick locality chips */}
      {showPopularChips && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-ink/50 text-[11px] font-semibold mr-1">Popular:</span>
          {["Malviya Nagar", "Mansarovar", "Vaishali Nagar", "C-Scheme", "Jagatpura"].map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => handleSelect(loc)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition border ${
                value.toLowerCase() === loc.toLowerCase()
                  ? "bg-pink-600 text-white border-pink-600 shadow-sm"
                  : "bg-white text-ink/70 border-ink/10 hover:border-pink-300 hover:bg-pink-50/50 hover:text-pink-700"
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
