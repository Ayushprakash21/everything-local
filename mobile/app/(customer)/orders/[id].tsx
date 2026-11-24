import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Order } from '../../../src/types';
import { request } from '../../../src/api/client';
import { formatPaise } from '../../../src/utils/format';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  Store,
  XCircle,
  RefreshCw,
  Phone,
  Truck,
  Package,
  AlertTriangle,
  Receipt
} from 'lucide-react-native';

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await request<{ order: Order }>(`/customer/orders/${id}`);
      setOrder(res.order);
    } catch (e) {
      console.error('Failed to load order:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 4000);
    return () => clearInterval(interval);
  }, [id]);

  const handleCancelOrder = async () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? Any reserved items will be returned to the store inventory.',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await request(`/customer/orders/${id}/cancel`, { method: 'POST' });
              fetchOrder();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not cancel order.');
            } finally {
              setCancelling(false);
            }
          }
        }
      ]
    );
  };

  if (loading || !order) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#064E3B" />
        <Text style={styles.loadingText}>Loading live order details...</Text>
      </View>
    );
  }

  const steps = [
    { key: 'PLACED', label: 'Order Received', sub: 'Merchant notified' },
    { key: 'ACCEPTED', label: 'Order Accepted', sub: 'Items reserved in stock' },
    { key: 'PREPARING', label: 'Packing Order', sub: 'Packed with care at local store' },
    {
      key: order.fulfillmentMode === 'PICKUP' ? 'READY_FOR_PICKUP' : 'OUT_FOR_DELIVERY',
      label: order.fulfillmentMode === 'PICKUP' ? 'Ready for Pickup' : 'Out for Delivery',
      sub: order.fulfillmentMode === 'PICKUP' ? 'Ready at checkout counter' : 'Delivery rider on the way'
    },
    {
      key: order.fulfillmentMode === 'PICKUP' ? 'COLLECTED' : 'DELIVERED',
      label: order.fulfillmentMode === 'PICKUP' ? 'Collected' : 'Delivered',
      sub: 'Order completed'
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
  const canCancel = order.status === 'PLACED' || order.status === 'ACCEPTED';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Order #{order.orderNumber}</Text>
          <Text style={styles.headerSub}>Live Tracking</Text>
        </View>
        <TouchableOpacity onPress={fetchOrder} style={styles.refreshBtn}>
          <RefreshCw size={18} color="#064E3B" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.etaHeader}>
                {isCancelled
                  ? 'Order Cancelled'
                  : currentStep === 4
                  ? 'Delivered Successfully! 🎉'
                  : 'Estimated Handover: 15-20 mins'}
              </Text>
              <Text style={styles.storeName}>{order.store?.name}</Text>
            </View>

            <View style={[styles.statusBadge, isCancelled && styles.statusBadgeCancelled]}>
              <Text style={[styles.statusBadgeText, isCancelled && styles.statusBadgeTextCancelled]}>
                {order.status.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>

          {/* Stepper Timeline */}
          {!isCancelled ? (
            <View style={styles.stepperBox}>
              <Text style={styles.stepperTitle}>LIVE FULFILLMENT TIMELINE</Text>
              <View style={styles.stepsList}>
                {steps.map((st, idx) => {
                  const isDone = currentStep >= idx;
                  const isCurrent = currentStep === idx;

                  return (
                    <View key={st.key} style={styles.stepRow}>
                      <View style={styles.stepIndicatorCol}>
                        <View style={[styles.stepCircle, isDone && styles.stepCircleDone]}>
                          {isDone ? (
                            <CheckCircle2 size={16} color="#FFFFFF" />
                          ) : (
                            <Text style={styles.stepNum}>{idx + 1}</Text>
                          )}
                        </View>
                        {idx < steps.length - 1 && (
                          <View style={[styles.stepLine, currentStep > idx && styles.stepLineDone]} />
                        )}
                      </View>

                      <View style={styles.stepTextCol}>
                        <Text style={[styles.stepLabel, isCurrent && styles.stepLabelCurrent]}>
                          {st.label}
                        </Text>
                        <Text style={styles.stepSub}>{st.sub}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.cancelledBox}>
              <XCircle size={28} color="#DC2626" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.cancelledTitle}>Order Cancelled</Text>
                <Text style={styles.cancelledSub}>
                  This order was cancelled. Any reserved items have been re-stocked.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Store & Location Card */}
        <View style={styles.card}>
          <View style={styles.storeRow}>
            <View style={styles.storeIconBox}>
              <Store size={22} color="#064E3B" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.cardTitle}>{order.store?.name}</Text>
              <Text style={styles.cardSub}>{order.store?.addressLine}, Indore</Text>
              <Text style={styles.modeText}>Mode: {order.fulfillmentMode}</Text>
            </View>
          </View>
        </View>

        {/* Itemized Order Items */}
        <View style={styles.card}>
          <View style={styles.receiptHeader}>
            <Receipt size={18} color="#064E3B" />
            <Text style={styles.receiptTitle}>Items Ordered ({order.items?.length || 0})</Text>
          </View>

          <View style={styles.itemsList}>
            {order.items?.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.qtyBadge}>
                  <Text style={styles.qtyText}>{item.quantity}x</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.itemName}>{item.productName || item.product?.name || 'Item'}</Text>
                  <Text style={styles.itemUnitPrice}>{formatPaise(item.unitPricePaise || item.pricePaise || 0)} each</Text>
                </View>
                <Text style={styles.itemTotal}>{formatPaise(item.totalPricePaise || item.totalPaise || 0)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Bill Summary */}
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Subtotal</Text>
            <Text style={styles.billValue}>{formatPaise(order.itemSubtotalPaise)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={[styles.billValue, order.deliveryFeePaise === 0 && styles.freeBadge]}>
              {order.deliveryFeePaise === 0 ? 'FREE' : formatPaise(order.deliveryFeePaise)}
            </Text>
          </View>
          <View style={[styles.billRow, styles.totalBillRow]}>
            <Text style={styles.totalBillLabel}>Total Amount Paid</Text>
            <Text style={styles.totalBillValue}>{formatPaise(order.totalAmountPaise)}</Text>
          </View>
        </View>

        {/* Cancel Button if eligible */}
        {canCancel && (
          <TouchableOpacity
            onPress={handleCancelOrder}
            disabled={cancelling}
            style={styles.cancelBtn}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <>
                <XCircle size={18} color="#DC2626" style={{ marginRight: 8 }} />
                <Text style={styles.cancelBtnText}>Cancel Order</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
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
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A'
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#064E3B',
    marginTop: 2
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  etaHeader: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A'
  },
  storeName: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16
  },
  statusBadgeCancelled: {
    backgroundColor: '#FEE2E2'
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#064E3B'
  },
  statusBadgeTextCancelled: {
    color: '#DC2626'
  },
  stepperBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14
  },
  stepperTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 16
  },
  stepsList: {
    gap: 0
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 28,
    marginRight: 12
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  stepCircleDone: {
    backgroundColor: '#064E3B'
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B'
  },
  stepLine: {
    width: 2,
    height: 32,
    backgroundColor: '#E2E8F0',
    marginVertical: 2
  },
  stepLineDone: {
    backgroundColor: '#064E3B'
  },
  stepTextCol: {
    flex: 1,
    paddingTop: 2,
    paddingBottom: 16
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B'
  },
  stepLabelCurrent: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A'
  },
  stepSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2
  },
  cancelledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 14,
    borderRadius: 12
  },
  cancelledTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#DC2626'
  },
  cancelledSub: {
    fontSize: 12,
    color: '#991B1B',
    marginTop: 2
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
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  storeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  },
  cardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  modeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#064E3B',
    marginTop: 4
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14
  },
  receiptTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A'
  },
  itemsList: {
    gap: 12
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  qtyBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A'
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A'
  },
  itemUnitPrice: {
    fontSize: 11,
    color: '#94A3B8'
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A'
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  billLabel: {
    fontSize: 13,
    color: '#64748B'
  },
  billValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A'
  },
  freeBadge: {
    color: '#064E3B',
    fontWeight: '800'
  },
  totalBillRow: {
    paddingTop: 8,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  totalBillLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A'
  },
  totalBillValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#064E3B'
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 6
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626'
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600'
  }
});
