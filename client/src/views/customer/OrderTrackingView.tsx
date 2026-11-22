import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { request, formatPaise } from '../../api/client';
import { ArrowLeft, CheckCircle2, Clock, MapPin, Store, Package, RefreshCw, XCircle } from 'lucide-react';

interface OrderTrackingViewProps {
  order: Order;
  onBack: () => void;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({ order: initialOrder, onBack }) => {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadOrder = async () => {
    try {
      const res = await request<{ order: Order }>(`/customer/orders/${order.id}`);
      setOrder(res.order);
    } catch (err) {
      console.error('Failed to reload order:', err);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      reloadOrder();
    }, 4000); // Polling for order state progression
    return () => clearInterval(timer);
  }, [order.id]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    setError(null);
    try {
      await request(`/customer/orders/${order.id}/cancel`, { method: 'POST' });
      await reloadOrder();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const steps = [
    { key: 'PLACED', title: 'Order Placed', desc: 'Sent to merchant' },
    { key: 'ACCEPTED', title: 'Order Accepted', desc: 'Store confirmed availability' },
    { key: 'PREPARING', title: 'Preparing Items', desc: 'Packing your goods' },
    {
      key: order.fulfillmentMode === 'PICKUP' ? 'READY_FOR_PICKUP' : 'OUT_FOR_DELIVERY',
      title: order.fulfillmentMode === 'PICKUP' ? 'Ready for Pickup' : 'Out for Delivery',
      desc: order.fulfillmentMode === 'PICKUP' ? 'Counter ready' : 'Rider on the way'
    },
    {
      key: order.fulfillmentMode === 'PICKUP' ? 'COLLECTED' : 'DELIVERED',
      title: order.fulfillmentMode === 'PICKUP' ? 'Collected' : 'Delivered',
      desc: 'Completed'
    }
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PLACED': return 0;
      case 'ACCEPTED': return 1;
      case 'PREPARING': return 2;
      case 'READY_FOR_PICKUP':
      case 'OUT_FOR_DELIVERY': return 3;
      case 'COLLECTED':
      case 'DELIVERED': return 4;
      default: return -1;
    }
  };

  const currentStep = getStepIndex(order.status);
  const isCancelled = order.status === 'CANCELLED' || order.status === 'REJECTED';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-black text-slate-600 hover:text-forest-900 transition bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Order History</span>
      </button>

      {/* Order Status Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500 uppercase">
                {order.orderNumber}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-600">
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Order Status: <span className="text-forest-800">{order.status.replace(/_/g, ' ')}</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Fulfilled by <strong className="text-slate-800">{order.store.name}</strong> • {order.store.addressLine}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 font-medium block">Total Paid</span>
            <span className="text-2xl font-black text-slate-900">
              {formatPaise(order.totalAmountPaise)}
            </span>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        {!isCancelled ? (
          <div className="py-4">
            <div className="grid grid-cols-5 gap-2 relative">
              {steps.map((s, idx) => {
                const isPassed = idx <= currentStep;
                const isCurrent = idx === currentStep;

                return (
                  <div key={s.key} className="flex flex-col items-center text-center space-y-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition shadow-2xs ${
                        isPassed
                          ? 'bg-forest-800 text-white shadow-forest-800/30'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      } ${isCurrent ? 'ring-4 ring-forest-100' : ''}`}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div>
                      <h4
                        className={`text-[11px] font-bold leading-tight ${
                          isPassed ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {s.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 hidden sm:block mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800">
            <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
            <div>
              <h4 className="font-black text-sm">Order {order.status}</h4>
              <p className="text-xs text-rose-600">This order could not be fulfilled or was cancelled.</p>
            </div>
          </div>
        )}

        {/* Order Items Summary */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Order Items</h3>
          <div className="divide-y divide-slate-100 bg-slate-50 rounded-2xl p-4 border border-slate-100">
            {order.items.map((i) => (
              <div key={i.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">{i.productName}</span>
                  <span className="text-slate-400 font-semibold ml-2">× {i.quantity}</span>
                </div>
                <span className="font-black text-slate-900">{formatPaise(i.totalPricePaise)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions (Cancel button if placed) */}
        {order.status === 'PLACED' && (
          <div className="pt-4 flex justify-end">
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="px-4 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          </div>
        )}

        {error && (
          <p className="text-xs text-rose-600 font-medium text-right">{error}</p>
        )}
      </div>
    </div>
  );
};
