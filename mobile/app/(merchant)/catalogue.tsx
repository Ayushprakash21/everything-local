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
import { Product } from '../../src/types';
import { request } from '../../src/api/client';
import { formatPaise } from '../../src/utils/format';
import { Plus, Minus, PlusCircle, Check, X } from 'lucide-react-native';

export default function MerchantCatalogueScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await request<{ products: Product[] }>('/merchant/products');
      setProducts(res.products);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const updateStock = async (productId: string, newStock: number) => {
    try {
      await request(`/merchant/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ stock: Math.max(0, newStock) })
      });
      fetchProducts();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleAvailability = async (productId: string, current: boolean) => {
    try {
      await request(`/merchant/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ isAvailable: !current })
      });
      fetchProducts();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Inventory & Pricing</Text>
          <Text style={styles.headerSub}>{products.length} products listed in your store</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(merchant)/product/add')}
          style={styles.addBtn}
        >
          <Plus size={16} color="#ffffff" />
          <Text style={styles.addBtnText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.catText}>{item.category.toUpperCase()}</Text>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.price}>{formatPaise(item.pricePaise)}</Text>
              </View>

              <View style={styles.controlsCol}>
                {/* Stock +/- Stepper */}
                <View style={styles.stepper}>
                  <TouchableOpacity
                    onPress={() => updateStock(item.id, item.stock - 1)}
                    style={styles.stepBtn}
                  >
                    <Minus size={12} color="#0f172a" />
                  </TouchableOpacity>

                  <Text style={styles.stockCount}>{item.stock}</Text>

                  <TouchableOpacity
                    onPress={() => updateStock(item.id, item.stock + 1)}
                    style={styles.stepBtn}
                  >
                    <Plus size={12} color="#0f172a" />
                  </TouchableOpacity>
                </View>

                {/* Availability Toggle */}
                <TouchableOpacity
                  onPress={() => toggleAvailability(item.id, item.isAvailable)}
                  style={[
                    styles.availBtn,
                    item.isAvailable && item.stock > 0 ? styles.availBtnIn : styles.availBtnOut
                  ]}
                >
                  <Text style={[
                    styles.availBtnText,
                    item.isAvailable && item.stock > 0 ? styles.availTextIn : styles.availTextOut
                  ]}>
                    {item.isAvailable && item.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '900',
    color: '#059669',
  },
  controlsCol: {
    alignItems: 'flex-end',
    gap: 8,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 2,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockCount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    paddingHorizontal: 10,
  },
  availBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  availBtnIn: {
    backgroundColor: '#ecfdf5',
  },
  availBtnOut: {
    backgroundColor: '#fef2f2',
  },
  availBtnText: {
    fontSize: 10,
    fontWeight: '800',
  },
  availTextIn: {
    color: '#059669',
  },
  availTextOut: {
    color: '#ef4444',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
