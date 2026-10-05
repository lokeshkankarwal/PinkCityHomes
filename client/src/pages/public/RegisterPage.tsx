import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setStoredToken } from "../../api/client";
import { useAuth } from "../../auth";
import { toast } from "../../components/Toast";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const [role, setRole] = useState<"CUSTOMER" | "SELLER">("CUSTOMER");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sellerSubmitted, setSellerSubmitted] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post<{
        message: string;
        pendingApproval?: boolean;
        token?: string;
        user?: any;
      }>("/auth/register", {
        name,
        email: email.trim().toLowerCase(),
        password,
        phone,
        role,
        companyName: role === "SELLER" ? companyName : undefined,
      });

      if (role === "SELLER" || res.pendingApproval) {
        setSellerSubmitted(true);
        toast.success("Seller application submitted for Superadmin review!");
      } else {
        if (res.token) {
          setStoredToken(res.token);
          await refresh();
        }
        toast.success(res.message || "Account created successfully! Welcome to PinkCityHomes.");
        navigate("/");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg py-8 md:py-14 px-4 animate-fade-in">
      <div className="rounded-4xl border border-slate-200/80 bg-white p-7 sm:p-10 shadow-card-hover space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-500 to-amber-500 items-center justify-center text-white font-display font-bold text-xl shadow-md mx-auto">
            P
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy">
            Create an <span className="text-pink-600">Account</span>
          </h1>
          <p className="text-xs text-slate-500">
            {role === "SELLER"
              ? "Apply to become a verified property seller or agency in Jaipur"
              : "Discover homes, schedule viewings, and save favorites in Jaipur"}
          </p>
        </div>

        {!sellerSubmitted && (
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Register as
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setRole("CUSTOMER");
                  setError(null);
                }}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3.5 text-xs font-bold transition-all active:scale-95 ${
                  role === "CUSTOMER"
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
                  setRole("SELLER");
                  setError(null);
                }}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3.5 text-xs font-bold transition-all active:scale-95 ${
                  role === "SELLER"
                    ? "border-pink-600 bg-pink-50/70 text-pink-700 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-navy"
                }`}
              >
                <span className="text-xl">🏢</span>
                <span>Seller / Agency</span>
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {sellerSubmitted ? (
          <div className="space-y-6 text-center py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-3xl shadow-sm border border-emerald-100">
              🏢
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-bold text-navy">
                Application Submitted!
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                Thank you for applying. Your seller account for{" "}
                <span className="font-bold text-navy">{companyName || name}</span> has been sent to the{" "}
                <span className="font-bold text-navy">Superadmin</span> for review and verification.
              </p>
            </div>

            <div className="rounded-3xl bg-amber-50/80 border border-amber-200/80 p-5 text-xs text-amber-950 text-left space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <span>🛡️</span> Superadmin Verification Policy
              </p>
              <p className="text-amber-800 leading-relaxed text-[11px]">
                To maintain the highest trust across PinkCityHomes, seller accounts require manual platform review. You will be notified once listing privileges are activated.
              </p>
            </div>

            <Link
              to="/login"
              className="block w-full rounded-2xl bg-navy py-3 text-center text-xs font-semibold text-white shadow-md hover:bg-navy-800 transition active:scale-95"
            >
              Go to Partner Login →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {role === "SELLER" ? "Contact Person Full Name" : "Full Name"}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-pink-500 transition shadow-xs"
              />
            </div>

            {role === "SELLER" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Company / Agency Name
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Pink City Properties & Infra"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-pink-500 transition shadow-xs"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-pink-500 transition shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
              <input
                type="tel"
                placeholder="+91 98000 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-pink-500 transition shadow-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="text-[11px] font-semibold text-pink-600 hover:underline cursor-pointer"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-pink-500 transition shadow-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-navy py-3.5 font-semibold text-sm text-white shadow-md hover:bg-navy-800 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading && (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading
                ? "Submitting..."
                : role === "SELLER"
                ? "Submit Seller Application"
                : "Create Account & Start Browsing"}
            </button>
          </form>
        )}

        {!sellerSubmitted && (
          <div className="text-center text-xs text-slate-500 pt-3 border-t border-slate-100">
            Already registered?{" "}
            <Link to="/login" className="font-bold text-pink-600 underline">
              Log in here
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
