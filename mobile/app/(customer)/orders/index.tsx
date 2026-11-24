import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Order } from '../../../src/types';
import { request } from '../../../src/api/client';
import { formatPaise } from '../../../src/utils/format';
import {
  Package,
  ArrowRight,
  ArrowLeft,
  Store,
  Clock,
  CheckCircle2,
  XCircle,
  Truck
} from 'lucide-react-native';

export default function CustomerOrdersHistoryScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await request<{ orders: Order[] }>('/customer/orders');
      setOrders(res.orders || []);
    } catch (e) {
      console.error('Failed to load orders:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
      case 'COLLECTED':
        return { bg: '#DCFCE7', text: '#064E3B', label: 'Delivered', icon: CheckCircle2 };
      case 'OUT_FOR_DELIVERY':
      case 'READY_FOR_PICKUP':
        return { bg: '#FEF3C7', text: '#B45309', label: status.replace(/_/g, ' '), icon: Truck };
      case 'PREPARING':
      case 'ACCEPTED':
        return { bg: '#E0F2FE', text: '#0369A1', label: 'Preparing', icon: Clock };
      case 'CANCELLED':
      case 'REJECTED':
        return { bg: '#FEE2E2', text: '#B91C1C', label: 'Cancelled', icon: XCircle };
      default:
        return { bg: '#F1F5F9', text: '#475569', label: status.replace(/_/g, ' '), icon: Clock };
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Orders</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#064E3B" />
          <Text style={styles.loadingText}>Fetching order history...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#064E3B']} />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const statusConfig = getStatusBadge(item.status);
            const StatusIcon = statusConfig.icon;
            const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'Recent';

            return (
              <TouchableOpacity
                onPress={() => router.push(`/(customer)/orders/${item.id}`)}
                style={styles.orderCard}
                activeOpacity={0.7}
              >
                <View style={styles.cardTop}>
                  <View style={styles.storeRow}>
                    <View style={styles.storeIconBox}>
                      <Store size={18} color="#064E3B" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.storeName}>{item.store?.name || 'Local Store'}</Text>
                      <Text style={styles.orderNumber}>#{item.orderNumber} • {dateStr}</Text>
                    </View>
                  </View>

                  <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
                    <StatusIcon size={12} color={statusConfig.text} style={{ marginRight: 4 }} />
                    <Text style={[styles.statusPillText, { color: statusConfig.text }]}>
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>

                {/* Items Summary */}
                <View style={styles.itemsSummary}>
                  <Text style={styles.itemsText} numberOfLines={2}>
                    {item.items?.map((it) => `${it.productName || it.product?.name || 'Item'} (${it.quantity})`).join(', ') || 'Grocery essentials'}
                  </Text>
                </View>

                <View style={styles.cardBottom}>
                  <View>
                    <Text style={styles.amountLabel}>Total Paid</Text>
                    <Text style={styles.amountValue}>{formatPaise(item.totalAmountPaise)}</Text>
                  </View>

                  <View style={styles.trackBtn}>
                    <Text style={styles.trackBtnText}>Track Order</Text>
                    <ArrowRight size={14} color="#064E3B" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Package size={52} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Orders Yet</Text>
              <Text style={styles.emptySub}>
                When you order groceries and essentials from your local stores, they will appear here.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(customer)')}
                style={styles.shopNowBtn}
              >
                <Text style={styles.shopNowText}>Start Shopping</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
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
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A'
  },
  listContent: {
    padding: 16,
    paddingBottom: 40
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8
  },
  storeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center'
  },
  storeName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  },
  orderNumber: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800'
  },
  itemsSummary: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12
  },
  itemsText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8'
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A'
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4
  },
  trackBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#064E3B'
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
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 16
  },
  emptySub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20
  },
  shopNowBtn: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20
  },
  shopNowText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF'
  }
});
