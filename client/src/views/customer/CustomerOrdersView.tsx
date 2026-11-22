import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { request, formatPaise } from '../../api/client';
import { ELLogo } from '../../components/ELLogo';
import { Package, Clock, Store, ArrowRight, CheckCircle2, AlertCircle, ShoppingBag } from 'lucide-react';

interface CustomerOrdersViewProps {
  onSelectOrder: (order: Order) => void;
  openAuth: () => void;
  isLoggedIn: boolean;
}

export const CustomerOrdersView: React.FC<CustomerOrdersViewProps> = ({
  onSelectOrder,
  openAuth,
  isLoggedIn
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const res = await request<{ orders: Order[] }>('/customer/orders');
      setOrders(res.orders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <ELLogo variant="dark" size={64} className="mx-auto" />
        <h3 className="font-black text-slate-900 text-xl">Sign in to view orders</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
          Track active orders, view past neighbourhood receipts and re-order your favourites.
        </p>
        <button
          onClick={openAuth}
          className="px-6 py-3 bg-forest-900 hover:bg-forest-950 text-white rounded-2xl text-xs font-black shadow-md transition active:scale-95"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Your Order History</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track live deliveries and pick up past store receipts</p>
        </div>
        <span className="text-xs font-bold text-forest-800 bg-forest-50 px-3 py-1 rounded-full border border-forest-200">
          {orders.length} Orders
        </span>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-3xl"></div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-subtle">
          <ELLogo variant="dark" size={54} className="mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No orders yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            Order fresh essentials from neighbourhood stores in Indore with ₹0 pickup or local 30-min delivery!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isCompleted = ['DELIVERED', 'COLLECTED'].includes(order.status);
            const isCancelled = order.status === 'CANCELLED' || order.status === 'REJECTED';

            return (
              <div
                key={order.id}
                onClick={() => onSelectOrder(order)}
                className="bg-white rounded-3xl border border-slate-200/90 p-5 hover:border-amber-400 shadow-subtle hover:shadow-card transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-forest-100 text-forest-900 border border-forest-200'
                          : isCancelled
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-900 border border-amber-200 animate-pulse'
                      }`}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      • {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-sm text-slate-900">{order.store.name}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {order.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span>
                      Mode: <strong className="text-slate-800 font-bold">{order.fulfillmentMode}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Total: <strong className="text-forest-900 font-black">{formatPaise(order.totalAmountPaise)}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-50 hover:bg-forest-900 text-forest-900 hover:text-white font-bold text-xs border border-forest-300 transition shadow-2xs">
                    <span>Track Order</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
