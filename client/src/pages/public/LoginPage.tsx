import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setStoredToken } from "../../api/client";
import { useAuth } from "../../auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post<{ token?: string; user?: { role: string } }>("/auth/login", { email, password });
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
      setError(err instanceof Error ? err.message : "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-12">
      <div className="rounded-3xl border border-ink/10 bg-white p-8 shadow-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-3xl font-bold">
            Welcome to{" "}
            <span className="text-pink-600">Pink</span>
            <span className="text-ink">CityHomes</span>
          </h1>
          <p className="text-xs text-ink/70">Find your home in Jaipur — the Pink City</p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink/70 mb-1">Email Address</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="text-center text-xs text-ink/60 pt-2 border-t border-ink/5">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-moss underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
