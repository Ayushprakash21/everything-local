import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLocation } from '../../src/context/LocationContext';
import { useCart } from '../../src/context/CartContext';
import { Store } from '../../src/types';
import { request } from '../../src/api/client';
import { formatPaise, formatDistance } from '../../src/utils/format';
import { MapPin, Navigation, Star, Clock, Plus, Store as StoreIcon, ShieldCheck, ChevronDown, Check } from 'lucide-react-native';

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { coords, selectedNeighborhood, setSelectedNeighborhood, refreshLocation, isGpsActive } = useLocation();
  const { addItem } = useCart();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Stores' },
    { id: 'grocery', label: 'Kirana & Grocery' },
    { id: 'produce', label: 'Fruits & Veg' },
    { id: 'bakery', label: 'Bakery & Dairy' }
  ];

  const neighborhoods = [
    'Palasia, Indore',
    'Vijay Nagar, Indore',
    'Saket, Indore',
    'Bhawarkua, Indore',
    'Rajwada, Indore',
    'Annapurna, Indore'
  ];

  const fetchStores = async () => {
    try {
      const catParam = selectedCategory !== 'all' ? `&category=${selectedCategory}` : '';
      const res = await request<{ stores: Store[] }>(
        `/customer/stores?lat=${coords.latitude}&lng=${coords.longitude}${catParam}`
      );
      setStores(res.stores);
    } catch (e) {
      console.error('Failed to load stores:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [coords, selectedCategory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStores();
  };

  const handleQuickAdd = async (storeId: string, productId: string) => {
    const result = await addItem(storeId, productId, 1);
    if (result.success) {
      setRecentlyAddedId(productId);
      setTimeout(() => setRecentlyAddedId(null), 1200);
    } else if (result.conflictMessage) {
      alert(result.conflictMessage);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Bar with Location Selector */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => setLocationModalVisible(true)}
          style={styles.locationPill}
        >
          <MapPin size={16} color="#059669" />
          <View>
            <Text style={styles.deliveringTo}>Deliver to</Text>
            <View style={styles.locationRow}>
              <Text style={styles.neighborhoodText} numberOfLines={1}>
                {selectedNeighborhood}
              </Text>
              <ChevronDown size={14} color="#64748b" />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={refreshLocation} style={styles.gpsBtn}>
          <Navigation size={18} color={isGpsActive ? '#059669' : '#64748b'} />
        </TouchableOpacity>
      </View>

      {/* Main Stores List */}
      <FlatList
        data={stores}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Hyperlocal Value Banner */}
            <View style={styles.heroBanner}>
              <View style={styles.heroBadge}>
                <ShieldCheck size={14} color="#a7f3d0" />
                <Text style={styles.heroBadgeText}>Indore 3 km Direct Radius</Text>
              </View>
              <Text style={styles.heroTitle}>Shop from your neighbourhood stores.</Text>
              <Text style={styles.heroSub}>
                Pure local Kirana, Bakeries and Fresh Mandi produce.
              </Text>
              <View style={styles.heroStats}>
                <Text style={styles.statPill}>Pickup: ₹0 FREE</Text>
                <Text style={styles.statPill}>Min Order: ₹299</Text>
                <Text style={styles.statPill}>30-min Delivery</Text>
              </View>
            </View>

            {/* Category Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catScroll}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  style={[styles.catPill, selectedCategory === cat.id && styles.catPillActive]}
                >
                  <Text style={[styles.catText, selectedCategory === cat.id && styles.catTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nearby Independent Retailers</Text>
              <Text style={styles.sectionSub}>within 3.0 km of your location</Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.storeCard}>
            <TouchableOpacity
              onPress={() => router.push(`/(customer)/store/${item.id}`)}
              style={styles.storeCardTop}
            >
              <View style={styles.storeHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.storeCategory}>{item.category.toUpperCase()}</Text>
                  <Text style={styles.storeName}>{item.name}</Text>
                  <Text style={styles.storeAddress} numberOfLines={1}>{item.addressLine}</Text>
                </View>

                <View style={styles.ratingBadge}>
                  <Star size={12} color="#f59e0b" fill="#f59e0b" />
                  <Text style={styles.ratingText}>{item.rating || 4.8}</Text>
                </View>
              </View>

              <View style={styles.storeMetaRow}>
                <View style={styles.metaItem}>
                  <MapPin size={12} color="#059669" />
                  <Text style={styles.metaText}>{formatDistance(item.distanceKm)}</Text>
                </View>
                <Text style={styles.metaDot}>•</Text>
                <View style={styles.metaItem}>
                  <Clock size={12} color="#94a3b8" />
                  <Text style={styles.metaText}>15-30 mins</Text>
                </View>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.pickupPill}>Pickup ₹0</Text>
              </View>
            </TouchableOpacity>

            {/* Popular Essentials Sub-List */}
            {item.sampleProducts && item.sampleProducts.length > 0 && (
              <View style={styles.sampleBox}>
                <Text style={styles.sampleTitle}>DAILY ESSENTIALS</Text>
                {item.sampleProducts.slice(0, 3).map((prod) => (
                  <View key={prod.id} style={styles.productRow}>
                    <Text style={styles.prodName} numberOfLines={1}>{prod.name}</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.prodPrice}>{formatPaise(prod.pricePaise)}</Text>
                      <TouchableOpacity
                        onPress={() => handleQuickAdd(item.id, prod.id)}
                        style={[
                          styles.addBtn,
                          recentlyAddedId === prod.id && styles.addBtnSuccess
                        ]}
                      >
                        {recentlyAddedId === prod.id ? (
                          <Check size={12} color="#ffffff" />
                        ) : (
                          <>
                            <Plus size={12} color="#059669" />
                            <Text style={styles.addBtnText}>Add</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <StoreIcon size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Stores in this 3 km Radius</Text>
              <Text style={styles.emptyDesc}>
                Try changing your neighborhood location above to discover Indore stores.
              </Text>
            </View>
          ) : (
            <ActivityIndicator size="large" color="#059669" style={{ marginTop: 40 }} />
          )
        }
      />

      {/* Neighborhood Selection Modal */}
      <Modal
        visible={locationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLocationModalVisible(false)}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Choose Indore Neighborhood</Text>
            <Text style={styles.modalSub}>
              Everything Local connects stores within 3.0 km of your selected area.
            </Text>

            {neighborhoods.map((n) => (
              <TouchableOpacity
                key={n}
                onPress={() => {
                  setSelectedNeighborhood(n);
                  setLocationModalVisible(false);
                }}
                style={[styles.nItem, selectedNeighborhood === n && styles.nItemActive]}
              >
                <MapPin size={16} color={selectedNeighborhood === n ? '#059669' : '#94a3b8'} />
                <Text style={[styles.nText, selectedNeighborhood === n && styles.nTextActive]}>
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  deliveringTo: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  neighborhoodText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  gpsBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroBanner: {
    backgroundColor: '#064e3b',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  heroBadgeText: {
    color: '#a7f3d0',
    fontSize: 11,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  heroSub: {
    color: '#d1fae5',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 14,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  catScroll: {
    gap: 8,
    marginBottom: 20,
  },
  catPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catPillActive: {
    backgroundColor: '#064e3b',
    borderColor: '#064e3b',
  },
  catText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  catTextActive: {
    color: '#ffffff',
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  storeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  storeCardTop: {
    padding: 16,
  },
  storeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  storeCategory: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  storeName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  storeAddress: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400e',
  },
  storeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  metaDot: {
    color: '#cbd5e1',
  },
  pickupPill: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  sampleBox: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
    padding: 14,
    gap: 8,
  },
  sampleTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prodName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
    marginRight: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prodPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addBtnSuccess: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 16,
  },
  nItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  nItemActive: {
    backgroundColor: '#ecfdf5',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderBottomColor: 'transparent',
  },
  nText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  nTextActive: {
    fontWeight: '800',
    color: '#059669',
  },
});
