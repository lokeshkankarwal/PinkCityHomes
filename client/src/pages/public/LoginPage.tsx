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

  // OTP Fallback state for unverified users
  const [showOtpBox, setShowOtpBox] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShowOtpBox(false);

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
      if (msg.toLowerCase().includes("verify your email")) {
        setShowOtpBox(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);
    try {
      await api.post("/auth/verify", { email, otp: otpCode });
      setOtpSuccess("Email verified successfully! You can now log in.");
      toast.success("Email verified successfully! Please log in.");
      setShowOtpBox(false);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await api.post("/auth/resend-otp", { email });
      setOtpSuccess("A fresh 6-digit OTP has been sent to your email.");
      toast.info("A fresh OTP has been sent to your email.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP");
    }
  };

  return (
    <div className="mx-auto max-w-lg py-8 md:py-14 px-4 animate-fade-in">
      <div className="rounded-4xl border border-slate-200/80 bg-white p-7 sm:p-10 shadow-card-hover space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-500 to-amber-500 items-center justify-center text-white font-display font-bold text-xl shadow-md mx-auto">
            P
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy">
            Welcome to <span className="text-pink-600">Pink</span>CityHomes
          </h1>
          <p className="text-xs text-slate-500">
            Sign in to access verified residential properties, seller CRM &amp; analytics in Jaipur
          </p>
        </div>

        {/* Role Selector Cards */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Login as
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setLoginAs("CUSTOMER");
                setError(null);
                setShowOtpBox(false);
              }}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3.5 text-xs font-bold transition-all active:scale-95 ${
                loginAs === "CUSTOMER"
                  ? "border-pink-600 bg-pink-50/70 text-pink-700 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-navy"
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
                setShowOtpBox(false);
              }}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3.5 text-xs font-bold transition-all active:scale-95 ${
                loginAs === "SELLER"
                  ? "border-pink-600 bg-pink-50/70 text-pink-700 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-navy"
              }`}
            >
              <span className="text-xl">🏢</span>
              <span>Seller / Agency</span>
            </button>
          </div>
        </div>

        {otpSuccess && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800 font-medium flex items-center gap-2">
            <span>✓</span> {otpSuccess}
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 space-y-2">
            <p className="font-semibold">{error}</p>
            {error.includes("registered as a Seller") && (
              <button
                type="button"
                onClick={() => {
                  setLoginAs("SELLER");
                  setError(null);
                }}
                className="block text-xs font-bold text-rose-900 underline hover:text-rose-950"
              >
                Switch to Seller Login &rarr;
              </button>
            )}
            {error.includes("registered as a User") && (
              <button
                type="button"
                onClick={() => {
                  setLoginAs("CUSTOMER");
                  setError(null);
                }}
                className="block text-xs font-bold text-rose-900 underline hover:text-rose-950"
              >
                Switch to User Login &rarr;
              </button>
            )}
          </div>
        )}

        {showOtpBox ? (
          /* Inline OTP Verification */
          <form onSubmit={handleVerifyOtp} className="rounded-3xl bg-slate-50 border border-slate-200/80 p-5 space-y-4">
            <div className="text-xs text-slate-600">
              <span className="font-bold text-navy">Email Verification Required:</span> Enter the 6-digit code sent to <span className="font-bold text-navy">{email}</span>.
            </div>
            <div>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-center font-mono text-xl tracking-widest bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-xs"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={otpLoading}
                className="flex-1 rounded-2xl bg-navy py-2.5 text-xs font-semibold text-white shadow-md hover:bg-navy-800 transition disabled:opacity-50 active:scale-95"
              >
                {otpLoading ? "Verifying..." : "Verify OTP"}
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition active:scale-95"
              >
                Resend
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={loginAs === "SELLER" ? "seller@agency.com" : "you@example.com"}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-pink-500 transition shadow-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="text-[11px] font-semibold text-pink-600 hover:underline"
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
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-pink-500 transition shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-navy py-3.5 font-semibold text-sm text-white shadow-md hover:bg-navy-800 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
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
        )}

        {/* Informational Cards & Registration Link */}
        {loginAs === "SELLER" ? (
          <div className="rounded-3xl bg-amber-50/80 border border-amber-200/80 p-4 text-xs text-amber-950 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <span>🛡️</span> Partner &amp; Agency Access
            </p>
            <p className="text-amber-800 leading-relaxed text-[11px]">
              Seller accounts must be approved by PinkCityHomes administration before logging in. If you have already applied, our team reviews each application within 24 hours.
            </p>
            <div className="pt-1">
              <Link to="/register" className="font-bold text-amber-900 underline hover:text-amber-950">
                Apply as a new seller &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center text-xs text-slate-500 pt-3 border-t border-slate-100">
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
