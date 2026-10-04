import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth";
import { api } from "../api/client";

const desktopLink = ({ isActive }: { isActive: boolean }) =>
  `relative px-3 py-1.5 rounded-xl text-sm font-medium transition ${
    isActive
      ? "text-pink-600 font-bold bg-pink-50/80 shadow-xs"
      : "text-ink/75 hover:text-ink hover:bg-ink/5"
  }`;

const adminLink = ({ isActive }: { isActive: boolean }) =>
  `text-xs font-semibold px-3 py-1.5 rounded-xl transition ${
    isActive ? "bg-ink text-sand shadow-sm" : "text-ink/80 hover:bg-ink/5 hover:text-ink"
  }`;

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState<number>(0);
  const [favCount, setFavCount] = useState<number>(0);

  const isSuperAdmin = user?.role === "SUPERADMIN";
  const isSeller = user?.role === "SELLER";
  const isCustomer = user?.role === "CUSTOMER";

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Load cart & fav counts for logged in customers
  useEffect(() => {
    const refreshCounts = () => {
      if (isCustomer) {
        api
          .get<{ items?: unknown[] }>("/cart")
          .then((d) => setCartCount(d.items?.length || 0))
          .catch(() => setCartCount(0));

        api
          .get<{ count?: number; results?: unknown[] }>("/favourites")
          .then((d) => setFavCount(d.count ?? d.results?.length ?? 0))
          .catch(() => setFavCount(0));
      } else {
        setCartCount(0);
        setFavCount(0);
      }
    };

    refreshCounts();
    window.addEventListener("cart-updated", refreshCounts);
    window.addEventListener("favourites-updated", refreshCounts);
    return () => {
      window.removeEventListener("cart-updated", refreshCounts);
      window.removeEventListener("favourites-updated", refreshCounts);
    };
  }, [isCustomer, location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-sand/20 text-ink antialiased">
      {/* ── Top Sticky Header (Desktop + Mobile) ── */}
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-white/90 backdrop-blur-md transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo & Platform Tag */}
          <div className="flex items-center gap-3">
            <Link
              to={isSuperAdmin ? "/admin/dashboard" : isSeller ? "/seller/dashboard" : "/"}
              className="flex items-center gap-2 group"
            >
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-pink-600 via-rose-500 to-amber-500 flex items-center justify-center text-white font-serif font-black text-lg shadow-sm group-hover:scale-105 transition">
                P
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-ink">
                <span className="text-pink-600">Pink</span>CityHomes
              </span>
            </Link>

            {isSuperAdmin && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                👑 Superadmin
              </span>
            )}
            {isSeller && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-pink-100 text-pink-800 border border-pink-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                🏢 Seller Partner
              </span>
            )}
          </div>

          {/* ── Desktop Navigation Bar (md and above) ── */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {isSuperAdmin ? (
              // Superadmin Navigation
              <>
                <NavLink to="/admin/dashboard" className={adminLink}>
                  Dashboard
                </NavLink>
                <NavLink to="/admin/sellers" className={adminLink}>
                  Sellers
                </NavLink>
                <NavLink to="/admin/users" className={adminLink}>
                  Users
                </NavLink>
                <NavLink to="/admin/properties" className={adminLink}>
                  Properties
                </NavLink>
                <NavLink to="/admin/disabled" className={adminLink}>
                  Disabled
                </NavLink>
                <NavLink to="/admin/audit" className={adminLink}>
                  Audit Log
                </NavLink>

                <div className="h-4 w-[1px] bg-ink/20 mx-1.5" />

                <button
                  onClick={async () => {
                    await logout();
                    navigate("/login");
                  }}
                  className="rounded-xl border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sand transition active:scale-95"
                >
                  Logout
                </button>
              </>
            ) : (
              // Customer / Seller / Guest Navigation (NO Projects!)
              <>
                <NavLink to="/properties" className={desktopLink}>
                  Buy
                </NavLink>
                <NavLink to="/rentals" className={desktopLink}>
                  Rent
                </NavLink>
                <NavLink to="/insights" className={desktopLink}>
                  Market
                </NavLink>

                {/* Customer specific links */}
                {isCustomer && (
                  <>
                    <NavLink to="/customer/favourites" className={desktopLink}>
                      <span className="flex items-center gap-1">
                        <span>❤️</span>
                        <span>Saved</span>
                        {favCount > 0 && (
                          <span className="ml-0.5 rounded-full bg-pink-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                            {favCount}
                          </span>
                        )}
                      </span>
                    </NavLink>
                    <NavLink to="/customer/cart" className={desktopLink}>
                      <span className="flex items-center gap-1">
                        <span>🛒</span>
                        <span>Cart</span>
                        {cartCount > 0 && (
                          <span className="ml-0.5 rounded-full bg-ink px-1.5 py-0.2 text-[10px] font-bold text-sand">
                            {cartCount}
                          </span>
                        )}
                      </span>
                    </NavLink>
                    <NavLink to="/customer/orders" className={desktopLink}>
                      Orders
                    </NavLink>
                  </>
                )}

                {/* Seller specific links */}
                {isSeller && (
                  <>
                    <NavLink to="/seller/dashboard" className={desktopLink}>
                      📊 Dashboard
                    </NavLink>
                    <NavLink to="/seller/properties" className={desktopLink}>
                      🏡 Properties
                    </NavLink>
                    <NavLink to="/seller/clients" className={desktopLink}>
                      👥 CRM Leads
                    </NavLink>
                  </>
                )}

                <div className="h-4 w-[1px] bg-ink/15 mx-1" />

                {user ? (
                  <div className="flex items-center gap-2 pl-1">
                    <Link
                      to="/customer/profile"
                      className="flex items-center gap-2 rounded-xl border border-ink/10 bg-sand/40 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sand transition"
                    >
                      <div className="h-6 w-6 rounded-full bg-pink-600 text-white flex items-center justify-center text-[11px] font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="max-w-[120px] truncate">{user.name}</span>
                    </Link>
                    <button
                      onClick={async () => {
                        await logout();
                        navigate("/login");
                      }}
                      className="rounded-xl border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink/70 hover:text-ink hover:bg-sand transition active:scale-95"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pl-1">
                    <NavLink
                      to="/login"
                      className="rounded-xl px-3.5 py-1.5 text-xs font-semibold text-ink/80 hover:text-ink hover:bg-ink/5 transition"
                    >
                      Login
                    </NavLink>
                    <NavLink
                      to="/register"
                      className="rounded-xl bg-pink-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-pink-700 transition active:scale-95"
                    >
                      Register
                    </NavLink>
                  </div>
                )}
              </>
            )}
          </nav>

          {/* ── Mobile Right Actions (Cart shortcut + Hamburger button) ── */}
          <div className="flex items-center gap-2 md:hidden">
            {isCustomer && (
              <Link
                to="/customer/cart"
                className="relative rounded-xl border border-ink/10 bg-white p-2 text-ink shadow-xs"
                title="Cart"
              >
                🛒
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-pink-600 text-[9px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl border border-ink/15 bg-white p-2 text-ink shadow-xs hover:bg-sand focus:outline-none transition active:scale-95"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Slide-Over Drawer ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop blur overlay */}
          <div
            className="fixed inset-0 bg-ink/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white p-6 shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-ink/10">
              <span className="font-serif text-xl font-bold text-ink">
                <span className="text-pink-600">Pink</span>CityHomes
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl p-1.5 text-ink/60 hover:bg-ink/5"
              >
                ✕
              </button>
            </div>

            {/* User Profile Banner (if logged in) */}
            {user && (
              <div className="mt-4 rounded-2xl bg-sand/40 p-4 border border-ink/10 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-pink-600 text-white flex items-center justify-center font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-serif font-bold text-sm text-ink truncate">{user.name}</p>
                    <span className="rounded-full bg-pink-100 text-pink-700 px-2 py-0.2 text-[10px] font-bold uppercase tracking-wider">
                      {user.role}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-ink/60 truncate pt-1">{user.email}</p>
              </div>
            )}

            {/* Navigation Links list */}
            <div className="mt-6 flex-1 space-y-1.5">
              {isSuperAdmin ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40 px-3 mb-1">Superadmin Console</p>
                  <NavLink to="/admin/dashboard" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${isActive ? "bg-ink text-sand" : "text-ink hover:bg-sand"}`}>
                    📊 Dashboard
                  </NavLink>
                  <NavLink to="/admin/sellers" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${isActive ? "bg-ink text-sand" : "text-ink hover:bg-sand"}`}>
                    🏢 Seller Accounts
                  </NavLink>
                  <NavLink to="/admin/users" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${isActive ? "bg-ink text-sand" : "text-ink hover:bg-sand"}`}>
                    👥 User Directory
                  </NavLink>
                  <NavLink to="/admin/properties" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${isActive ? "bg-ink text-sand" : "text-ink hover:bg-sand"}`}>
                    🏡 All Properties
                  </NavLink>
                  <NavLink to="/admin/disabled" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${isActive ? "bg-ink text-sand" : "text-ink hover:bg-sand"}`}>
                    ⛔ Disabled Inventory
                  </NavLink>
                  <NavLink to="/admin/audit" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${isActive ? "bg-ink text-sand" : "text-ink hover:bg-sand"}`}>
                    📜 Audit Logs
                  </NavLink>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40 px-3 mb-1">Explore Jaipur</p>
                  <NavLink to="/properties" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${isActive ? "bg-pink-50 text-pink-600 font-bold" : "text-ink hover:bg-sand"}`}>
                    🔍 Buy Properties
                  </NavLink>
                  <NavLink to="/rentals" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${isActive ? "bg-pink-50 text-pink-600 font-bold" : "text-ink hover:bg-sand"}`}>
                    🔑 Rent Homes
                  </NavLink>
                  <NavLink to="/insights" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${isActive ? "bg-pink-50 text-pink-600 font-bold" : "text-ink hover:bg-sand"}`}>
                    📈 Market Intelligence
                  </NavLink>

                  {isCustomer && (
                    <>
                      <div className="pt-3 pb-1 border-t border-ink/10">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40 px-3">Buyer Account</p>
                      </div>
                      <NavLink to="/customer/favourites" className={({ isActive }) => `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold ${isActive ? "bg-pink-50 text-pink-600 font-bold" : "text-ink hover:bg-sand"}`}>
                        <span className="flex items-center gap-3">❤️ Saved Properties</span>
                        {favCount > 0 && <span className="rounded-full bg-pink-600 text-white text-[10px] font-bold px-2 py-0.2">{favCount}</span>}
                      </NavLink>
                      <NavLink to="/customer/cart" className={({ isActive }) => `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold ${isActive ? "bg-pink-50 text-pink-600 font-bold" : "text-ink hover:bg-sand"}`}>
                        <span className="flex items-center gap-3">🛒 Property Cart</span>
                        {cartCount > 0 && <span className="rounded-full bg-ink text-sand text-[10px] font-bold px-2 py-0.2">{cartCount}</span>}
                      </NavLink>
                      <NavLink to="/customer/orders" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${isActive ? "bg-pink-50 text-pink-600 font-bold" : "text-ink hover:bg-sand"}`}>
                        📜 Purchase Orders
                      </NavLink>
                      <NavLink to="/customer/profile" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${isActive ? "bg-pink-50 text-pink-600 font-bold" : "text-ink hover:bg-sand"}`}>
                        👤 Account Profile
                      </NavLink>
                    </>
                  )}

                  {isSeller && (
                    <>
                      <div className="pt-3 pb-1 border-t border-ink/10">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-pink-600 px-3">Seller Portal</p>
                      </div>
                      <NavLink to="/seller/dashboard" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${isActive ? "bg-pink-50 text-pink-600 font-bold" : "text-ink hover:bg-sand"}`}>
                        📊 CRM Dashboard
                      </NavLink>
                      <NavLink to="/seller/properties" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${isActive ? "bg-pink-50 text-pink-600 font-bold" : "text-ink hover:bg-sand"}`}>
                        🏡 Manage Listings
                      </NavLink>
                      <NavLink to="/seller/clients" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${isActive ? "bg-pink-50 text-pink-600 font-bold" : "text-ink hover:bg-sand"}`}>
                        👥 Clients &amp; Leads
                      </NavLink>
                      <NavLink to="/customer/profile" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${isActive ? "bg-pink-50 text-pink-600 font-bold" : "text-ink hover:bg-sand"}`}>
                        🏢 Seller Profile
                      </NavLink>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Drawer Bottom Actions */}
            <div className="pt-4 border-t border-ink/10 space-y-2">
              {user ? (
                <button
                  onClick={async () => {
                    await logout();
                    setMobileMenuOpen(false);
                    navigate("/login");
                  }}
                  className="w-full rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 transition active:scale-95"
                >
                  Logout from PinkCityHomes
                </button>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center rounded-xl border border-ink/20 py-2.5 text-xs font-bold text-ink hover:bg-sand"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center rounded-xl bg-pink-600 py-2.5 text-xs font-bold text-white hover:bg-pink-700 shadow-sm"
                  >
                    Register Account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Main Page Content ── */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 pb-24 md:pb-12">
        <Outlet />
      </main>

      {/* ── Fixed Mobile Bottom Navigation Bar (Phone Only) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-ink/10 bg-white/95 backdrop-blur-md px-2 py-1.5 md:hidden shadow-lg">
        <div className="mx-auto flex max-w-md items-center justify-around text-center">
          {isSuperAdmin ? (
            <>
              <NavLink
                to="/admin/dashboard"
                className={({ isActive }) =>
                  `flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition ${
                    isActive ? "text-pink-600 font-bold" : "text-ink/60 hover:text-ink"
                  }`
                }
              >
                <span className="text-base">📊</span>
                <span>Dashboard</span>
              </NavLink>
              <NavLink
                to="/admin/sellers"
                className={({ isActive }) =>
                  `flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition ${
                    isActive ? "text-pink-600 font-bold" : "text-ink/60 hover:text-ink"
                  }`
                }
              >
                <span className="text-base">🏢</span>
                <span>Sellers</span>
              </NavLink>
              <NavLink
                to="/admin/properties"
                className={({ isActive }) =>
                  `flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition ${
                    isActive ? "text-pink-600 font-bold" : "text-ink/60 hover:text-ink"
                  }`
                }
              >
                <span className="text-base">🏡</span>
                <span>Properties</span>
              </NavLink>
              <NavLink
                to="/admin/users"
                className={({ isActive }) =>
                  `flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition ${
                    isActive ? "text-pink-600 font-bold" : "text-ink/60 hover:text-ink"
                  }`
                }
              >
                <span className="text-base">👥</span>
                <span>Users</span>
              </NavLink>
              <NavLink
                to="/admin/disabled"
                className={({ isActive }) =>
                  `flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition ${
                    isActive ? "text-pink-600 font-bold" : "text-ink/60 hover:text-ink"
                  }`
                }
              >
                <span className="text-base">⛔</span>
                <span>Disabled</span>
              </NavLink>
            </>
          ) : isSeller ? (
            <>
              <NavLink
                to="/seller/dashboard"
                className={({ isActive }) =>
                  `flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition ${
                    isActive ? "text-pink-600 font-bold" : "text-ink/60 hover:text-ink"
                  }`
                }
              >
                <span className="text-base">📊</span>
                <span>Dashboard</span>
              </NavLink>
              <NavLink
                to="/seller/properties"
                className={({ isActive }) =>
                  `flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition ${
                    isActive ? "text-pink-600 font-bold" : "text-ink/60 hover:text-ink"
                  }`
                }
              >
                <span className="text-base">🏡</span>
                <span>Properties</span>
              </NavLink>
              <NavLink
                to="/seller/clients"
                className={({ isActive }) =>
                  `flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition ${
                    isActive ? "text-pink-600 font-bold" : "text-ink/60 hover:text-ink"
                  }`
                }
              >
                <span className="text-base">👥</span>
                <span>Leads</span>
              </NavLink>
              <NavLink
                to="/properties"
                className={({ isActive }) =>
                  `flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition ${
                    isActive ? "text-pink-600 font-bold" : "text-ink/60 hover:text-ink"
                  }`
                }
              >
                <span className="text-base">🔍</span>
                <span>Market</span>
              </NavLink>
              <NavLink
                to="/customer/profile"
                className={({ isActive }) =>
                  `flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition ${
                    isActive ? "text-pink-600 font-bold" : "text-ink/60 hover:text-ink"
                  }`
                }
              >
                <span className="text-base">👤</span>
                <span>Profile</span>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition ${
                    isActive ? "text-pink-600 font-bold" : "text-ink/60 hover:text-ink"
                  }`
                }
              >
                <span className="text-base">🏠</span>
                <span>Home</span>
              </NavLink>
              <NavLink
                to="/properties"
                className={({ isActive }) =>
                  `flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition ${
                    isActive ? "text-pink-600 font-bold" : "text-ink/60 hover:text-ink"
                  }`
                }
              >
                <span className="text-base">🔍</span>
                <span>Buy</span>
              </NavLink>
              <NavLink
                to="/rentals"
                className={({ isActive }) =>
                  `flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition ${
                    isActive ? "text-pink-600 font-bold" : "text-ink/60 hover:text-ink"
                  }`
                }
              >
                <span className="text-base">🔑</span>
                <span>Rent</span>
              </NavLink>
              <NavLink
                to={user ? "/customer/favourites" : "/login"}
                className={({ isActive }) =>
                  `flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition ${
                    isActive ? "text-pink-600 font-bold" : "text-ink/60 hover:text-ink"
                  }`
                }
              >
                <span className="text-base relative">
                  ❤️
                  {favCount > 0 && (
                    <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-pink-600 text-[8px] font-bold text-white">
                      {favCount}
                    </span>
                  )}
                </span>
                <span>Saved</span>
              </NavLink>
              <NavLink
                to={user ? "/customer/profile" : "/login"}
                className={({ isActive }) =>
                  `flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition ${
                    isActive ? "text-pink-600 font-bold" : "text-ink/60 hover:text-ink"
                  }`
                }
              >
                <span className="text-base">👤</span>
                <span>{user ? "Profile" : "Login"}</span>
              </NavLink>
            </>
          )}
        </div>
      </nav>

      {/* ── Footer (NO Projects Link!) ── */}
      <footer className="border-t border-ink/10 bg-white/70 py-8 mt-auto hidden md:block">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-0.5 text-center sm:text-left">
              <span className="font-serif text-lg font-bold text-ink">
                <span className="text-pink-600">Pink</span>CityHomes
              </span>
              <p className="text-xs text-ink/60">Curated residential properties and verified sellers across Jaipur, Rajasthan</p>
            </div>

            {!isSuperAdmin && (
              <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-ink/70 font-medium">
                <Link to="/properties" className="hover:text-pink-600 transition">Buy Homes</Link>
                <Link to="/rentals" className="hover:text-pink-600 transition">Rentals</Link>
                <Link to="/insights" className="hover:text-pink-600 transition">Market Insights</Link>
                {!user && <Link to="/register" className="hover:text-pink-600 transition">Join Platform</Link>}
              </div>
            )}

            <p className="text-xs text-ink/40">© {new Date().getFullYear()} PinkCityHomes. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
