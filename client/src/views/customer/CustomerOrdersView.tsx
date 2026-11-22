import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { request, formatPaise } from '../../api/client';
import { ELLogo } from '../../components/ELLogo';
import {
  Package,
  Clock,
  Store,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Key,
  Layers,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface ParentOrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPricePaise: number;
}

interface MerchantChildOrder {
  id: string;
  childOrderNumber: string;
  status: string;
  subtotalPaise: number;
  rejectionReason: string | null;
  refundedAmountPaise: number;
  store: {
    id: string;
    name: string;
    locality: string;
  };
  items: ParentOrderItem[];
}

interface ParentOrder {
  id: string;
  parentOrderNumber: string;
  status: string;
  totalAmountPaise: number;
  deliveryFeePaise: number;
  deliveryPriorityTier: string;
  customerDeliveryOtp: string;
  deliveryAddress: string;
  createdAt: string;
  childOrders: MerchantChildOrder[];
}

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
  const [singleOrders, setSingleOrders] = useState<Order[]>([]);
  const [multiOrders, setMultiOrders] = useState<ParentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const [singleRes, multiRes] = await Promise.all([
        request<{ orders: Order[] }>('/customer/orders').catch(() => ({ orders: [] })),
        request<{ parentOrders: ParentOrder[] }>('/customer/orders/multi-store').catch(() => ({ parentOrders: [] }))
      ]);
      setSingleOrders(singleRes.orders || []);
      setMultiOrders(multiRes.parentOrders || []);
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
          Track active orders, view past neighbourhood receipts and verify delivery OTPs.
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

  const totalCount = singleOrders.length + multiOrders.length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Your Order History</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track multi-store deliveries, child merchant statuses &amp; delivery verification OTPs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-xs font-bold text-forest-800 bg-forest-50 px-3 py-1 rounded-full border border-forest-200">
            {totalCount} Orders
          </span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-3xl"></div>
          ))}
        </div>
      ) : totalCount === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-subtle">
          <ELLogo variant="dark" size={54} className="mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No orders yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            Order fresh essentials from neighbourhood stores in Indore with 15-20 min express delivery!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* SECTION 1: MULTI-STORE PARENT-CHILD ORDERS */}
          {multiOrders.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Multi-Store Consolidated Deliveries ({multiOrders.length})
              </h2>

              {multiOrders.map((pOrder) => {
                const isCompleted = pOrder.status === 'DELIVERED';
                const hasRejection = pOrder.childOrders.some((c) => c.status === 'REJECTED_REFUNDED');

                return (
                  <div
                    key={pOrder.id}
                    className="bg-white rounded-3xl border-2 border-slate-200/90 hover:border-amber-400 p-5 shadow-card transition space-y-4"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-amber-600" />
                        <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {pOrder.parentOrderNumber}
                        </span>
                        <span className="text-[10px] font-black uppercase bg-forest-900 text-white px-2 py-0.5 rounded-full">
                          {pOrder.deliveryPriorityTier.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          • {new Date(pOrder.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Delivery OTP Box */}
                      <div className="bg-amber-50 border border-amber-300 rounded-xl px-3 py-1 flex items-center gap-2">
                        <Key className="w-3.5 h-3.5 text-amber-700" />
                        <span className="text-[11px] font-bold text-amber-900">
                          Doorstep Handover OTP:
                        </span>
                        <span className="font-mono font-black text-sm text-slate-950 tracking-widest bg-white px-2 py-0.5 rounded border border-amber-200">
                          {pOrder.customerDeliveryOtp}
                        </span>
                      </div>
                    </div>

                    {/* Partial Rejection Notice if applicable */}
                    {hasRejection && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-800">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>
                          Notice: One merchant was out of stock. Refund of affected items has been initiated. Remaining stores are being fulfilled normally!
                        </span>
                      </div>
                    )}

                    {/* Child Orders Breakdown */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-black uppercase text-slate-400 block">
                        Stores in this Order ({pOrder.childOrders.length})
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {pOrder.childOrders.map((child) => (
                          <div
                            key={child.id}
                            className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                              child.status === 'REJECTED_REFUNDED'
                                ? 'bg-rose-50/50 border-rose-200'
                                : 'bg-slate-50/70 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-black text-slate-900 flex items-center gap-1.5 truncate">
                                <Store className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                {child.store.name}
                              </span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                child.status === 'REJECTED_REFUNDED'
                                  ? 'bg-rose-200 text-rose-800'
                                  : child.status === 'DELIVERED'
                                  ? 'bg-emerald-200 text-emerald-900'
                                  : 'bg-amber-200 text-amber-900'
                              }`}>
                                {child.status.replace(/_/g, ' ')}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              {child.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                            </p>

                            <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 text-[11px]">
                              <span className="text-slate-500">Subtotal:</span>
                              <span className="font-black text-slate-900">
                                {formatPaise(child.subtotalPaise)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bill Footer */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        Delivery to: <strong className="text-slate-800">{pOrder.deliveryAddress}</strong>
                      </span>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 mr-2">Total Paid:</span>
                        <span className="font-black text-base text-forest-900">
                          {formatPaise(pOrder.totalAmountPaise)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SECTION 2: SINGLE STORE ORDERS */}
          {singleOrders.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Store Orders ({singleOrders.length})
              </h2>

              {singleOrders.map((order) => {
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
                              : 'bg-amber-100 text-amber-900 border border-amber-200'
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
      )}
    </div>
  );
};
