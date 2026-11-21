import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Order } from '../../../src/types';
import { request } from '../../../src/api/client';
import { formatPaise } from '../../../src/utils/format';
import { ArrowLeft, CheckCircle2, Clock, MapPin, Store, XCircle, RefreshCw } from 'lucide-react-native';

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
      console.error(e);
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
      'Are you sure you want to cancel this order? Any reserved items will be re-released to the store.',
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
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  const steps = [
    { key: 'PLACED', label: 'Order Placed', sub: 'Sent to merchant' },
    { key: 'ACCEPTED', label: 'Accepted', sub: 'Stock confirmed' },
    { key: 'PREPARING', label: 'Preparing', sub: 'Packing your order' },
    {
      key: order.fulfillmentMode === 'PICKUP' ? 'READY_FOR_PICKUP' : 'OUT_FOR_DELIVERY',
      label: order.fulfillmentMode === 'PICKUP' ? 'Ready for Pickup' : 'Out for Delivery',
      sub: order.fulfillmentMode === 'PICKUP' ? 'Counter ready' : 'Rider dispatched'
    },
    {
      key: order.fulfillmentMode === 'PICKUP' ? 'COLLECTED' : 'DELIVERED',
      label: order.fulfillmentMode === 'PICKUP' ? 'Collected' : 'Delivered',
      sub: 'Completed'
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Tracking</Text>
        <TouchableOpacity onPress={fetchOrder} style={styles.refreshBtn}>
          <RefreshCw size={18} color="#059669" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.orderNum}>{order.orderNumber}</Text>
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
              <Text style={styles.stepperTitle}>LIVE ORDER PROGRESSION</Text>
              <View style={styles.stepsList}>
                {steps.map((st, idx) => {
                  const isDone = currentStep >= idx;
                  const isCurrent = currentStep === idx;

                  return (
                    <View key={st.key} style={styles.stepRow}>
                      <View style={styles.stepIndicatorCol}>
                        <View style={[styles.stepCircle, isDone && styles.stepCircleDone]}>
                          {isDone ? (
                            <CheckCircle2 size={16} color="#ffffff" />
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
              <XCircle size={24} color="#ef4444" />
              <View style={{ flex: 1 }}>
                <Text style={styles.cancelledTitle}>Order Cancelled</Text>
                <Text style={styles.cancelledSub}>
                  This order has been cancelled and inventory released.
                </Text>
              </View>
            </View>
          )}

          {/* Cancel button if order is in PLACED status */}
          {order.status === 'PLACED' && (
            <TouchableOpacity
              onPress={handleCancelOrder}
              disabled={cancelling}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Itemized Invoice */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Itemized Invoice</Text>
          <View style={styles.itemsList}>
            {order.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemName} numberOfLines={1}>{item.productName} x {item.quantity}</Text>
                <Text style={styles.itemTotal}>{formatPaise(item.totalPricePaise)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.breakdownBox}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Subtotal</Text>
              <Text style={styles.billVal}>{formatPaise(order.itemSubtotalPaise)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Fulfillment Fee ({order.fulfillmentMode})</Text>
              <Text style={styles.billVal}>{formatPaise(order.deliveryFeePaise)}</Text>
            </View>
            <View style={[styles.billRow, styles.totalBillRow]}>
              <Text style={styles.totalLabel}>Total Paid</Text>
              <Text style={styles.totalVal}>{formatPaise(order.totalAmountPaise)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
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
    paddingBottom: 40,
    gap: 16,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 14,
  },
  orderNum: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusBadgeCancelled: {
    backgroundColor: '#fef2f2',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400e',
    textTransform: 'uppercase',
  },
  statusBadgeTextCancelled: {
    color: '#b91c1c',
  },
  stepperBox: {
    gap: 12,
  },
  stepperTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  stepsList: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 14,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 28,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleDone: {
    backgroundColor: '#059669',
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  stepLine: {
    width: 2,
    height: 28,
    backgroundColor: '#e2e8f0',
  },
  stepLineDone: {
    backgroundColor: '#059669',
  },
  stepTextCol: {
    flex: 1,
    paddingTop: 3,
    paddingBottom: 16,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  stepLabelCurrent: {
    color: '#059669',
    fontWeight: '800',
  },
  stepSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  cancelledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fef2f2',
    padding: 14,
    borderRadius: 16,
  },
  cancelledTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b91c1c',
  },
  cancelledSub: {
    fontSize: 11,
    color: '#dc2626',
    marginTop: 2,
  },
  cancelBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff5f5',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  itemTotal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  breakdownBox: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    gap: 6,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  billLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  billVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  totalBillRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  totalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
