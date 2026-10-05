interface BadgeProps {
  status: string;
  size?: "sm" | "md";
  className?: string;
  showDot?: boolean;
}

export function Badge({
  status,
  size = "sm",
  className = "",
  showDot = true,
}: BadgeProps) {
  const norm = (status || "").toUpperCase();

  let colorClasses = "bg-slate-100 text-slate-700 border-slate-200";
  let dotColor = "bg-slate-400";

  switch (norm) {
    case "ACTIVE":
    case "APPROVED":
    case "VERIFIED":
    case "SUCCESS":
      colorClasses = "bg-emerald-50 text-emerald-800 border-emerald-200/80";
      dotColor = "bg-emerald-500";
      break;
    case "SOLD":
    case "CLOSED":
    case "COMPLETED":
      colorClasses = "bg-navy-50 text-navy-800 border-navy-200/80";
      dotColor = "bg-navy-600";
      break;
    case "PENDING":
    case "DRAFT":
    case "PROCESSING":
    case "MEDIUM":
      colorClasses = "bg-amber-50 text-amber-900 border-amber-200/80";
      dotColor = "bg-amber-500";
      break;
    case "REJECTED":
    case "DISABLED":
    case "INACTIVE":
    case "FAILED":
    case "HIGH":
      colorClasses = "bg-rose-50 text-rose-800 border-rose-200/80";
      dotColor = "bg-rose-500";
      break;
    case "LOW":
      colorClasses = "bg-slate-100 text-slate-600 border-slate-200";
      dotColor = "bg-slate-400";
      break;
  }

  const isSm = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-[0.06em] uppercase transition-all duration-200 badge-pop ${colorClasses} ${
        isSm ? "px-2 py-0.5 text-[10.5px]" : "px-3 py-1 text-[11px]"
      } ${className}`}
    >
      {showDot && (
        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      )}
      <span>{status.replace(/_/g, " ")}</span>
    </span>
  );
}
