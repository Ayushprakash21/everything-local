import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { request, formatPaise } from '../../api/client';
import { Package, Clock, Store, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

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
        <Package className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="font-bold text-slate-800 text-lg">Sign in to view your orders</h3>
        <p className="text-sm text-slate-500">Track and review your past neighborhood orders.</p>
        <button
          onClick={openAuth}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Your Order History</h1>
        <span className="text-xs text-slate-500 font-medium">{orders.length} orders placed</span>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-3xl"></div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800">No orders yet</h3>
          <p className="text-sm text-slate-500">
            Order fresh items from neighborhood stores in Indore with ₹0 pickup or local delivery!
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
                className="bg-white rounded-3xl border border-slate-200 p-5 hover:border-emerald-500/60 hover:shadow-md transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : isCancelled
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-400">
                      • {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{order.store.name}</h3>
                    <p className="text-xs text-slate-500">
                      {order.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>Mode: <strong className="text-slate-700">{order.fulfillmentMode}</strong></span>
                    <span>•</span>
                    <span>Total: <strong className="text-slate-900">{formatPaise(order.totalAmountPaise)}</strong></span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-semibold text-xs border border-slate-200 transition">
                    <span>View Tracking & Receipt</span>
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
