import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Store, Order } from '../../src/types';
import { request } from '../../src/api/client';
import { formatPaise } from '../../src/utils/format';
import { NotificationService } from '../../src/utils/notifications';
import {
  Package,
  Check,
  X,
  Clock,
  Store as StoreIcon,
  RefreshCw,
  ShoppingBag,
  Bike
} from 'lucide-react-native';

export default function MerchantDispatchScreen() {
  const router = useRouter();
  const { user, switchRole } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchMerchantData = async () => {
    try {
      const storeRes = await request<{ store: Store }>('/merchant/store');
      setStore(storeRes.store);

      if (storeRes.store) {
        const ordRes = await request<{ orders: Order[] }>('/merchant/orders');
        setOrders(ordRes.orders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMerchantData();
    const interval = setInterval(fetchMerchantData, 5000); // Live order polling
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMerchantData();
  };

  const toggleStoreStatus = async () => {
    if (!store) return;
    try {
      const res = await request<{ store: Store }>('/merchant/store', {
        method: 'PUT',
        body: JSON.stringify({ isOpen: !store.isOpen })
      });
      setStore(res.store);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string, note?: string) => {
    try {
      await request(`/merchant/orders/${orderId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status, note })
      });

      // Notification
      NotificationService.sendLocalNotification(
        `Order Updated: ${status.replace(/_/g, ' ')}`,
        `Order status changed successfully.`
      );

      fetchMerchantData();
    } catch (e: any) {
      Alert.alert('Update Failed', e.message);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return !['DELIVERED', 'COLLECTED', 'CANCELLED', 'REJECTED'].includes(o.status);
    if (statusFilter === 'completed') return ['DELIVERED', 'COLLECTED'].includes(o.status);
    return o.status === statusFilter;
  });

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Merchant Header Bar */}
      <View style={styles.header}>
        <View style={styles.storeHeaderRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <Text style={styles.merchantBadge}>SELLER CONSOLE</Text>
              <Text style={styles.verifiedBadge}>● Verified</Text>
            </View>
            <Text style={styles.storeTitle} numberOfLines={1}>{store?.name || 'My Store'}</Text>
          </View>

          {/* Operating Switch */}
          <TouchableOpacity
            onPress={toggleStoreStatus}
            style={[styles.statusToggle, store?.isOpen ? styles.statusToggleOpen : styles.statusToggleClosed]}
          >
            <Text style={styles.statusToggleText}>
              {store?.isOpen ? '● OPEN' : '○ CLOSED'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filtersRow}>
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active Queue' },
            { id: 'PLACED', label: 'Needs Accept' },
            { id: 'completed', label: 'Fulfilled' }
          ].map((f) => (
            <TouchableOpacity
              key={f.id}
              onPress={() => setStatusFilter(f.id)}
              style={[styles.filterPill, statusFilter === f.id && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, statusFilter === f.id && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.orderNum}>{item.orderNumber}</Text>
                  <Text style={styles.custName}>Customer: {item.customer?.name || 'Customer'}</Text>
                </View>

                <View style={styles.statusPill}>
                  <Text style={styles.statusText}>{item.status.replace(/_/g, ' ')}</Text>
                </View>
              </View>

              <View style={styles.modeRow}>
                {item.fulfillmentMode === 'PICKUP' ? (
                  <StoreIcon size={14} color="#059669" />
                ) : (
                  <Bike size={14} color="#059669" />
                )}
                <Text style={styles.modeText}>Mode: <Text style={{ fontWeight: '800' }}>{item.fulfillmentMode}</Text></Text>
              </View>

              {/* Items List */}
              <View style={styles.itemsBox}>
                {item.items.map((i) => (
                  <View key={i.id} style={styles.itemRow}>
                    <Text style={styles.itemName} numberOfLines={1}>{i.productName} x {i.quantity}</Text>
                    <Text style={styles.itemPrice}>{formatPaise(i.totalPricePaise)}</Text>
                  </View>
                ))}
              </View>

              {/* Financial Earnings */}
              <View style={styles.earningsRow}>
                <Text style={styles.earningsLabel}>Your Net Payable:</Text>
                <Text style={styles.earningsVal}>{formatPaise(item.merchantPayablePaise)}</Text>
              </View>

              {/* Status Action Buttons */}
              <View style={styles.actionsBox}>
                {item.status === 'PLACED' && (
                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      onPress={() => handleUpdateStatus(item.id, 'ACCEPTED')}
                      style={styles.acceptBtn}
                    >
                      <Check size={16} color="#ffffff" />
                      <Text style={styles.acceptBtnText}>Accept Order</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleUpdateStatus(item.id, 'REJECTED', 'Store busy')}
                      style={styles.rejectBtn}
                    >
                      <X size={16} color="#ef4444" />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {item.status === 'ACCEPTED' && (
                  <TouchableOpacity
                    onPress={() => handleUpdateStatus(item.id, 'PREPARING')}
                    style={styles.purpleBtn}
                  >
                    <Text style={styles.actionBtnText}>Mark as Preparing</Text>
                  </TouchableOpacity>
                )}

                {item.status === 'PREPARING' && (
                  <TouchableOpacity
                    onPress={() =>
                      handleUpdateStatus(
                        item.id,
                        item.fulfillmentMode === 'PICKUP' ? 'READY_FOR_PICKUP' : 'OUT_FOR_DELIVERY'
                      )
                    }
                    style={styles.blueBtn}
                  >
                    <Text style={styles.actionBtnText}>
                      {item.fulfillmentMode === 'PICKUP'
                        ? 'Ready for Customer Pickup'
                        : 'Dispatch for Delivery'}
                    </Text>
                  </TouchableOpacity>
                )}

                {(item.status === 'READY_FOR_PICKUP' || item.status === 'OUT_FOR_DELIVERY') && (
                  <TouchableOpacity
                    onPress={() =>
                      handleUpdateStatus(
                        item.id,
                        item.fulfillmentMode === 'PICKUP' ? 'COLLECTED' : 'DELIVERED'
                      )
                    }
                    style={styles.greenBtn}
                  >
                    <Text style={styles.actionBtnText}>
                      {item.fulfillmentMode === 'PICKUP'
                        ? 'Handover Complete (Collected)'
                        : 'Mark as Delivered'}
                    </Text>
                  </TouchableOpacity>
                )}

                {['DELIVERED', 'COLLECTED'].includes(item.status) && (
                  <View style={styles.settledBadge}>
                    <Check size={14} color="#059669" />
                    <Text style={styles.settledText}>Fulfilled & Added to Weekly Settlement</Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.centerBox}>
            <Package size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Orders in this View</Text>
            <Text style={styles.emptySub}>Incoming customer orders in your 3 km zone will alert here.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  storeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  merchantBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  storeTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  statusToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusToggleOpen: {
    backgroundColor: '#059669',
  },
  statusToggleClosed: {
    backgroundColor: '#ef4444',
  },
  statusToggleText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  filterPillActive: {
    backgroundColor: '#059669',
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNum: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  custName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400e',
    textTransform: 'uppercase',
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modeText: {
    fontSize: 11,
    color: '#475569',
  },
  itemsBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 10,
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  earningsLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  earningsVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#059669',
  },
  actionsBox: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: '#059669',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  acceptBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  rejectBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff5f5',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: 14,
  },
  rejectBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
  },
  purpleBtn: {
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  blueBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  greenBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  settledText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 10,
    backgroundColor: '#ffffff',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
});
