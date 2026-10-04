import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [role, setRole] = useState<"CUSTOMER" | "SELLER">("CUSTOMER");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP Verification state (User/Buyer only)
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpMsg, setOtpMsg] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<boolean>(false);

  // Seller Submitted state (No OTP)
  const [sellerSubmitted, setSellerSubmitted] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post<{
        message: string;
        pendingApproval?: boolean;
        devOtpHint?: boolean;
      }>("/auth/register", {
        name,
        email,
        password,
        phone,
        role,
        companyName: role === "SELLER" ? companyName : undefined,
      });

      if (role === "SELLER" || res.pendingApproval) {
        // Seller registration: No OTP. Immediately shows approval pending state.
        setSellerSubmitted(true);
      } else {
        // Buyer registration: OTP verification flow
        setShowOtp(true);
        setDevOtpHint(Boolean(res.devOtpHint));
        setOtpMsg(res.message || "OTP code sent to your email.");
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
      await api.post<{ message: string }>("/auth/verify", {
        email,
        otp,
      });

      alert("Email verified successfully! You can now log in to your account.");
      navigate("/login");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await api.post("/auth/resend-otp", { email });
      setOtpMsg("A fresh 6-digit OTP has been sent to your email.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP");
    }
  };

  return (
    <div className="mx-auto max-w-md py-12 px-4">
      <div className="rounded-3xl border border-ink/10 bg-white p-8 shadow-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-3xl font-bold">
            Create an <span className="text-pink-600">Account</span>
          </h1>
          <p className="text-xs text-ink/70">
            {role === "SELLER"
              ? "Apply to become a verified property seller or agency in Jaipur"
              : "Discover homes, schedule viewings, and save favorites in Jaipur"}
          </p>
        </div>

        {/* Role Selector Tabs */}
        {!showOtp && !sellerSubmitted && (
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-ink/80">Register as</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setRole("CUSTOMER");
                  setError(null);
                }}
                className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition ${
                  role === "CUSTOMER"
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
                  setRole("SELLER");
                  setError(null);
                }}
                className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition ${
                  role === "SELLER"
                    ? "border-pink-600 bg-pink-50/60 text-pink-700 shadow-sm"
                    : "border-ink/10 bg-white text-ink/60 hover:border-ink/20 hover:text-ink"
                }`}
              >
                <span className="text-base">🏢</span>
                <span>Seller / Agency</span>
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-800">
            {error}
          </div>
        )}

        {sellerSubmitted ? (
          /* Seller Application Submitted State (NO OTP) */
          <div className="space-y-6 text-center py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
              🏢
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-bold text-ink">
                Application Submitted!
              </h2>
              <p className="text-xs text-ink/70 leading-relaxed max-w-sm mx-auto">
                Thank you for applying. Your seller account for <span className="font-semibold text-ink">{companyName || name}</span> has been sent to the <span className="font-semibold text-ink">Superadmin</span> for approval.
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 text-left space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <span>🛡️</span> Superadmin Review Required
              </p>
              <p className="text-amber-800/90 leading-relaxed">
                Seller accounts do not use OTP codes. The Superadmin reviews each agency or owner before listing privileges are granted. Once approved, you can log in with your email and password.
              </p>
            </div>

            <Link
              to="/login"
              className="block w-full rounded-xl bg-ink py-3 text-center text-xs font-semibold text-sand shadow hover:bg-ink/90 transition"
            >
              Go to Seller Login &rarr;
            </Link>
          </div>
        ) : !showOtp ? (
          <form onSubmit={handleRegister} className="space-y-4">
            {role === "SELLER" && (
              <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-3 text-xs text-amber-900">
                <p className="font-semibold">ℹ️ No OTP Required</p>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  Seller applications go directly to the Superadmin for review and approval.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink/70 mb-1">
                {role === "SELLER" ? "Contact Person Full Name" : "Full Name"}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full rounded-xl border border-ink/20 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
              />
            </div>

            {role === "SELLER" && (
              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">
                  Company / Agency Name
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Pink City Properties & Infra"
                  className="w-full rounded-xl border border-ink/20 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink/70 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-ink/20 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink/70 mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="+91 98000 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-ink/20 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink/70 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-ink/20 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-ink py-3 font-semibold text-sand shadow hover:bg-ink/90 transition disabled:opacity-50"
            >
              {loading
                ? "Submitting..."
                : role === "SELLER"
                ? "Submit Seller Application"
                : "Register as User / Buyer"}
            </button>
          </form>
        ) : (
          /* OTP Form (User/Buyer Only) */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="rounded-2xl bg-sand/40 p-4 border border-ink/10 text-xs text-ink/80 space-y-1">
              <p className="font-semibold text-ink">{otpMsg}</p>
              <p>Sent to <span className="font-bold">{email}</span>.</p>
              {devOtpHint && (
                <p className="text-moss font-semibold pt-1">
                  (Development mode: check the server terminal console for your generated 6-digit OTP code)
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink/70 mb-1">6-Digit Verification Code</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full rounded-xl border border-ink/20 px-3 py-2.5 text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-brass"
              />
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full rounded-xl bg-ink py-3 font-semibold text-sand shadow hover:bg-ink/90 transition disabled:opacity-50"
            >
              {verifying ? "Verifying..." : "Verify & Complete Registration"}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={handleResendOtp}
                className="text-pink-600 font-semibold hover:underline"
              >
                Resend OTP
              </button>
              <button
                type="button"
                onClick={() => setShowOtp(false)}
                className="text-ink/60 hover:text-ink"
              >
                Edit Information
              </button>
            </div>
          </form>
        )}

        {!sellerSubmitted && (
          <div className="text-center text-xs text-ink/60 pt-2 border-t border-ink/5">
            Already registered?{" "}
            <Link to="/login" className="font-semibold text-pink-600 underline">
              Log in here
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}


