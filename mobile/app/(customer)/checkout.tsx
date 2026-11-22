import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCart } from '../../src/context/CartContext';
import { useLocation } from '../../src/context/LocationContext';
import { request } from '../../src/api/client';
import { formatPaise } from '../../src/utils/format';
import { NotificationService } from '../../src/utils/notifications';
import { ELLogo } from '../../src/components/ELLogo';
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Store,
  CreditCard,
  ShieldCheck,
  Clock,
  Banknote,
  Smartphone,
  ChevronRight,
  AlertCircle
} from 'lucide-react-native';

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
      {/* Premium Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Order Checkout</Text>
          <View style={styles.secureBadge}>
            <ShieldCheck size={12} color="#064E3B" />
            <Text style={styles.secureText}>100% Verified Merchant</Text>
          </View>
        </View>
        <ELLogo variant="dark" size={34} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Delivery / Pickup Address Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.modeIconBox}>
              {fulfillmentMode === 'DELIVERY' ? (
                <MapPin size={20} color="#064E3B" />
              ) : (
                <Store size={20} color="#064E3B" />
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.modeRow}>
                <Text style={styles.modeBadgeText}>
                  {fulfillmentMode === 'DELIVERY' ? 'Doorstep Delivery' : 'Self Store Pickup'}
                </Text>
                <View style={styles.etaPill}>
                  <Clock size={12} color="#D97706" />
                  <Text style={styles.etaText}>15-20 mins</Text>
                </View>
              </View>
              <Text style={styles.addressLine}>
                {fulfillmentMode === 'DELIVERY'
                  ? selectedNeighborhood
                  : `${cart?.store?.name || 'Local Store'}, ${cart?.store?.addressLine || 'Indore'}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Store Card */}
        <View style={styles.card}>
          <View style={styles.storeHeader}>
            <View style={styles.storeAvatar}>
              <Text style={styles.storeAvatarText}>
                {cart?.store?.name ? cart.store.name.substring(0, 2).toUpperCase() : 'ST'}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.storeName}>{cart?.store?.name}</Text>
              <Text style={styles.storeSub}>
                {cart?.items?.length || 0} {(cart?.items?.length || 0) === 1 ? 'item' : 'items'} in order
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Method Selector */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
          <View style={styles.payOptions}>
            <TouchableOpacity
              onPress={() => setPaymentMethod('UPI')}
              style={[styles.payOption, paymentMethod === 'UPI' && styles.payOptionActive]}
            >
              <View style={[styles.radioCircle, paymentMethod === 'UPI' && styles.radioCircleActive]}>
                {paymentMethod === 'UPI' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.payIconBox}>
                <Smartphone size={20} color="#064E3B" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.payTitle}>UPI / Instant Pay</Text>
                <Text style={styles.paySub}>Google Pay, PhonePe, Paytm, BHIM</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPaymentMethod('COD')}
              style={[styles.payOption, paymentMethod === 'COD' && styles.payOptionActive]}
            >
              <View style={[styles.radioCircle, paymentMethod === 'COD' && styles.radioCircleActive]}>
                {paymentMethod === 'COD' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.payIconBox}>
                <Banknote size={20} color="#D97706" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.payTitle}>
                  {fulfillmentMode === 'PICKUP' ? 'Pay at Counter' : 'Cash on Delivery (COD)'}
                </Text>
                <Text style={styles.paySub}>Pay with cash directly upon receiving</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Itemized Bill Breakdown */}
        {quote && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>PRICE DETAILS</Text>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Total</Text>
              <Text style={styles.billValue}>{formatPaise(quote.itemSubtotalPaise)}</Text>
            </View>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Partner Fee</Text>
              <Text style={[styles.billValue, quote.deliveryFeePaise === 0 && styles.freeBadge]}>
                {quote.deliveryFeePaise === 0 ? 'FREE' : formatPaise(quote.deliveryFeePaise)}
              </Text>
            </View>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Platform Handling Fee</Text>
              <Text style={[styles.billValue, styles.freeBadge]}>FREE ₹0</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>To Pay</Text>
                <Text style={styles.totalSub}>Inclusive of all taxes</Text>
              </View>
              <Text style={styles.totalValue}>{formatPaise(quote.totalAmountPaise)}</Text>
            </View>
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <AlertCircle size={18} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.safetyGuarantee}>
          <ShieldCheck size={18} color="#064E3B" />
          <Text style={styles.safetyText}>
            Direct from local licensed store. Every rupee stays in Indore's local economy.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomTotalLabel}>TOTAL PAYABLE</Text>
          <Text style={styles.bottomTotalValue}>
            {quote ? formatPaise(quote.totalAmountPaise) : '...'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={loading || !quote}
          style={[styles.placeOrderBtn, (loading || !quote) && styles.btnDisabled]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>Place Order</Text>
              <ChevronRight size={18} color="#FFFFFF" />
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
    backgroundColor: '#F8F9FA'
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 48,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    elevation: 2
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A'
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2
  },
  secureText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#064E3B'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  modeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  modeBadgeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  },
  etaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4
  },
  etaText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706'
  },
  addressLine: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  storeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  storeAvatarText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A'
  },
  storeName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  },
  storeSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 12
  },
  payOptions: {
    gap: 10
  },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFAFA'
  },
  payOptionActive: {
    borderColor: '#064E3B',
    backgroundColor: '#F0FDF4'
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center'
  },
  radioCircleActive: {
    borderColor: '#064E3B'
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#064E3B'
  },
  payIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  payTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A'
  },
  paySub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6
  },
  billLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600'
  },
  billValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700'
  },
  freeBadge: {
    color: '#064E3B',
    fontWeight: '800'
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A'
  },
  totalSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#064E3B'
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '700',
    flex: 1
  },
  safetyGuarantee: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 8
  },
  safetyText: {
    fontSize: 12,
    color: '#064E3B',
    fontWeight: '600',
    flex: 1,
    lineHeight: 16
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6
  },
  bottomTotalLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B'
  },
  bottomTotalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A'
  },
  placeOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    gap: 6
  },
  btnDisabled: {
    opacity: 0.6
  },
  placeOrderText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF'
  }
});
