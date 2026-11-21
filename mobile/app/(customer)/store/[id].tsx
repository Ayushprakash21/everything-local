import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Store, Product } from '../../../src/types';
import { request } from '../../../src/api/client';
import { formatPaise, calculateDiscountPct } from '../../../src/utils/format';
import { useCart } from '../../../src/context/CartContext';
import { ArrowLeft, Star, MapPin, Clock, Plus, Check, ShoppingBag, ShieldCheck } from 'lucide-react-native';

export default function StorefrontDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addItem, itemCount } = useCart();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

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

  if (loading || !store) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  const products = store.products || [];
  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  const handleAdd = async (productId: string) => {
    const res = await addItem(store.id, productId, 1);
    if (res.success) {
      setAddedIds((prev) => ({ ...prev, [productId]: true }));
      setTimeout(() => setAddedIds((prev) => ({ ...prev, [productId]: false })), 1200);
    } else if (res.conflictMessage) {
      alert(res.conflictMessage);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{store.name}</Text>
        <TouchableOpacity onPress={() => router.push('/(customer)/cart')} style={styles.cartBtn}>
          <ShoppingBag size={20} color="#059669" />
          {itemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Store Information Card */}
            <View style={styles.storeHeroCard}>
              <View style={styles.categoryBadgeRow}>
                <Text style={styles.categoryBadge}>{store.category.toUpperCase()}</Text>
                <View style={styles.verifiedBadge}>
                  <ShieldCheck size={12} color="#059669" />
                  <Text style={styles.verifiedText}>Verified Local Merchant</Text>
                </View>
              </View>

              <Text style={styles.storeName}>{store.name}</Text>
              {store.description && <Text style={styles.storeDesc}>{store.description}</Text>}

              <View style={styles.infoRow}>
                <MapPin size={14} color="#059669" />
                <Text style={styles.infoText}>{store.addressLine}, {store.city}</Text>
              </View>

              <View style={styles.infoRow}>
                <Clock size={14} color="#94a3b8" />
                <Text style={styles.infoText}>Open Today: 8:00 AM - 10:00 PM</Text>
              </View>

              <View style={styles.pillsRow}>
                <View style={styles.ratingBox}>
                  <Star size={12} color="#f59e0b" fill="#f59e0b" />
                  <Text style={styles.ratingText}>4.8 (120+ reviews)</Text>
                </View>
                <Text style={styles.radiusPill}>Radius: {store.serviceRadiusKm} km</Text>
                <Text style={styles.pickupPill}>Pickup ₹0 FREE</Text>
              </View>
            </View>

            {/* Category Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
                >
                  <Text style={[styles.catChipText, selectedCategory === cat && styles.catChipTextActive]}>
                    {cat === 'all' ? 'All Items' : cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.catalogueTitle}>
              Store Catalogue ({filteredProducts.length} items)
            </Text>
          </>
        }
        renderItem={({ item }) => {
          const discountPct = calculateDiscountPct(item.mrpPaise, item.pricePaise);
          const isAdded = addedIds[item.id];

          return (
            <View style={styles.productCard}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <View style={styles.prodMetaRow}>
                  <Text style={styles.prodCategory}>{item.category.toUpperCase()}</Text>
                  {discountPct > 0 && (
                    <Text style={styles.discountBadge}>{discountPct}% OFF</Text>
                  )}
                </View>

                <Text style={styles.prodTitle}>{item.name}</Text>
                {item.description && (
                  <Text style={styles.prodDescription} numberOfLines={2}>{item.description}</Text>
                )}

                <View style={styles.priceRow}>
                  <Text style={styles.sellingPrice}>{formatPaise(item.pricePaise)}</Text>
                  {item.mrpPaise > item.pricePaise && (
                    <Text style={styles.mrpPrice}>{formatPaise(item.mrpPaise)}</Text>
                  )}
                </View>
              </View>

              <View style={styles.actionCol}>
                <TouchableOpacity
                  onPress={() => handleAdd(item.id)}
                  disabled={!item.isAvailable || item.stock === 0}
                  style={[
                    styles.addButton,
                    isAdded && styles.addButtonSuccess,
                    (!item.isAvailable || item.stock === 0) && styles.addButtonDisabled
                  ]}
                >
                  {isAdded ? (
                    <Check size={16} color="#ffffff" />
                  ) : item.isAvailable && item.stock > 0 ? (
                    <>
                      <Plus size={16} color="#059669" />
                      <Text style={styles.addButtonText}>ADD</Text>
                    </>
                  ) : (
                    <Text style={styles.outOfStockText}>OUT</Text>
                  )}
                </TouchableOpacity>

                {item.stock > 0 && item.stock <= 5 && (
                  <Text style={styles.lowStockText}>{item.stock} left</Text>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
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
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  cartBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#0f172a',
    fontSize: 9,
    fontWeight: '900',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  storeHeroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    gap: 8,
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  storeName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  storeDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  infoText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400e',
  },
  radiusPill: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pickupPill: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  catScroll: {
    gap: 8,
    marginBottom: 16,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  catChipTextActive: {
    color: '#ffffff',
  },
  catalogueTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prodMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  prodCategory: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
  },
  discountBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#b45309',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  prodTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  prodDescription: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 15,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  sellingPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  mrpPrice: {
    fontSize: 11,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  actionCol: {
    alignItems: 'center',
    gap: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addButtonSuccess: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  addButtonDisabled: {
    borderColor: '#cbd5e1',
    backgroundColor: '#f1f5f9',
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  outOfStockText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
  },
  lowStockText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b45309',
  },
});
