import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setStoredToken } from "../../api/client";
import { useAuth } from "../../auth";
import { toast } from "../../components/Toast";

export default function LoginPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const [loginAs, setLoginAs] = useState<"CUSTOMER" | "SELLER">("CUSTOMER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post<{ token?: string; user?: { role: string; name: string } }>("/auth/login", {
        email,
        password,
        loginAs,
      });

      if (res.token) setStoredToken(res.token);
      await refresh();

      toast.success(`Welcome back, ${res.user?.name || "User"}!`);

      if (res.user?.role === "SUPERADMIN") {
        navigate("/admin/dashboard");
      } else if (res.user?.role === "SELLER") {
        navigate("/seller/dashboard");
      } else {
        navigate("/");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed. Please check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg py-8 md:py-14 px-4 animate-in-page">
      <div className="rounded-[1.5rem] border border-slate-200/70 bg-white p-7 sm:p-10 shadow-card-hover space-y-6 stagger-1 card-hover">
        <div className="text-center space-y-2 stagger-0">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-500 to-amber-500 items-center justify-center text-white font-display font-bold text-xl shadow-md mx-auto">
            P
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-[-0.02em] leading-snug">
            Welcome to <span className="text-pink-600">Pink</span>CityHomes
          </h1>
          <p className="text-[12px] text-slate-500 leading-snug">
            Sign in to access verified residential properties, seller CRM &amp; analytics in Jaipur
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-[12px] font-bold uppercase tracking-wider text-slate-600 leading-snug">
            Login as
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setLoginAs("CUSTOMER");
                setError(null);
              }}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3.5 text-[12px] font-bold transition-all active:scale-95 ${
                loginAs === "CUSTOMER"
                  ? "border-pink-600 bg-pink-50/70 text-pink-700 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-ink"
              }`}
            >
              <span className="text-xl">👤</span>
              <span>User / Buyer</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginAs("SELLER");
                setError(null);
              }}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3.5 text-[12px] font-bold transition-all active:scale-95 ${
                loginAs === "SELLER"
                  ? "border-pink-600 bg-pink-50/70 text-pink-700 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-ink"
              }`}
            >
              <span className="text-xl">🏢</span>
              <span>Seller / Agency</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-[12px] text-rose-800 space-y-2 leading-snug">
            <p className="font-semibold">{error}</p>
            {error.includes("registered as a Seller") && (
              <button
                type="button"
                onClick={() => {
                  setLoginAs("SELLER");
                  setError(null);
                }}
                className="block text-[12px] font-bold text-rose-900 underline hover:text-rose-950 cursor-pointer"
              >
                Switch to Seller Login →
              </button>
            )}
            {error.includes("registered as a User") && (
              <button
                type="button"
                onClick={() => {
                  setLoginAs("CUSTOMER");
                  setError(null);
                }}
                className="block text-[12px] font-bold text-rose-900 underline hover:text-rose-950 cursor-pointer"
              >
                Switch to User Login →
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5 leading-snug">
              Email Address
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={loginAs === "SELLER" ? "seller@agency.com" : "you@example.com"}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-pink-500 transition shadow-xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[12px] font-semibold text-slate-700 leading-snug">Password</label>
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="label-ui hover:underline cursor-pointer"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-pink-500 transition shadow-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3.5 text-[14px] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading && (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? "Signing in..." : `Sign In as ${loginAs === "SELLER" ? "Seller" : "User"}`}
          </button>
        </form>

        {loginAs === "SELLER" ? (
          <div className="rounded-[1.25rem] bg-amber-50/80 border border-amber-200/80 p-4 text-[12px] text-amber-950 space-y-1 leading-snug">
            <p className="font-bold flex items-center gap-1.5">
              <span>🛡️</span> Partner &amp; Agency Access
            </p>
            <p className="text-amber-800 leading-snug label-ui">
              Seller accounts must be approved by PinkCityHomes administration before logging in. If you have already applied, our team reviews each application within 24 hours.
            </p>
            <div className="pt-1">
              <Link to="/register" className="font-bold text-amber-900 underline hover:text-amber-950">
                Apply as a new seller →
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center text-[12px] text-slate-500 leading-snug pt-3 border-t border-slate-100">
            Don't have a user account?{" "}
            <Link to="/register" className="font-bold text-pink-600 hover:text-pink-700 underline">
              Create an account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
