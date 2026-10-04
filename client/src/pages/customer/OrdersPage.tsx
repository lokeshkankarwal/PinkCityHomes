import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { inr, imgSrc } from "../../lib/format";
import { Badge } from "../../components/Badge";
import { EmptyState } from "../../components/EmptyState";
import type { Property } from "../../types";

type Order = {
  id: string;
  customerId: string;
  propertyId: string;
  status: string;
  soldPrice: number;
  createdAt: string;
  property: Property;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ results: Order[] }>("/orders/mine")
      .then((d) => setOrders(d.results || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-pink-600">Purchase History</span>
        <h1 className="font-display text-3xl font-bold text-navy mt-1">My Orders &amp; Purchases</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Official real estate purchase orders, escrow records, and sub-registrar closing milestones
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs font-semibold text-slate-400">Loading purchase orders...</div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No purchase orders found"
          body="Properties reserved and closed through PinkCityHomes will appear here with legal deed records."
          action={{
            label: "Browse Properties",
            href: "/properties",
          }}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const p = order.property;
            return (
              <div
                key={order.id}
                className="flex flex-col sm:flex-row items-center gap-5 rounded-4xl border border-slate-200/80 bg-white p-5 shadow-card hover:shadow-card-hover transition-all duration-200"
              >
                <img
                  src={imgSrc(p?.images?.[0]?.path)}
                  alt=""
                  className="h-32 w-full sm:w-44 rounded-2xl object-cover bg-slate-100 flex-shrink-0"
                />

                <div className="flex-1 space-y-2 text-center sm:text-left min-w-0">
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <Badge status={order.status} />
                    <span className="text-[11px] text-slate-400">
                      Ordered on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>

                  <Link to={`/properties/${order.propertyId}`}>
                    <h3 className="font-display text-lg font-bold text-navy hover:text-pink-600 transition truncate">
                      {p?.title || "Property"}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-500 capitalize">
                    📍 {p?.locality}, {p?.city || "Jaipur"} {p?.bhk ? `· ${p.bhk} BHK` : ""} {p?.carpetArea ? `(${p.carpetArea} sq ft)` : ""}
                  </p>

                  <p className="font-display text-xl font-bold text-navy pt-1">
                    Closed at {inr(order.soldPrice)}
                  </p>
                </div>

                <div className="flex sm:flex-col gap-2 flex-shrink-0">
                  <Link
                    to={`/properties/${order.propertyId}`}
                    className="rounded-2xl bg-navy px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-navy-800 transition active:scale-95 text-center"
                  >
                    View Property
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
