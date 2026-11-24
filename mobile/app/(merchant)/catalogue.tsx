import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Platform,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Product } from '../../src/types';
import { request } from '../../src/api/client';
import { formatPaise } from '../../src/utils/format';
import { SafeImage } from '../../src/components/SafeImage';
import {
  Plus,
  Minus,
  Search,
  PlusCircle,
  Check,
  X,
  Store,
  ScanBarcode,
  Package,
  AlertTriangle
} from 'lucide-react-native';

export default function MerchantCatalogueScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchProducts = async () => {
    try {
      const res = await request<{ products: Product[] }>('/merchant/products');
      setProducts(res.products || []);
    } catch (e) {
      console.error('Failed to load catalogue:', e);
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
      console.error('Stock update failed:', e);
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
      console.error('Availability toggle failed:', e);
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, categoryFilter]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Store Catalogue</Text>
            <Text style={styles.headerSub}>
              {products.length} products listed • {products.filter((p) => p.isAvailable && p.stock > 0).length} in stock
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(merchant)/product/add')}
            style={styles.addBtn}
          >
            <Plus size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.addBtnText}>Add Item</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your catalogue items..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Pills */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoryPills}
          renderItem={({ item }) => {
            const isSelected = categoryFilter === item;
            return (
              <TouchableOpacity
                onPress={() => setCategoryFilter(item)}
                style={[styles.catPill, isSelected && styles.catPillActive]}
              >
                <Text style={[styles.catPillText, isSelected && styles.catPillTextActive]}>
                  {item === 'all' ? 'All Items' : item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Catalogue List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loadingText}>Loading store inventory...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E3A8A']} />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isLowStock = item.stock <= 5 && item.stock > 0;
            const isOutOfStock = item.stock === 0 || !item.isAvailable;

            return (
              <View style={[styles.productCard, isOutOfStock && styles.productCardOOS]}>
                <View style={styles.thumbWrapper}>
                  <SafeImage
                    uri={item.imageUrl}
                    style={styles.productThumb}
                    resizeMode="contain"
                    fallbackIconSize={24}
                  />
                  {isOutOfStock && (
                    <View style={styles.oosOverlay}>
                      <Text style={styles.oosOverlayText}>OUT OF STOCK</Text>
                    </View>
                  )}
                </View>

                <View style={styles.detailsCol}>
                  <View style={styles.badgeRow}>
                    <Text style={styles.categoryBadge}>{item.category || 'General'}</Text>
                    {isLowStock && (
                      <View style={styles.lowStockBadge}>
                        <AlertTriangle size={10} color="#D97706" />
                        <Text style={styles.lowStockText}>Low Stock ({item.stock})</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                  {item.brand && <Text style={styles.brandName}>{item.brand}</Text>}

                  <View style={styles.priceRow}>
                    <Text style={styles.priceText}>{formatPaise(item.pricePaise)}</Text>
                    {item.mrpPaise > item.pricePaise && (
                      <Text style={styles.mrpText}>{formatPaise(item.mrpPaise)}</Text>
                    )}
                  </View>
                </View>

                {/* Stock Controls */}
                <View style={styles.controlsCol}>
                  <TouchableOpacity
                    onPress={() => toggleAvailability(item.id, item.isAvailable)}
                    style={[
                      styles.availToggle,
                      item.isAvailable ? styles.availToggleOn : styles.availToggleOff
                    ]}
                  >
                    <Text
                      style={[
                        styles.availToggleText,
                        item.isAvailable ? styles.availToggleTextOn : styles.availToggleTextOff
                      ]}
                    >
                      {item.isAvailable ? 'ACTIVE' : 'PAUSED'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.stepperWrapper}>
                    <TouchableOpacity
                      onPress={() => updateStock(item.id, item.stock - 1)}
                      style={styles.stepBtn}
                    >
                      <Minus size={14} color="#0F172A" />
                    </TouchableOpacity>

                    <Text style={styles.stockCount}>{item.stock}</Text>

                    <TouchableOpacity
                      onPress={() => updateStock(item.id, item.stock + 1)}
                      style={styles.stepBtn}
                    >
                      <Plus size={14} color="#0F172A" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Store size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Products Found</Text>
              <Text style={styles.emptySub}>
                Use "Add Item" above to scan a barcode or search the open product catalogue.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(merchant)/product/add')}
                style={styles.addFirstBtn}
              >
                <Plus size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.addFirstBtnText}>Add Your First Product</Text>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    elevation: 2
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A'
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600'
  },
  categoryPills: {
    paddingTop: 10,
    gap: 8
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 6
  },
  catPillActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A'
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B'
  },
  catPillTextActive: {
    color: '#FFFFFF'
  },
  listContent: {
    padding: 16,
    paddingBottom: 40
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2
  },
  productCardOOS: {
    opacity: 0.75,
    backgroundColor: '#FAFAFA'
  },
  thumbWrapper: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    position: 'relative'
  },
  productThumb: {
    width: '100%',
    height: '100%'
  },
  oosOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingVertical: 2,
    alignItems: 'center'
  },
  oosOverlayText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF'
  },
  detailsCol: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: 'center'
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase'
  },
  lowStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2
  },
  lowStockText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309'
  },
  productName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 18
  },
  brandName: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4
  },
  priceText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A'
  },
  mrpText: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through'
  },
  controlsCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between'
  },
  availToggle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  availToggleOn: {
    backgroundColor: '#DCFCE7'
  },
  availToggleOff: {
    backgroundColor: '#F1F5F9'
  },
  availToggleText: {
    fontSize: 10,
    fontWeight: '800'
  },
  availToggleTextOn: {
    color: '#064E3B'
  },
  availToggleTextOff: {
    color: '#64748B'
  },
  stepperWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden'
  },
  stepBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  },
  stockCount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    paddingHorizontal: 8
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 16
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18
  },
  addFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 18
  },
  addFirstBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF'
  }
});
