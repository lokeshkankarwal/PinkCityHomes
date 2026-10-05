const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export function inr(n: number | undefined | null) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const DEFAULT_FALLBACK_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0f2744"/><stop offset="100%" stop-color="#be185d"/></linearGradient></defs><rect width="800" height="500" fill="#f1f5f9"/><rect x="120" y="80" width="560" height="360" rx="16" fill="url(#g)"/><rect x="160" y="130" width="80" height="60" rx="4" fill="#ffffff" opacity="0.85"/><rect x="270" y="130" width="80" height="60" rx="4" fill="#ffffff" opacity="0.85"/><rect x="380" y="130" width="80" height="60" rx="4" fill="#ffffff" opacity="0.85"/><rect x="490" y="130" width="80" height="60" rx="4" fill="#ffffff" opacity="0.85"/><rect x="160" y="220" width="80" height="60" rx="4" fill="#ffffff" opacity="0.7"/><rect x="270" y="220" width="80" height="60" rx="4" fill="#ffffff" opacity="0.7"/><rect x="380" y="220" width="80" height="60" rx="4" fill="#ffffff" opacity="0.7"/><rect x="490" y="220" width="80" height="60" rx="4" fill="#ffffff" opacity="0.7"/><rect x="355" y="320" width="90" height="120" rx="6" fill="#091424"/><text x="400" y="48" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="20" fill="#be185d">PinkCityHomes</text></svg>'
  );

export function imgSrc(path?: string | null) {
  if (!path) return DEFAULT_FALLBACK_SVG;
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${cleanPath}` : cleanPath;
}
