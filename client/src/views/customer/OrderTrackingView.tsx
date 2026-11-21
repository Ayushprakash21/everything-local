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
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Orders</span>
      </button>

      {/* Order Status Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
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
            <h1 className="text-2xl font-black text-slate-900 mt-1">{order.store.name}</h1>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              {order.store.addressLine}, {order.store.city}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={reloadOrder}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition"
              title="Refresh status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <span
              className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${
                isCancelled
                  ? 'bg-red-100 text-red-800'
                  : currentStep === 4
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800 animate-pulse'
              }`}
            >
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Live Timeline Steps */}
        {!isCancelled ? (
          <div className="py-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-4">
              Live Order Progression
            </span>
            <div className="relative flex items-center justify-between">
              {steps.map((step, idx) => {
                const isPassed = currentStep >= idx;
                const isCurrent = currentStep === idx;

                return (
                  <div key={step.key} className="flex-1 flex flex-col items-center text-center relative group">
                    {/* Connecting line */}
                    {idx < steps.length - 1 && (
                      <div
                        className={`absolute top-4 left-1/2 w-full h-1 -z-0 ${
                          currentStep > idx ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      ></div>
                    )}

                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 transition ${
                        isPassed
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>

                    <span className={`text-[11px] font-bold mt-2 ${isCurrent ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {step.title}
                    </span>
                    <span className="text-[10px] text-slate-400 hidden sm:block">{step.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800">
            <XCircle className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Order Cancelled or Rejected</h4>
              <p className="text-xs text-red-600 mt-0.5">
                This order was cancelled. Any inventory reservation has been re-released.
              </p>
            </div>
          </div>
        )}

        {/* Customer Cancel Button (if still in PLACED state) */}
        {order.status === 'PLACED' && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="text-xs font-bold text-red-600 hover:text-red-800 border border-red-200 hover:bg-red-50 px-3.5 py-1.5 rounded-xl transition"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {error}
          </div>
        )}
      </div>

      {/* Order Itemized Invoice */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
        <h3 className="font-bold text-base text-slate-900">Itemized Invoice</h3>

        <div className="divide-y divide-slate-100 text-xs">
          {order.items.map((item) => (
            <div key={item.id} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">{item.productName}</span>
                <span className="text-slate-400 ml-2">x {item.quantity}</span>
              </div>
              <span className="font-bold text-slate-900">{formatPaise(item.totalPricePaise)}</span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Item Subtotal</span>
            <span>{formatPaise(order.itemSubtotalPaise)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Fulfillment ({order.fulfillmentMode})</span>
            <span>{formatPaise(order.deliveryFeePaise)}</span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-sm text-slate-900">
            <span>Total Paid</span>
            <span className="text-emerald-700">{formatPaise(order.totalAmountPaise)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
