import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  StatusBar
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Store, Product } from '../../../src/types';
import { request } from '../../../src/api/client';
import { formatDistance, formatPaise } from '../../../src/utils/format';
import { useCart } from '../../../src/context/CartContext';
import { ProductCard } from '../../../src/components/ProductCard';
import { FloatingCartBar } from '../../../src/components/FloatingCartBar';
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  Search,
  Store as StoreIcon,
  ShoppingBag,
  Bike,
  CheckCircle2,
  Phone
} from 'lucide-react-native';

export default function StorefrontDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { itemCount } = useCart();

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await request<{ store: Store }>(`/customer/stores/${id}`);
        setStore(res.store);
      } catch (e) {
        console.error('Failed to load store:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [id]);

  const products = store?.products || [];

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchQuery = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  if (loading || !store) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#047857" />
        <Text style={styles.loadingText}>Opening store catalog...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle} numberOfLines={1}>{store.name}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{store.category.toUpperCase()} • Indore</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(customer)/cart')} style={styles.cartBtn}>
          <ShoppingBag size={20} color="#064e3b" />
          {itemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Store Banner Hero Card */}
        <View style={styles.storeHeroCard}>
          <View style={styles.storeTitleRow}>
            <View style={styles.storeLogoBox}>
              <StoreIcon size={28} color="#047857" />
            </View>
            <View style={styles.storeMainInfo}>
              <View style={styles.nameVerifiedRow}>
                <Text style={styles.storeMainName} numberOfLines={1}>{store.name}</Text>
                {store.isVerified && (
                  <ShieldCheck size={18} color="#047857" style={{ marginLeft: 4 }} />
                )}
              </View>
              <Text style={styles.storeAddressText} numberOfLines={1}>
                {store.addressLine}, {store.city} {store.pincode}
              </Text>
            </View>
          </View>

          {/* Quick Metrics Bar */}
          <View style={styles.metricsBar}>
            <View style={styles.metricItem}>
              <View style={styles.ratingChip}>
                <Star size={12} color="#d97706" fill="#d97706" />
                <Text style={styles.ratingValue}>{store.rating || 4.8}</Text>
              </View>
              <Text style={styles.metricLabel}>{store.reviewCount || 24} ratings</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <View style={styles.metricIconRow}>
                <Clock size={13} color="#047857" />
                <Text style={styles.metricValue}>15-20 min</Text>
              </View>
              <Text style={styles.metricLabel}>Delivery ETA</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <View style={styles.metricIconRow}>
                <MapPin size={13} color="#64748b" />
                <Text style={styles.metricValue}>{formatDistance(store.distanceKm || 1.1)}</Text>
              </View>
              <Text style={styles.metricLabel}>Distance</Text>
            </View>
          </View>

          {/* Fulfilment & Guarantee Badge */}
          <View style={styles.guaranteeRow}>
            <View style={styles.guaranteeItem}>
              <CheckCircle2 size={14} color="#047857" />
              <Text style={styles.guaranteeText}>Free pickup available</Text>
            </View>
            <View style={styles.guaranteeItem}>
              <Bike size={14} color="#047857" />
              <Text style={styles.guaranteeText}>Direct doorstep delivery</Text>
            </View>
          </View>
        </View>

        {/* In-Store Search Bar */}
        <View style={styles.searchWrapper}>
          <View style={styles.storeSearchBar}>
            <Search size={16} color="#94a3b8" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={`Search items in ${store.name}...`}
              placeholderTextColor="#94a3b8"
              style={styles.storeSearchInput}
            />
          </View>
        </View>

        {/* Category Pills Navigation */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsRow}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                activeOpacity={0.8}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.catPill, isSelected && styles.catPillSelected]}
              >
                <Text style={[styles.catPillText, isSelected && styles.catPillTextSelected]}>
                  {cat === 'all' ? 'All Products' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Products Grid */}
        <View style={styles.productsSection}>
          <Text style={styles.resultsCount}>
            {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'} available
          </Text>

          {filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <ShoppingBag size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No matching products</Text>
              <Text style={styles.emptySubtitle}>Try searching for another item or category</Text>
            </View>
          ) : (
            <View style={styles.productGrid}>
              {filteredProducts.map((product) => (
                <View key={product.id} style={styles.gridItem}>
                  <ProductCard
                    product={product}
                    storeId={store.id}
                    width={166}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Persistent Floating Cart */}
      <FloatingCartBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 12,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitleBox: {
    flex: 1,
    marginHorizontal: 12
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a'
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857'
  },
  cartBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#047857',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900'
  },
  scrollContent: {
    backgroundColor: '#f8fafc'
  },
  storeHeroCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2
  },
  storeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  storeLogoBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  storeMainInfo: {
    flex: 1
  },
  nameVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  storeMainName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a'
  },
  storeAddressText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2
  },
  metricsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingVertical: 10,
    marginTop: 14
  },
  metricItem: {
    alignItems: 'center'
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  ratingValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#92400e',
    marginLeft: 3
  },
  metricIconRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginLeft: 4
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0'
  },
  guaranteeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  guaranteeItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  guaranteeText: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '700',
    marginLeft: 4
  },
  searchWrapper: {
    paddingHorizontal: 16,
    marginBottom: 10
  },
  storeSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  storeSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '500'
  },
  categoryPillsRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8
  },
  catPill: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  catPillSelected: {
    backgroundColor: '#064e3b',
    borderColor: '#064e3b'
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569'
  },
  catPillTextSelected: {
    color: '#ffffff'
  },
  productsSection: {
    paddingHorizontal: 16,
    marginTop: 8
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 12
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  gridItem: {
    marginBottom: 12
  },
  emptyState: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 10
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4
  }
});
