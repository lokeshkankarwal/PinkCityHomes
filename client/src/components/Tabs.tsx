import { ReactNode } from "react";

export interface TabItem {
  key: string;
  label: string;
  count?: number;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
  variant?: "default" | "pills" | "underline";
  className?: string;
}

export function Tabs({
  tabs,
  active,
  onChange,
  variant = "default",
  className = "",
}: TabsProps) {
  if (variant === "pills") {
    return (
      <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-[13px] md:text-sm font-semibold transition-all duration-200 active:scale-[0.97] focus-ring ${
                isActive
                  ? "text-white shadow-btn-primary bg-gradient-to-b from-[#14325d] to-[#0b1d35]"
                  : "bg-white text-slate-500 border border-slate-200/70 hover:bg-slate-50 hover:text-ink shadow-xs"
              }`}
            >
              {tab.icon && <span className="transition-transform duration-200">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
                    isActive ? "bg-white/18 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === "underline") {
    return (
      <div className={`flex items-center gap-6 border-b border-slate-200/70 overflow-x-auto scrollbar-thin ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`relative pb-3 text-[13px] md:text-sm font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-2 active:scale-[0.98] focus-ring ${
                isActive ? "text-pink-600" : "text-slate-500 hover:text-ink"
              }`}
            >
              {tab.icon && <span className="transition-transform duration-200">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
                    isActive ? "bg-pink-50 text-pink-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-pink-600 rounded-full animate-scale-in" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default: container pill
  return (
    <div className={`inline-flex rounded-2xl bg-slate-100/80 p-1 text-[13px] md:text-sm font-semibold shadow-xs ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 transition-all duration-200 active:scale-[0.97] focus-ring ${
              isActive
                ? "bg-white text-ink font-bold shadow-card"
                : "text-slate-500 hover:text-ink"
            }`}
          >
            {tab.icon && <span className="transition-transform duration-200">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
                  isActive ? "bg-navy-50 text-navy-700" : "bg-white/60 text-slate-500"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
