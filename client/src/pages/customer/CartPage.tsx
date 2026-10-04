import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { inr, imgSrc } from "../../lib/format";
import { EmptyState } from "../../components/EmptyState";
import { toast } from "../../components/Toast";
import type { Property } from "../../types";

type CartItem = {
  id: string;
  propertyId: string;
  property: Property;
};

type Cart = {
  id: string;
  userId: string;
  items: CartItem[];
};

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const data = await api.get<Cart>("/cart");
      setCart(data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCart();
  }, []);

  const handleRemove = async (propertyId: string, title?: string) => {
    try {
      const updated = await api.del<Cart>(`/cart/${propertyId}`);
      setCart(updated);
      window.dispatchEvent(new Event("cart-updated"));
      toast.success(`Removed "${title || "Property"}" from cart`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to remove item");
    }
  };

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) return;
    setCheckingOut(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>("/cart/checkout");
      setMsg(res.message || "Purchase closing initiated! A legal closing executive and the property seller have been notified.");
      window.dispatchEvent(new Event("cart-updated"));
      toast.success("Purchase closing order placed successfully!");
      await fetchCart();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to initiate purchase closing");
    } finally {
      setCheckingOut(false);
    }
  };

  const total = cart?.items.reduce((sum, i) => sum + (i.property?.price || 0), 0) || 0;

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-pink-600">Checkout Cart</span>
        <h1 className="font-display text-3xl font-bold text-navy mt-1">Purchase Closing Cart</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Reserved inventory ready for title verification, escrow, and sub-registrar registry
        </p>
      </div>

      {msg && (
        <div className="rounded-3xl bg-emerald-50 border border-emerald-200 p-5 text-xs sm:text-sm font-semibold text-emerald-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎉</span>
            <span>{msg}</span>
          </div>
          <Link
            to="/customer/orders"
            className="rounded-2xl bg-emerald-700 px-4 py-2 text-white text-xs font-bold hover:bg-emerald-800 transition"
          >
            View My Orders &rarr;
          </Link>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs font-semibold">Loading cart inventory...</div>
      ) : !cart || cart.items.length === 0 ? (
        <EmptyState
          icon="🛒"
          title="Your closing cart is empty"
          body="Explore verified properties across Jaipur and reserve residences to begin legal closing."
          action={{
            label: "Explore Jaipur Homes",
            href: "/properties",
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Cart items list */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => {
              const p = item.property;
              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-card hover:shadow-card-hover transition"
                >
                  <img
                    src={imgSrc(p?.images?.[0]?.path)}
                    alt=""
                    className="h-28 w-full sm:w-36 rounded-2xl object-cover bg-slate-100 flex-shrink-0"
                  />
                  <div className="flex-1 space-y-1 text-center sm:text-left min-w-0">
                    <span className="rounded-full bg-pink-50 text-pink-700 border border-pink-200 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                      {p?.bhk ? `${p.bhk} BHK` : "Property"}
                    </span>
                    <h3 className="font-display text-base font-bold text-navy truncate">
                      {p?.title || "Property"}
                    </h3>
                    <p className="text-xs text-slate-500 capitalize">
                      📍 {p?.locality}, {p?.city || "Jaipur"}
                    </p>
                    <p className="font-display text-lg font-bold text-navy pt-0.5">
                      {inr(p?.price)}
                    </p>
                  </div>
                  <div className="flex sm:flex-col gap-2 flex-shrink-0">
                    <Link
                      to={`/properties/${p?.id || item.propertyId}`}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition text-center"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleRemove(item.propertyId, p?.title)}
                      className="rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary sidebar */}
          <div className="space-y-4">
            <div className="rounded-4xl border border-slate-200/80 bg-white p-6 shadow-card space-y-5">
              <h2 className="font-display text-xl font-bold text-navy">Order Summary</h2>

              <div className="space-y-2.5 text-xs text-slate-600 border-b border-slate-100 pb-4">
                <div className="flex justify-between">
                  <span>Reserved Properties</span>
                  <span className="font-bold text-navy">{cart.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Title Verification Fee</span>
                  <span className="text-emerald-700 font-bold">Complimentary</span>
                </div>
                <div className="flex justify-between">
                  <span>Sub-Registrar Coordination</span>
                  <span className="text-emerald-700 font-bold">Included</span>
                </div>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-sm font-bold text-navy">Total Value</span>
                <span className="font-display text-2xl font-bold text-navy">{inr(total)}</span>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full rounded-2xl bg-pink-600 py-3.5 text-xs sm:text-sm font-semibold text-white shadow-md hover:bg-pink-700 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {checkingOut ? (
                  <span>Processing Closing...</span>
                ) : (
                  <span>Initiate Closing &rarr;</span>
                )}
              </button>

              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                By initiating closing, your designated closing manager will coordinate agreement drafting, escrow, and seller verification.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
