import { ReactNode } from "react";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon = "🏡",
  title,
  body,
  action,
  size = "md",
}: EmptyStateProps) {
  const isSm = size === "sm";
  const isLg = size === "lg";

  return (
    <div
      className={`mx-auto w-full text-center rounded-3xl border border-slate-200/80 bg-white shadow-card flex flex-col items-center justify-center ${
        isSm ? "p-6 max-w-md space-y-3" : isLg ? "p-12 md:p-16 max-w-2xl space-y-6" : "p-8 md:p-12 max-w-xl space-y-4"
      }`}
    >
      <div className="flex items-center justify-center">
        {typeof icon === "string" ? (
          <span className={isSm ? "text-3xl" : "text-5xl"}>{icon}</span>
        ) : (
          <div className="text-slate-400">{icon}</div>
        )}
      </div>

      <div className="space-y-1.5 max-w-md">
        <h3 className={`font-display font-bold text-navy ${isSm ? "text-lg" : "text-xl md:text-2xl"}`}>
          {title}
        </h3>
        {body && (
          <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
            {body}
          </p>
        )}
      </div>

      {action && (
        <div className="pt-2">
          {action.href ? (
            <Link
              to={action.href}
              className="inline-flex items-center gap-2 rounded-2xl bg-navy px-5 py-2.5 text-xs md:text-sm font-semibold text-white shadow-md hover:bg-navy-800 transition active:scale-95"
            >
              {action.label}
            </Link>
          ) : action.onClick ? (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center gap-2 rounded-2xl bg-navy px-5 py-2.5 text-xs md:text-sm font-semibold text-white shadow-md hover:bg-navy-800 transition active:scale-95"
            >
              {action.label}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
