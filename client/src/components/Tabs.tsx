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
              className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs md:text-sm font-semibold transition-all duration-200 active:scale-95 ${
                isActive
                  ? "bg-navy text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-navy"
              }`}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
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
      <div className={`flex items-center gap-6 border-b border-slate-200 overflow-x-auto scrollbar-thin ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`relative pb-3 text-xs md:text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
                isActive ? "text-pink-600" : "text-slate-500 hover:text-navy"
              }`}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive ? "bg-pink-100 text-pink-700" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default: container pill
  return (
    <div className={`inline-flex rounded-2xl bg-slate-100/90 p-1 text-xs md:text-sm font-semibold ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 transition-all duration-200 active:scale-95 ${
              isActive
                ? "bg-white text-navy font-bold shadow-sm"
                : "text-slate-600 hover:text-navy"
            }`}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isActive ? "bg-navy-50 text-navy-800" : "bg-slate-200 text-slate-700"
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
