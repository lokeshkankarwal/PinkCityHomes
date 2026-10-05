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
      className={`mx-auto w-full text-center rounded-[1.25rem] border border-slate-200/70 bg-white shadow-card card-hover flex flex-col items-center justify-center animate-page-enter ${
        isSm ? "p-6 max-w-md space-y-3" : isLg ? "p-10 md:p-14 max-w-2xl space-y-5" : "p-8 md:p-10 max-w-xl space-y-4"
      }`}
    >
      <div className="flex items-center justify-center">
        {typeof icon === "string" ? (
          <span className={`emoji-float select-none ${isSm ? "text-3xl" : "text-5xl"}`}>{icon}</span>
        ) : (
          <div className="text-slate-400 animate-float">{icon}</div>
        )}
      </div>

      <div className="space-y-2 max-w-md">
        <h3 className={`font-display font-bold text-ink leading-snug tracking-[-0.015em] ${isSm ? "text-[17px]" : "text-xl md:text-2xl"}`}>
          {title}
        </h3>
        {body && (
          <p className="text-[13.5px] md:text-sm text-slate-500 leading-[1.55]">
            {body}
          </p>
        )}
      </div>

      {action && (
        <div className="pt-2">
          {action.href ? (
            <Link
              to={action.href}
              className="btn-primary text-[14px]"
            >
              {action.label}
            </Link>
          ) : action.onClick ? (
            <button
              type="button"
              onClick={action.onClick}
              className="btn-primary text-[14px]"
            >
              {action.label}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
