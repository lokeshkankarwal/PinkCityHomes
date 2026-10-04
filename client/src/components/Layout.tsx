import { useState, useEffect, useRef } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth";
import { api } from "../api/client";
import { ToastContainer } from "./Toast";

const navLink = ({ isActive }: { isActive: boolean }) =>
  `relative px-3.5 py-2 rounded-2xl text-xs font-semibold tracking-wide transition-all duration-200 ${
    isActive
      ? "text-pink-600 bg-pink-50/80 shadow-xs font-bold"
      : "text-slate-600 hover:text-navy hover:bg-slate-100/70"
  }`;

const drawerNavLink = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 min-h-[42px] ${
    isActive
      ? "text-pink-600 bg-pink-50 font-bold border border-pink-100 shadow-xs"
      : "text-slate-700 hover:text-navy hover:bg-slate-100"
  }`;

const bottomNavLink = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center py-1 px-1.5 text-[10px] font-semibold transition ${
    isActive ? "text-pink-600 font-bold" : "text-slate-500 hover:text-slate-900"
  }`;

const adminNavLink = ({ isActive }: { isActive: boolean }) =>
  `relative px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
    isActive
      ? "bg-pink-600 text-white shadow-sm font-bold"
      : "text-slate-300 hover:text-white hover:bg-navy-800"
  }`;

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [cartCount, setCartCount] = useState<number>(0);
  const [favCount, setFavCount] = useState<number>(0);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin = user?.role === "SUPERADMIN";
  const isSeller = user?.role === "SELLER";
  const isCustomer = user?.role === "CUSTOMER";

  // Close menus on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  // Click outside to close profile dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setProfileDropdownOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync cart & fav counts
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

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
      {/* Toast Notification Container */}
      <ToastContainer />

      {/* ── Top Header ────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
          isSuperAdmin
            ? "bg-slate-950/95 border-slate-800 text-white"
            : "bg-white/95 border-slate-200 shadow-sm text-slate-900"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link
              to={isSuperAdmin ? "/admin/dashboard" : isSeller ? "/seller/dashboard" : "/"}
              className="flex items-center gap-2.5 group"
            >
              <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-500 to-amber-500 flex items-center justify-center text-white font-display font-black text-lg shadow-md group-hover:scale-105 transition-transform duration-200">
                P
              </div>
              <span className="font-display text-2xl font-bold tracking-tight">
                <span className="text-pink-600">Pink</span>
                <span className={isSuperAdmin ? "text-white" : "text-navy"}>CityHomes</span>
              </span>
            </Link>

            {isSuperAdmin && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                👑 Superadmin
              </span>
            )}
            {isSeller && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                🏢 Partner
              </span>
            )}
          </div>

          {/* ── Desktop Navigation ── */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {isSuperAdmin ? (
              // Superadmin Navigation (strictly platform control, no consumer links)
              <>
                <NavLink to="/admin/dashboard" className={adminNavLink}>
                  Dashboard
                </NavLink>
                <NavLink to="/admin/sellers" className={adminNavLink}>
                  Sellers
                </NavLink>
                <NavLink to="/admin/users" className={adminNavLink}>
                  Users
                </NavLink>
                <NavLink to="/admin/properties" className={adminNavLink}>
                  Properties
                </NavLink>
                <NavLink to="/admin/disabled" className={adminNavLink}>
                  Disabled
                </NavLink>
                <NavLink to="/admin/audit" className={adminNavLink}>
                  Audit Log
                </NavLink>

                <div className="h-4 w-[1px] bg-navy-800 mx-2" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-2xl border border-navy-700 bg-navy-900 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-navy-800 transition active:scale-95"
                >
                  Logout
                </button>
              </>
            ) : (
              // Consumer / Seller Navigation
              <>
                <NavLink to="/properties" className={navLink}>
                  Buy
                </NavLink>
                <NavLink to="/rentals" className={navLink}>
                  Rent
                </NavLink>
                <NavLink to="/insights" className={navLink}>
                  Market
                </NavLink>

                {/* Customer Links */}
                {isCustomer && (
                  <>
                    <NavLink to="/customer/favourites" className={navLink}>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        <span>Saved</span>
                        {favCount > 0 && (
                          <span className="rounded-full bg-pink-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                            {favCount}
                          </span>
                        )}
                      </span>
                    </NavLink>
                    <NavLink to="/customer/cart" className={navLink}>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span>Cart</span>
                        {cartCount > 0 && (
                          <span className="rounded-full bg-navy px-1.5 py-0.2 text-[10px] font-bold text-white">
                            {cartCount}
                          </span>
                        )}
                      </span>
                    </NavLink>
                    <NavLink to="/customer/orders" className={navLink}>
                      Orders
                    </NavLink>
                  </>
                )}

                {/* Seller Links */}
                {isSeller && (
                  <>
                    <NavLink to="/seller/dashboard" className={navLink}>
                      Dashboard
                    </NavLink>
                    <NavLink to="/seller/properties" className={navLink}>
                      Properties
                    </NavLink>
                    <NavLink to="/seller/clients" className={navLink}>
                      CRM Leads
                    </NavLink>
                  </>
                )}

                <div className="h-4 w-[1px] bg-slate-200 mx-1.5" />

                {/* User Dropdown / Login CTA */}
                {user ? (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setProfileDropdownOpen((prev) => !prev)}
                      className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-100 transition active:scale-95"
                    >
                      <div className="h-6 w-6 rounded-full bg-pink-600 text-white flex items-center justify-center text-[11px] font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="max-w-[100px] truncate">{user.name}</span>
                      <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Popover Menu */}
                    {profileDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 rounded-3xl border border-slate-200/80 bg-white p-2 shadow-xl animate-scale-in z-50">
                        <div className="px-3 py-2 border-b border-slate-100">
                          <p className="text-xs font-bold text-navy truncate">{user.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                        </div>

                        <div className="py-1 text-xs">
                          <Link
                            to="/customer/profile"
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-navy transition font-medium"
                          >
                            <span>👤</span> Profile & Settings
                          </Link>
                          {isCustomer && (
                            <>
                              <Link
                                to="/customer/favourites"
                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-navy transition font-medium"
                              >
                                <span>❤️</span> Saved Homes
                              </Link>
                              <Link
                                to="/customer/orders"
                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-navy transition font-medium"
                              >
                                <span>📦</span> Orders & Purchases
                              </Link>
                            </>
                          )}
                          {isSeller && (
                            <Link
                              to="/seller/properties?new=1"
                              className="flex items-center gap-2 px-3 py-2 rounded-xl text-pink-600 hover:bg-pink-50 transition font-bold"
                            >
                              <span>+</span> Add Property
                            </Link>
                          )}
                        </div>

                        <div className="pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 transition font-semibold"
                          >
                            <span>🚪</span> Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      to="/login"
                      className="rounded-2xl px-4 py-2 text-xs font-semibold text-navy hover:text-pink-600 transition"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      className="rounded-2xl bg-navy px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-navy-800 transition active:scale-95"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </>
            )}
          </nav>

          {/* ── Mobile Actions & Hamburger Button ── */}
          <div className="flex items-center gap-1.5 md:hidden">
            {isCustomer && cartCount > 0 && (
              <Link to="/customer/cart" className="relative p-2 text-slate-800" aria-label="Purchase Cart">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="absolute top-1 right-1 rounded-full bg-pink-600 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center">
                  {cartCount}
                </span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className={`p-2 rounded-2xl transition active:scale-95 ${
                isSuperAdmin
                  ? "text-slate-300 hover:text-white bg-slate-900 border border-slate-800"
                  : "text-slate-800 hover:bg-slate-100 border border-slate-300 bg-white shadow-xs"
              }`}
              aria-label="Open navigation menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Account / Navigation Bottom Sheet (Replaces huge desktop drawer) ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Bottom Sheet panel — naturally sized, no empty space */}
          <div className="relative z-10 w-full max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl animate-slide-in-up border-t border-slate-200 pb-safe">
            {/* Grab handle indicator */}
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300" />

            <div className="space-y-4">
              {/* Compact User Identity Header */}
              {user ? (
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-pink-600 via-rose-500 to-amber-500 text-white font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 truncate">
                      <p className="font-display font-bold text-sm text-navy truncate">{user.name}</p>
                      <span className="inline-block rounded-full bg-navy-100 text-navy-800 text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">
                        {user.role}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-full p-2 text-slate-400 hover:text-navy hover:bg-slate-100 transition flex-shrink-0"
                    aria-label="Close menu"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-pink-600 to-amber-500 flex items-center justify-center text-white font-display font-bold text-xs">
                      P
                    </div>
                    <span className="font-display text-base font-bold text-navy">
                      <span className="text-pink-600">Pink</span>CityHomes
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-full p-1.5 text-slate-400 hover:text-navy hover:bg-slate-100 transition"
                    aria-label="Close menu"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Navigation Links — Only secondary items, strictly no duplicates from bottom nav */}
              <div className="space-y-1 text-xs font-semibold">
                {isSuperAdmin ? (
                  <>
                    <NavLink to="/admin/dashboard" className={drawerNavLink}>
                      📊 Dashboard Overview
                    </NavLink>
                    <NavLink to="/admin/users" className={drawerNavLink}>
                      👥 Users Directory
                    </NavLink>
                    <NavLink to="/admin/sellers" className={drawerNavLink}>
                      🏢 Sellers Management
                    </NavLink>
                    <NavLink to="/admin/properties" className={drawerNavLink}>
                      🏡 Properties Governance
                    </NavLink>
                    <NavLink to="/admin/disabled" className={drawerNavLink}>
                      ⛔ Disabled Records
                    </NavLink>
                    <NavLink to="/admin/audit" className={drawerNavLink}>
                      📜 Audit Logs
                    </NavLink>
                  </>
                ) : isSeller ? (
                  <>
                    <NavLink to="/customer/profile" className={drawerNavLink}>
                      👤 Seller Profile &amp; Settings
                    </NavLink>
                    <a
                      href="mailto:support@pinkcityhomes.in"
                      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-navy hover:bg-slate-100 min-h-[42px] transition"
                    >
                      💬 Help &amp; Partner Support
                    </a>
                  </>
                ) : isCustomer ? (
                  <>
                    <NavLink to="/customer/profile" className={drawerNavLink}>
                      👤 My Profile &amp; Settings
                    </NavLink>
                    <NavLink to="/insights" className={drawerNavLink}>
                      📈 Jaipur Market Intelligence
                    </NavLink>
                    <a
                      href="mailto:support@pinkcityhomes.in"
                      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-navy hover:bg-slate-100 min-h-[42px] transition"
                    >
                      💬 Help &amp; Support
                    </a>
                  </>
                ) : (
                  // Guest
                  <>
                    <NavLink to="/properties" className={drawerNavLink}>
                      🔍 Buy Properties
                    </NavLink>
                    <NavLink to="/rentals" className={drawerNavLink}>
                      🔑 Rental Homes
                    </NavLink>
                    <NavLink to="/insights" className={drawerNavLink}>
                      📈 Market Insights
                    </NavLink>
                    <div className="grid grid-cols-2 gap-2 pt-3">
                      <Link
                        to="/login"
                        className="rounded-xl border border-slate-200 px-3 py-2.5 text-center text-xs font-semibold text-navy hover:bg-slate-50 transition"
                      >
                        Log In
                      </Link>
                      <Link
                        to="/register"
                        className="rounded-xl bg-navy px-3 py-2.5 text-center text-xs font-semibold text-white shadow hover:bg-navy-800 transition"
                      >
                        Sign Up
                      </Link>
                    </div>
                  </>
                )}
              </div>

              {/* Sign Out Button (for authenticated users) */}
              {user && (
                <div className="pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-xl border border-rose-200 bg-rose-50/60 py-2.5 text-center text-xs font-semibold text-rose-700 hover:bg-rose-100 transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>🚪</span> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ──────────────────────────────────────────── */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 pb-20 md:pb-8">
        <Outlet />
      </main>

      {/* ── Mobile Bottom App Bar (Fixed at bottom on phones, 5 items max) ───────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200/80 backdrop-blur-md md:hidden px-1 py-1 shadow-lg pb-safe">
        <div className="flex items-center justify-around text-center">
          {isSuperAdmin ? (
            <>
              <NavLink to="/admin/dashboard" className={bottomNavLink}>
                <span className="text-base">📊</span>
                <span>Home</span>
              </NavLink>
              <NavLink to="/admin/users" className={bottomNavLink}>
                <span className="text-base">👥</span>
                <span>Users</span>
              </NavLink>
              <NavLink to="/admin/sellers" className={bottomNavLink}>
                <span className="text-base">🏢</span>
                <span>Sellers</span>
              </NavLink>
              <NavLink to="/admin/properties" className={bottomNavLink}>
                <span className="text-base">🏡</span>
                <span>Properties</span>
              </NavLink>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex flex-col items-center py-1 px-1.5 text-[10px] font-semibold text-slate-500 hover:text-slate-900 transition"
              >
                <span className="text-base">☰</span>
                <span>More</span>
              </button>
            </>
          ) : isSeller ? (
            <>
              <NavLink to="/seller/dashboard" className={bottomNavLink}>
                <span className="text-base">📊</span>
                <span>Home</span>
              </NavLink>
              <NavLink to="/seller/properties" className={bottomNavLink}>
                <span className="text-base">🏡</span>
                <span>Listings</span>
              </NavLink>
              <NavLink to="/seller/clients" className={bottomNavLink}>
                <span className="text-base">👥</span>
                <span>Leads</span>
              </NavLink>
              <NavLink to="/insights" className={bottomNavLink}>
                <span className="text-base">📈</span>
                <span>Insights</span>
              </NavLink>
              <NavLink to="/customer/profile" className={bottomNavLink}>
                <span className="text-base">👤</span>
                <span>Profile</span>
              </NavLink>
            </>
          ) : isCustomer ? (
            // Customer (Buy, Rent, Saved, Orders, Profile)
            <>
              <NavLink to="/properties" className={bottomNavLink}>
                <span className="text-base">🔍</span>
                <span>Buy</span>
              </NavLink>
              <NavLink to="/rentals" className={bottomNavLink}>
                <span className="text-base">🏠</span>
                <span>Rent</span>
              </NavLink>
              <NavLink to="/customer/favourites" className={bottomNavLink}>
                <span className="relative inline-block text-base">
                  ♡
                  {favCount > 0 && (
                    <span className="absolute -top-1 -right-2 rounded-full bg-pink-600 text-white text-[8px] font-bold h-3.5 w-3.5 flex items-center justify-center">
                      {favCount}
                    </span>
                  )}
                </span>
                <span>Saved</span>
              </NavLink>
              <NavLink to="/customer/orders" className={bottomNavLink}>
                <span className="text-base">📦</span>
                <span>Orders</span>
              </NavLink>
              <NavLink to="/customer/profile" className={bottomNavLink}>
                <span className="text-base">👤</span>
                <span>Profile</span>
              </NavLink>
            </>
          ) : (
            // Guest (Home, Buy, Rent, Saved, Sign In)
            <>
              <NavLink to="/" end className={bottomNavLink}>
                <span className="text-base">🏠</span>
                <span>Home</span>
              </NavLink>
              <NavLink to="/properties" className={bottomNavLink}>
                <span className="text-base">🔍</span>
                <span>Buy</span>
              </NavLink>
              <NavLink to="/rentals" className={bottomNavLink}>
                <span className="text-base">🔑</span>
                <span>Rent</span>
              </NavLink>
              <NavLink to="/customer/favourites" className={bottomNavLink}>
                <span className="text-base">♡</span>
                <span>Saved</span>
              </NavLink>
              <NavLink to="/login" className={bottomNavLink}>
                <span className="text-base">👤</span>
                <span>Sign In</span>
              </NavLink>
            </>
          )}
        </div>
      </nav>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="bg-navy-950 text-slate-300 border-t border-navy-900 mt-auto">
        {/* Desktop 4-column footer (hidden on mobile < md) */}
        <div className="hidden md:block mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-navy-800">
            {/* Brand column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-pink-600 via-rose-500 to-amber-500 flex items-center justify-center text-white font-display font-bold text-sm shadow">
                  P
                </div>
                <span className="font-display text-xl font-bold tracking-tight text-white">
                  <span className="text-pink-600">Pink</span>CityHomes
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                The premier verified PropTech real-estate marketplace for Jaipur, Rajasthan. Discover luxury villas, apartments, and independent residences.
              </p>
              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <span>📍</span> Jaipur, Rajasthan, India
              </p>
            </div>

            {/* Explore column */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-white">Explore Homes</p>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li>
                  <Link to="/properties" className="hover:text-pink-400 transition">
                    Buy Properties in Jaipur
                  </Link>
                </li>
                <li>
                  <Link to="/rentals" className="hover:text-pink-400 transition">
                    Rental Apartments &amp; Flats
                  </Link>
                </li>
                <li>
                  <Link to="/insights" className="hover:text-pink-400 transition">
                    Locality Price Trends &amp; Insights
                  </Link>
                </li>
              </ul>
            </div>

            {/* Sellers column */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-white">For Sellers &amp; Agencies</p>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li>
                  <Link to="/register" className="hover:text-pink-400 transition">
                    Apply as Verified Seller Partner
                  </Link>
                </li>
                <li>
                  <Link to="/seller/dashboard" className="hover:text-pink-400 transition">
                    Seller CRM &amp; Inventory Portal
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-pink-400 transition">
                    Partner Access Sign In
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company & Support column */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-white">Platform &amp; Trust</p>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li className="flex items-center gap-1.5 text-emerald-400">
                  <span>✓</span> 100% Verified Jaipur Inventory
                </li>
                <li className="flex items-center gap-1.5 text-emerald-400">
                  <span>✓</span> Direct Seller Contacts &amp; Tours
                </li>
                <li className="flex items-center gap-1.5 text-emerald-400">
                  <span>✓</span> Legal Title Verification Assistance
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <p>© {new Date().getFullYear()} PinkCityHomes. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="text-[11px] text-slate-400">Jaipur Verified Real Estate Marketplace</span>
            </div>
          </div>
        </div>

        {/* Minimal Mobile Footer (visible on mobile < md, compact height ~100-150px) */}
        <div className="md:hidden px-4 py-6 text-center space-y-2 pb-24 border-t border-navy-900/50">
          <div className="flex items-center justify-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-pink-600 to-amber-500 flex items-center justify-center text-white font-display font-bold text-xs shadow-xs">
              P
            </div>
            <span className="font-display text-base font-bold tracking-tight text-white">
              <span className="text-pink-600">Pink</span>CityHomes
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Verified real estate in Jaipur, Rajasthan</p>
          <p className="text-[10px] text-slate-500">© {new Date().getFullYear()} PinkCityHomes. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
