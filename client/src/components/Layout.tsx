import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

const link = ({ isActive }: { isActive: boolean }) =>
  `text-sm ${isActive ? "text-brass font-semibold" : "text-ink/80 hover:text-ink"}`;

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-sand/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-serif text-2xl tracking-tight">
            <span className="text-pink-600">Pink</span>
            <span className="text-ink">CityHomes</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-4">
            <NavLink to="/properties" className={link}>
              Buy
            </NavLink>
            <NavLink to="/rentals" className={link}>
              Rent
            </NavLink>
            <NavLink to="/projects" className={link}>
              Projects
            </NavLink>
            <NavLink to="/insights" className={link}>
              Market
            </NavLink>
            {user?.role === "CUSTOMER" && (
              <>
                <NavLink to="/customer/favourites" className={link}>
                  Saved
                </NavLink>
                <NavLink to="/customer/cart" className={link}>
                  Cart
                </NavLink>
                <NavLink to="/customer/orders" className={link}>
                  Orders
                </NavLink>
              </>
            )}
            {user?.role === "SELLER" && (
              <NavLink to="/seller/dashboard" className={link}>
                Dashboard
              </NavLink>
            )}
            {user?.role === "SUPERADMIN" && (
              <NavLink to="/admin/dashboard" className={link}>
                Admin
              </NavLink>
            )}
            {user ? (
              <>
                <NavLink to="/customer/profile" className={link}>
                  {user.name}
                </NavLink>
                <button
                  className="text-sm text-ink/70 hover:text-ink transition"
                  onClick={async () => {
                    await logout();
                    navigate("/login");
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={link}>
                  Login
                </NavLink>
                <NavLink to="/register" className="rounded-full bg-ink px-3 py-1 text-sm text-sand">
                  Register
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-ink/10 bg-sand/60 py-8 mt-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="font-serif text-lg">
              <span className="text-pink-600">Pink</span>
              <span className="text-ink">CityHomes</span>
            </span>
            <p className="text-xs text-ink/60">Find your home in Jaipur — the Pink City of India</p>
            <div className="flex gap-6 text-xs text-ink/50 mt-1">
              <Link to="/properties" className="hover:text-ink">Buy</Link>
              <Link to="/rentals" className="hover:text-ink">Rent</Link>
              <Link to="/projects" className="hover:text-ink">Projects</Link>
              <Link to="/register" className="hover:text-ink">Register</Link>
            </div>
            <p className="text-xs text-ink/40 mt-2">© {new Date().getFullYear()} PinkCityHomes. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
