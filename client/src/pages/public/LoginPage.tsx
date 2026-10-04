import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setStoredToken } from "../../api/client";
import { useAuth } from "../../auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const [loginAs, setLoginAs] = useState<"CUSTOMER" | "SELLER">("CUSTOMER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const res = await api.post<{ token?: string; user?: { role: string } }>("/auth/login", {
        email,
        password,
        loginAs,
      });

      if (res.token) setStoredToken(res.token);
      await refresh();

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP");
    }
  };

  return (
    <div className="mx-auto max-w-md py-12 px-4">
      <div className="rounded-3xl border border-ink/10 bg-white p-8 shadow-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-3xl font-bold">
            Welcome to{" "}
            <span className="text-pink-600">Pink</span>
            <span className="text-ink">CityHomes</span>
          </h1>
          <p className="text-xs text-ink/70">Find and manage properties in Jaipur — the Pink City</p>
        </div>

        {/* Role Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-ink/80">Login as</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setLoginAs("CUSTOMER");
                setError(null);
                setShowOtpBox(false);
              }}
              className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition ${
                loginAs === "CUSTOMER"
                  ? "border-pink-600 bg-pink-50/60 text-pink-700 shadow-sm"
                  : "border-ink/10 bg-white text-ink/60 hover:border-ink/20 hover:text-ink"
              }`}
            >
              <span className="text-base">👤</span>
              <span>User / Buyer</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginAs("SELLER");
                setError(null);
                setShowOtpBox(false);
              }}
              className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition ${
                loginAs === "SELLER"
                  ? "border-pink-600 bg-pink-50/60 text-pink-700 shadow-sm"
                  : "border-ink/10 bg-white text-ink/60 hover:border-ink/20 hover:text-ink"
              }`}
            >
              <span className="text-base">🏢</span>
              <span>Seller / Agency</span>
            </button>
          </div>
        </div>

        {otpSuccess && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 font-medium">
            ✓ {otpSuccess}
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-800 space-y-2">
            <p className="font-medium">{error}</p>
            {error.includes("registered as a Seller") && (
              <button
                type="button"
                onClick={() => {
                  setLoginAs("SELLER");
                  setError(null);
                }}
                className="block text-xs font-bold text-red-900 underline hover:text-red-950"
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
                className="block text-xs font-bold text-red-900 underline hover:text-red-950"
              >
                Switch to User Login &rarr;
              </button>
            )}
          </div>
        )}

        {showOtpBox ? (
          /* Inline OTP Verification */
          <form onSubmit={handleVerifyOtp} className="rounded-2xl bg-sand/30 border border-ink/10 p-4 space-y-3">
            <div className="text-xs text-ink/80">
              <span className="font-semibold text-ink">Email Verification Required:</span> Enter the 6-digit code sent to <span className="font-bold">{email}</span>.
            </div>
            <div>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full rounded-xl border border-ink/20 px-3 py-2 text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-brass"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={otpLoading}
                className="flex-1 rounded-xl bg-ink py-2 text-xs font-semibold text-sand shadow hover:bg-ink/90 transition disabled:opacity-50"
              >
                {otpLoading ? "Verifying..." : "Verify OTP"}
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                className="rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs font-semibold text-ink/80 hover:bg-sand/40 transition"
              >
                Resend
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink/70 mb-1">Email Address</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={loginAs === "SELLER" ? "seller@agency.com" : "you@example.com"}
                className="w-full rounded-xl border border-ink/20 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink/70 mb-1">Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-ink/20 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-ink py-3 font-semibold text-sand shadow hover:bg-ink/90 transition disabled:opacity-50"
            >
              {loading ? "Signing in..." : `Sign In as ${loginAs === "SELLER" ? "Seller" : "User"}`}
            </button>
          </form>
        )}

        {/* Informational Cards & Registration Link */}
        {loginAs === "SELLER" ? (
          <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-3.5 text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <span>ℹ️</span> Partner & Seller Access
            </p>
            <p className="text-amber-800/90 leading-relaxed">
              Seller accounts must be approved by PinkCityHomes administration before logging in. If you are an agency or property owner seeking listing privileges, please contact administration directly.
            </p>
          </div>
        ) : (
          <div className="text-center text-xs text-ink/60 pt-2 border-t border-ink/5">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-pink-600 hover:text-pink-700 underline">
              Create a User account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

