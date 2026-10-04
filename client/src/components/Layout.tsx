import { useState, useEffect, useRef } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth";
import { api } from "../api/client";
import { ToastContainer } from "./Toast";

// ── SVG Icons ─────────────────────────────────────────────────────────────
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );
}

function HeartIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className || "w-5 h-5"} fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function BoxIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function TrendIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-6 h-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

const navLink = ({ isActive }: { isActive: boolean }) =>
  `relative px-3.5 py-2 rounded-2xl text-xs font-semibold tracking-wide transition-all duration-200 ${
    isActive
      ? "text-pink-600 bg-pink-50/80 shadow-xs font-bold"
      : "text-slate-600 hover:text-navy hover:bg-slate-100/70"
  }`;

const drawerNavLink = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all duration-200 min-h-[44px] ${
    isActive
      ? "text-pink-600 bg-pink-50 font-bold border border-pink-100 shadow-xs"
      : "text-slate-700 hover:text-navy hover:bg-slate-100/80"
  }`;

const bottomNavLink = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center justify-center flex-1 py-1 px-1 text-[10px] font-semibold tracking-tight transition duration-150 ${
    isActive ? "text-pink-600 font-bold" : "text-slate-500 hover:text-navy"
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
                            <UserIcon className="w-4 h-4 text-slate-500" />
                            <span>Profile &amp; Settings</span>
                          </Link>
                          {isCustomer && (
                            <>
                              <Link
                                to="/customer/favourites"
                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-navy transition font-medium"
                              >
                                <HeartIcon className="w-4 h-4 text-pink-600" filled />
                                <span>Saved Homes</span>
                              </Link>
                              <Link
                                to="/customer/orders"
                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-navy transition font-medium"
                              >
                                <BoxIcon className="w-4 h-4 text-slate-500" />
                                <span>Orders &amp; Purchases</span>
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
                            <LogoutIcon className="w-4 h-4" />
                            <span>Sign Out</span>
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
              <Link to="/customer/cart" className="relative p-2 text-slate-700 hover:text-navy" aria-label="Purchase Cart">
                <CartIcon className="w-5 h-5" />
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
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Account / Navigation Bottom Sheet (Replaces huge desktop drawer) ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-navy-950/60 backdrop-blur-xs transition-opacity"
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
                      <span className="inline-block rounded-full bg-pink-50 text-pink-700 text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">
                        {isSeller ? (user.sellerStatus === "APPROVED" ? "VERIFIED SELLER" : "SELLER") : user.role}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-full p-2 text-slate-400 hover:text-navy hover:bg-slate-100 transition flex-shrink-0"
                    aria-label="Close menu"
                  >
                    <CloseIcon className="w-5 h-5" />
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
                    <CloseIcon className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Navigation Links — Only secondary items, strictly no duplicates from bottom nav */}
              <div className="space-y-1 text-xs font-semibold">
                {isSuperAdmin ? (
                  // Superadmin Secondary Actions (Home, Users, Sellers, Properties are in bottom nav)
                  <>
                    <NavLink to="/admin/disabled" className={drawerNavLink}>
                      <BuildingIcon className="w-4 h-4 text-slate-500" />
                      <span>Disabled Properties</span>
                    </NavLink>
                    <NavLink to="/admin/audit" className={drawerNavLink}>
                      <BoxIcon className="w-4 h-4 text-slate-500" />
                      <span>Audit Logs</span>
                    </NavLink>
                  </>
                ) : isSeller ? (
                  // Seller Secondary Actions (Home, Listings, Leads, Insights, Profile are in bottom nav)
                  <NavLink to="/customer/profile" className={drawerNavLink}>
                    <UserIcon className="w-4 h-4 text-slate-500" />
                    <span>My Profile &amp; Settings</span>
                  </NavLink>
                ) : isCustomer ? (
                  // Customer Secondary Actions (Buy, Rent, Saved, Orders, Profile are in bottom nav)
                  <>
                    <NavLink to="/customer/profile" className={drawerNavLink}>
                      <UserIcon className="w-4 h-4 text-slate-500" />
                      <span>My Profile &amp; Settings</span>
                    </NavLink>
                    <NavLink to="/insights" className={drawerNavLink}>
                      <TrendIcon className="w-4 h-4 text-slate-500" />
                      <span>Jaipur Market Intelligence</span>
                    </NavLink>
                  </>
                ) : (
                  // Guest Secondary Actions (Home, Buy, Rent, Saved, Sign In are in bottom nav)
                  <>
                    <NavLink to="/insights" className={drawerNavLink}>
                      <TrendIcon className="w-4 h-4 text-slate-500" />
                      <span>Market Insights &amp; Trends</span>
                    </NavLink>
                    <NavLink to="/register" className={drawerNavLink}>
                      <BuildingIcon className="w-4 h-4 text-slate-500" />
                      <span>Apply as Seller Partner</span>
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
                    className="w-full rounded-xl border border-rose-200 bg-rose-50/60 py-2.5 text-center text-xs font-semibold text-rose-700 hover:bg-rose-100 transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <LogoutIcon className="w-4 h-4" />
                    <span>Sign Out</span>
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

      {/* ── Mobile Bottom App Bar (Fixed at bottom on phones, clean SVG icons, 5 items max) ───────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200/80 backdrop-blur-md md:hidden px-1 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
        <div className="flex items-center justify-around h-16">
          {isSuperAdmin ? (
            // Superadmin Bottom Nav
            <>
              <NavLink to="/admin/dashboard" className={bottomNavLink}>
                {({ isActive }) => (
                  <>
                    <HomeIcon className={`w-5 h-5 mb-0.5 transition-transform duration-150 ${isActive ? "scale-110 text-pink-600" : ""}`} />
                    <span>Home</span>
                  </>
                )}
              </NavLink>
              <NavLink to="/admin/users" className={bottomNavLink}>
                {({ isActive }) => (
                  <>
                    <UsersIcon className={`w-5 h-5 mb-0.5 transition-transform duration-150 ${isActive ? "scale-110 text-pink-600" : ""}`} />
                    <span>Users</span>
                  </>
                )}
              </NavLink>
              <NavLink to="/admin/sellers" className={bottomNavLink}>
                {({ isActive }) => (
                  <>
                    <BuildingIcon className={`w-5 h-5 mb-0.5 transition-transform duration-150 ${isActive ? "scale-110 text-pink-600" : ""}`} />
                    <span>Sellers</span>
                  </>
                )}
              </NavLink>
              <NavLink to="/admin/properties" className={bottomNavLink}>
                {({ isActive }) => (
                  <>
                    <HomeIcon className={`w-5 h-5 mb-0.5 transition-transform duration-150 ${isActive ? "scale-110 text-pink-600" : ""}`} />
                    <span>Properties</span>
                  </>
                )}
              </NavLink>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex flex-col items-center justify-center flex-1 py-1 px-1 text-[10px] font-semibold text-slate-500 hover:text-navy transition"
              >
                <MenuIcon className="w-5 h-5 mb-0.5" />
                <span>More</span>
              </button>
            </>
          ) : isSeller ? (
            // Seller Bottom Nav (Strictly Seller-Only: Home, Listings, Leads, Insights, Profile)
            <>
              <NavLink to="/seller/dashboard" className={bottomNavLink}>
                {({ isActive }) => (
                  <>
                    <HomeIcon className={`w-5 h-5 mb-0.5 transition-transform duration-150 ${isActive ? "scale-110 text-pink-600" : ""}`} />
                    <span>Home</span>
                  </>
                )}
              </NavLink>
              <NavLink to="/seller/properties" className={bottomNavLink}>
                {({ isActive }) => (
                  <>
                    <BuildingIcon className={`w-5 h-5 mb-0.5 transition-transform duration-150 ${isActive ? "scale-110 text-pink-600" : ""}`} />
                    <span>Listings</span>
                  </>
                )}
              </NavLink>
              <NavLink to="/seller/clients" className={bottomNavLink}>
                {({ isActive }) => (
                  <>
                    <UsersIcon className={`w-5 h-5 mb-0.5 transition-transform duration-150 ${isActive ? "scale-110 text-pink-600" : ""}`} />
                    <span>Leads</span>
                  </>
                )}
              </NavLink>
              <NavLink to="/insights" className={bottomNavLink}>
                {({ isActive }) => (
                  <>
                    <TrendIcon className={`w-5 h-5 mb-0.5 transition-transform duration-150 ${isActive ? "scale-110 text-pink-600" : ""}`} />
                    <span>Insights</span>
                  </>
                )}
              </NavLink>
              <NavLink to="/customer/profile" className={bottomNavLink}>
                {({ isActive }) => (
                  <>
                    <UserIcon className={`w-5 h-5 mb-0.5 transition-transform duration-150 ${isActive ? "scale-110 text-pink-600" : ""}`} />
                    <span>Profile</span>
                  </>
                )}
              </NavLink>
            </>
          ) : isCustomer ? (
            // Customer Bottom Nav (Buy, Rent, Saved, Orders, Profile)
            <>
              <NavLink to="/properties" className={bottomNavLink}>
                {({ isActive }) => (
                  <>
                    <SearchIcon className={`w-5 h-5 mb-0.5 transition-transform duration-150 ${isActive ? "scale-110 text-pink-600" : ""}`} />
                    <span>Buy</span>
                  </>
                )}
              </NavLink>
              <NavLink to="/rentals" className={bottomNavLink}>
                {({ isActive }) => (
                  <>
                    <KeyIcon className={`w-5 h-5 mb-0.5 transition-transform duration-150 ${isActive ? "scale-110 text-pink-600" : ""}`} />
                    <span>Rent</span>
                  </>
                )}
              </NavLink>
              <NavLink to="/customer/favourites" className={bottomNavLink}>
                {({ isActive }) => (
                  <>
                    <div className="relative mb-0.5">
                      <HeartIcon
                        filled={isActive}
                        className={`w-5 h-5 transition-transform duration-150 ${isActive ? "scale-110 text-pink-600" : ""}`}
                      />
                      {favCount > 0 && (
                        <span className="absolute -top-1 -right-2 rounded-full bg-pink-600 text-white text-[9px] font-bold h-3.5 w-3.5 flex items-center justify-center">
                          {favCount}
                        </span>
                      )}
                    </div>
                    <span>Saved</span>
                  </>
                )}
              </NavLink>
              <NavLink to="/customer/orders" className={bottomNavLink}>
                {({ isActive }) => (
                  <>
                    <BoxIcon className={`w-5 h-5 mb-0.5 transition-transform duration-150 ${isActive ? "scale-110 text-pink-600" : ""}`} />
                    <span>Orders</span>
                  </>
                )}
              </NavLink>
              <NavLink to="/customer/profile" className={bottomNavLink}>
                {({ isActive }) => (
                  <>
                    <UserIcon className={`w-5 h-5 mb-0.5 transition-transform duration-150 ${isActive ? "scale-110 text-pink-600" : ""}`} />
                    <span>Profile</span>
                  </>
                )}
              </NavLink>
            </>
          ) : (
            // Guest Bottom Nav (Home, Buy, Rent, Saved, Sign In)
            <>
              <NavLink to="/" end className={bottomNavLink}>
                {({ isActive }) => (
                  <>
                    <HomeIcon className={`w-5 h-5 mb-0.5 transition-transform duration-150 ${isActive ? "scale-110 text-pink-600" : ""}`} />
                    <span>Home</span>
                  </>
                )}
              </NavLink>
              <NavLink to="/properties" className={bottomNavLink}>
                {({ isActive }) => (
                  <>
                    <SearchIcon className={`w-5 h-5 mb-0.5 transition-transform duration-150 ${isActive ? "scale-110 text-pink-600" : ""}`} />
                    <span>Buy</span>
                  </>
                )}
              </NavLink>
              <NavLink to="/rentals" className={bottomNavLink}>
                {({ isActive }) => (
                  <>
                    <KeyIcon className={`w-5 h-5 mb-0.5 transition-transform duration-150 ${isActive ? "scale-110 text-pink-600" : ""}`} />
                    <span>Rent</span>
                  </>
                )}
              </NavLink>
              <NavLink to="/customer/favourites" className={bottomNavLink}>
                {({ isActive }) => (
                  <>
                    <HeartIcon className={`w-5 h-5 mb-0.5 transition-transform duration-150 ${isActive ? "scale-110 text-pink-600" : ""}`} />
                    <span>Saved</span>
                  </>
                )}
              </NavLink>
              <NavLink to="/login" className={bottomNavLink}>
                {({ isActive }) => (
                  <>
                    <UserIcon className={`w-5 h-5 mb-0.5 transition-transform duration-150 ${isActive ? "scale-110 text-pink-600" : ""}`} />
                    <span>Sign In</span>
                  </>
                )}
              </NavLink>
            </>
          )}
        </div>
      </nav>

      {/* ── Footer (Desktop Only, Completely Hidden on Mobile < md) ── */}
      <footer className="hidden md:block bg-navy-950 text-slate-300 border-t border-navy-900 mt-auto">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
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
      </footer>
    </div>
  );
}
