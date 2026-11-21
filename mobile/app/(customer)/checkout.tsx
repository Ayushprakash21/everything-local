import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCart } from '../../src/context/CartContext';
import { useLocation } from '../../src/context/LocationContext';
import { request } from '../../src/api/client';
import { formatPaise } from '../../src/utils/format';
import { NotificationService } from '../../src/utils/notifications';
import { ArrowLeft, CheckCircle2, MapPin, Store, CreditCard, ShieldCheck } from 'lucide-react-native';

export default function CheckoutScreen() {
  const router = useRouter();
  const { fulfillmentMode = 'PICKUP' } = useLocalSearchParams<{ fulfillmentMode: string }>();
  const { cart, refreshCart } = useCart();
  const { coords, selectedNeighborhood } = useLocation();

  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'COD'>('UPI');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await request<any>('/customer/orders/quote', {
          method: 'POST',
          body: JSON.stringify({
            fulfillmentMode,
            customerLat: coords.latitude,
            customerLng: coords.longitude
          })
        });
        setQuote(res.financials);
      } catch (err: any) {
        setError(err.message || 'Failed to calculate quote');
      }
    };
    fetchQuote();
  }, [fulfillmentMode, coords]);

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError(null);

    try {
      const idempotencyKey = `MOB-${Date.now()}-${Math.random().toString().slice(-4)}`;
      const res = await request<{ order: any; message: string }>('/customer/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          fulfillmentMode,
          idempotencyKey,
          customerLat: coords.latitude,
          customerLng: coords.longitude
        })
      });

      // Dispatch native local push notification
      await NotificationService.sendLocalNotification(
        'Order Placed Successfully! 🛍️',
        `Your order #${res.order.orderNumber} has been received by ${cart?.store?.name}.`,
        { orderId: res.order.id }
      );

      await refreshCart();

      // Navigate to tracking
      router.replace(`/(customer)/orders/${res.order.id}`);
    } catch (err: any) {
      setError(err.message || 'Order checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Confirmation</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Store & Mode Overview */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>ORDERING FROM</Text>
          <Text style={styles.storeTitle}>{cart?.store?.name}</Text>
          <View style={styles.modeBadgeRow}>
            <View style={styles.modeBadge}>
              <Store size={14} color="#059669" />
              <Text style={styles.modeBadgeText}>Mode: {fulfillmentMode}</Text>
            </View>
            <Text style={styles.addressText}>{selectedNeighborhood}</Text>
          </View>
        </View>

        {/* Payment Method Selector */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>PAYMENT METHOD</Text>
          <View style={styles.payOptions}>
            <TouchableOpacity
              onPress={() => setPaymentMethod('UPI')}
              style={[styles.payOption, paymentMethod === 'UPI' && styles.payOptionActive]}
            >
              <View style={styles.radioCircle}>
                {paymentMethod === 'UPI' && <View style={styles.radioInner} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payTitle}>UPI / GPay / PhonePe / Paytm</Text>
                <Text style={styles.paySub}>Instant, zero fee local payment</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPaymentMethod('COD')}
              style={[styles.payOption, paymentMethod === 'COD' && styles.payOptionActive]}
            >
              <View style={styles.radioCircle}>
                {paymentMethod === 'COD' && <View style={styles.radioInner} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payTitle}>
                  {fulfillmentMode === 'PICKUP' ? 'Pay at Counter' : 'Cash on Delivery'}
                </Text>
                <Text style={styles.paySub}>Pay directly to store upon handover</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Verified Financial Breakdown */}
        {quote && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>FINAL BILL SUMMARY (INTEGER PAISE)</Text>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Subtotal</Text>
              <Text style={styles.billValue}>{formatPaise(quote.itemSubtotalPaise)}</Text>
            </View>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery / Fulfillment</Text>
              <Text style={styles.billValue}>
                {quote.deliveryFeePaise === 0 ? 'FREE ₹0' : formatPaise(quote.deliveryFeePaise)}
              </Text>
            </View>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Taxes & Tech Fee</Text>
              <Text style={styles.billValue}>₹0.00</Text>
            </View>

            <View style={[styles.billRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount Payable</Text>
              <Text style={styles.totalValue}>{formatPaise(quote.totalAmountPaise)}</Text>
            </View>
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Place Order CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={loading || !quote}
          style={[styles.placeBtn, (loading || !quote) && styles.placeBtnDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <CheckCircle2 size={18} color="#ffffff" />
              <Text style={styles.placeBtnText}>Confirm & Place Order</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  storeTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  modeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  addressText: {
    fontSize: 12,
    color: '#64748b',
  },
  payOptions: {
    gap: 10,
  },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  payOptionActive: {
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#059669',
  },
  payTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  paySub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  billValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  totalRow: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    padding: 16,
    paddingBottom: 28,
  },
  placeBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#059669',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  placeBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  placeBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
