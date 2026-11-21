import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Order } from '../../../src/types';
import { request } from '../../../src/api/client';
import { formatPaise } from '../../../src/utils/format';
import { Package, ArrowRight, ArrowLeft } from 'lucide-react-native';

export default function CustomerOrdersHistoryScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await request<{ orders: Order[] }>('/customer/orders');
      setOrders(res.orders);
    } catch (e) {
      console.error(e);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isCompleted = ['DELIVERED', 'COLLECTED'].includes(item.status);
            const isCancelled = item.status === 'CANCELLED' || item.status === 'REJECTED';

            return (
              <TouchableOpacity
                onPress={() => router.push(`/(customer)/orders/${item.id}`)}
                style={styles.card}
              >
                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.orderNumber}>{item.orderNumber}</Text>
                    <Text style={styles.storeName}>{item.store?.name}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      isCompleted && styles.statusCompleted,
                      isCancelled && styles.statusCancelled
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        isCompleted && styles.statusTextCompleted,
                        isCancelled && styles.statusTextCancelled
                      ]}
                    >
                      {item.status.replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>

                <Text style={styles.itemsSummary} numberOfLines={2}>
                  {item.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                </Text>

                <View style={styles.cardBottom}>
                  <Text style={styles.modeText}>Mode: <Text style={{ color: '#0f172a' }}>{item.fulfillmentMode}</Text></Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.totalText}>{formatPaise(item.totalAmountPaise)}</Text>
                    <ArrowRight size={14} color="#059669" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Package size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Orders Yet</Text>
              <Text style={styles.emptySub}>Your neighbourhood order history will appear here.</Text>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  storeName: {
    fontSize: 15,
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
  statusCompleted: {
    backgroundColor: '#ecfdf5',
  },
  statusCancelled: {
    backgroundColor: '#fef2f2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400e',
    textTransform: 'uppercase',
  },
  statusTextCompleted: {
    color: '#047857',
  },
  statusTextCancelled: {
    color: '#b91c1c',
  },
  itemsSummary: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  modeText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  totalText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 8,
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
