import { useState, useEffect } from "react";
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

  // OTP Verification state (User/Buyer only)
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpMsg, setOtpMsg] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Seller Submitted state (No OTP)
  const [sellerSubmitted, setSellerSubmitted] = useState(false);

  // Cooldown countdown effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post<{
        message: string;
        pendingApproval?: boolean;
        emailWarning?: string;
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
        setShowOtp(true);
        setOtpMsg(res.message || "Please enter the 6-digit verification code sent to your email.");
        setResendCooldown(60);
        toast.success(res.message || "Verification code sent to your email!");
        if (res.emailWarning) {
          setOtpMsg(res.emailWarning);
          toast.info(res.emailWarning, { duration: 6000 });
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError(null);

    try {
      const res = await api.post<{ message: string; token?: string; user?: any }>("/auth/verify", {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });

      if (res.token) {
        setStoredToken(res.token);
        await refresh();
      }

      toast.success(res.message || "Account verified successfully! Welcome to PinkCityHomes.");
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError(null);

    try {
      const res = await api.post<{ message: string; emailWarning?: string }>(
        "/auth/resend-otp",
        { email: email.trim().toLowerCase() }
      );
      const nextMsg = res.emailWarning || res.message || "A fresh 6-digit OTP has been dispatched.";
      setOtpMsg(nextMsg);
      setResendCooldown(60);
      toast.success(res.message || "Verification code sent to your email.");
      if (res.emailWarning) {
        toast.info(res.emailWarning, { duration: 6000 });
      }
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
            {showOtp ? (
              <>Verify Your <span className="text-pink-600">Email</span></>
            ) : (
              <>Create an <span className="text-pink-600">Account</span></>
            )}
          </h1>
          <p className="text-xs text-slate-500">
            {showOtp
              ? "Complete verification to activate your buyer account immediately"
              : role === "SELLER"
              ? "Apply to become a verified property seller or agency in Jaipur"
              : "Discover homes, schedule viewings, and save favorites in Jaipur"}
          </p>
        </div>

        {/* Step Indicator (Only for Customer) */}
        {!sellerSubmitted && role === "CUSTOMER" && (
          <div className="flex items-center justify-center gap-2 pt-1 pb-2">
            <span
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
                !showOtp
                  ? "bg-pink-100 text-pink-700 border border-pink-200"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-pink-600 text-white text-[10px] inline-flex items-center justify-center">
                1
              </span>
              Details
            </span>
            <span className="text-slate-300">→</span>
            <span
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
                showOtp
                  ? "bg-pink-100 text-pink-700 border border-pink-200"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full text-[10px] inline-flex items-center justify-center ${
                  showOtp ? "bg-pink-600 text-white" : "bg-slate-300 text-slate-600"
                }`}
              >
                2
              </span>
              Verify OTP
            </span>
          </div>
        )}

        {/* Role Selector Tabs (Step 1 only) */}
        {!showOtp && !sellerSubmitted && (
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
          /* Seller Application Submitted State (NO OTP) */
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
        ) : !showOtp ? (
          /* Step 1: Registration Form */
          <form onSubmit={handleRegister} className="space-y-4">
            {role === "SELLER" && (
              <div className="rounded-2xl bg-amber-50/80 border border-amber-200/80 p-3.5 text-xs text-amber-900">
                <p className="font-bold">ℹ️ No OTP Verification Required</p>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  Seller applications go directly to Superadmin for regulatory vetting.
                </p>
              </div>
            )}

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
                  className="text-[11px] font-semibold text-pink-600 hover:underline"
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
                : "Continue to Email Verification"}
            </button>
          </form>
        ) : (
          /* Step 2: OTP Verification Form (Instant at Registration Time!) */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="rounded-3xl bg-pink-50/60 p-5 border border-pink-100 text-xs text-slate-700 space-y-1.5">
              <p className="font-bold text-navy text-sm flex items-center gap-1.5">
                <span>✉️</span>
                <span>Enter Verification Code</span>
              </p>
              <p className="text-slate-600 leading-relaxed">
                {otpMsg || "A 6-digit code has been issued for"}{" "}
                <span className="font-bold text-navy">{email}</span>.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">
                Enter 6-Digit Code
              </label>
              <input
                type="text"
                autoFocus
                required
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-2xl border-2 border-pink-200 px-4 py-3.5 text-center font-mono text-2xl font-bold tracking-[0.35em] text-navy bg-white focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-100 transition shadow-xs"
              />
            </div>

            <button
              type="submit"
              disabled={verifying || otp.length < 4}
              className="w-full rounded-2xl bg-navy py-3.5 font-semibold text-sm text-white shadow-md hover:bg-navy-800 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {verifying && (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {verifying ? "Verifying..." : "Verify & Complete Registration"}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                disabled={resendCooldown > 0}
                onClick={handleResendOtp}
                className={`font-semibold transition cursor-pointer ${
                  resendCooldown > 0
                    ? "text-slate-400 cursor-not-allowed"
                    : "text-pink-600 hover:underline"
                }`}
              >
                {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : "Resend Code"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOtp(false);
                  setError(null);
                }}
                className="text-slate-500 hover:text-navy transition cursor-pointer underline"
              >
                Edit Information
              </button>
            </div>
          </form>
        )}

        {!sellerSubmitted && !showOtp && (
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
