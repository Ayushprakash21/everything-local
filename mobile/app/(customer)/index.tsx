import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  FlatList,
  Platform,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLocation } from '../../src/context/LocationContext';
import { useCart } from '../../src/context/CartContext';
import { useAuth } from '../../src/context/AuthContext';
import { Store, Product } from '../../src/types';
import { request } from '../../src/api/client';
import { INDORE_NEIGHBORHOODS } from '../../src/utils/location';
import { formatPaise, formatDistance } from '../../src/utils/format';
import { ProductCard } from '../../src/components/ProductCard';
import { CategoryTile, CategoryData } from '../../src/components/CategoryTile';
import { FloatingCartBar } from '../../src/components/FloatingCartBar';
import { VisualSearchModal } from '../../src/components/VisualSearchModal';
import { SafeImage } from '../../src/components/SafeImage';
import { ELLogo } from '../../src/components/ELLogo';
import {
  MapPin,
  Search,
  Camera,
  Star,
  Clock,
  ChevronDown,
  Navigation,
  ShieldCheck,
  Check,
  Sparkles,
  ArrowRight,
  User as UserIcon,
  Store as StoreIcon,
  Tag
} from 'lucide-react-native';

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { coords, selectedNeighborhood, setSelectedNeighborhood, refreshLocation, isGpsActive } = useLocation();
  const { addItem, cart } = useCart();
  const { user } = useAuth();

  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [visualSearchVisible, setVisualSearchVisible] = useState(false);
  const [activePromoIndex, setActivePromoIndex] = useState(0);

  const categories: CategoryData[] = [
    { id: 'all', label: 'All Items', icon: '🛒', bgColor: '#FEF3C7', accentColor: '#D97706' },
    { id: 'produce', label: 'Fruits & Veg', icon: '🥬', bgColor: '#DCFCE7', accentColor: '#059669' },
    { id: 'bakery', label: 'Dairy & Bread', icon: '🥛', bgColor: '#FEF9C3', accentColor: '#CA8A04' },
    { id: 'snacks', label: 'Snacks', icon: '🍟', bgColor: '#FCE7F3', accentColor: '#DB2777' },
    { id: 'grocery', label: 'Atta & Dal', icon: '🌾', bgColor: '#FFEDD5', accentColor: '#EA580C' },
    { id: 'drinks', label: 'Drinks & Juices', icon: '🧃', bgColor: '#E0F2FE', accentColor: '#0284C7' },
    { id: 'medicines', label: 'Pharmacy', icon: '💊', bgColor: '#E0E7FF', accentColor: '#4F46E5' },
    { id: 'personal_care', label: 'Personal Care', icon: '🧴', bgColor: '#F3E8FF', accentColor: '#9333EA' },
    { id: 'household', label: 'Home Clean', icon: '🧹', bgColor: '#ECFDF5', accentColor: '#059669' },
    { id: 'meat', label: 'Meat & Fish', icon: '🍗', bgColor: '#FFE4E6', accentColor: '#E11D48' },
    { id: 'sweet_tooth', label: 'Chocolates', icon: '🍫', bgColor: '#FEF3C7', accentColor: '#B45309' },
    { id: 'pet_supplies', label: 'Pet Care', icon: '🐾', bgColor: '#F1F5F9', accentColor: '#475569' }
  ];

  const [locationSearch, setLocationSearch] = useState('');

  const allNeighborhoods = useMemo(() => {
    return Object.values(INDORE_NEIGHBORHOODS).map((n) => n.neighborhood);
  }, []);

  const filteredNeighborhoods = useMemo(() => {
    if (!locationSearch.trim()) return allNeighborhoods;
    const q = locationSearch.toLowerCase().trim();
    return allNeighborhoods.filter((n) => n.toLowerCase().includes(q));
  }, [allNeighborhoods, locationSearch]);

  const promoBanners = [
    {
      badge: 'EVERYDAY ESSENTIALS',
      title: 'Fresh Vegetables & Kirana',
      subtitle: 'Direct from neighborhood shops in 15-20 min',
      code: 'FREE DELIVERY > ₹299',
      bgColor: '#064e3b',
      accentColor: '#f59e0b'
    },
    {
      badge: 'LOCAL OFFERS',
      title: 'Flat 15% OFF on Dairy & Bakery',
      subtitle: 'Fresh milk, artisanal breads and organic eggs',
      code: 'USE CODE: LOCAL15',
      bgColor: '#d97706',
      accentColor: '#fef3c7'
    },
    {
      badge: 'COMMUNITY STORES',
      title: 'Support Your Local Kirana',
      subtitle: 'Genuine MRP pricing, verified local merchants',
      code: '3 KM DIRECT RADIUS',
      bgColor: '#0f172a',
      accentColor: '#10b981'
    }
  ];

  const fetchStores = async () => {
    try {
      const catParam = selectedCategory !== 'all' ? `&category=${selectedCategory}` : '';
      const res = await request<{ stores: Store[] }>(
        `/customer/stores?lat=${coords.latitude}&lng=${coords.longitude}${catParam}`
      );
      setStores(res.stores || []);
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

  // Extract products across stores for Blinkit-style discovery carousels
  const allProducts = useMemo(() => {
    const list: Product[] = [];
    stores.forEach((store) => {
      (store.sampleProducts || []).forEach((prod) => {
        list.push({ ...prod, storeId: store.id, store });
      });
    });
    return list;
  }, [stores]);

  const everydayEssentials = useMemo(() => {
    return allProducts.slice(0, 8);
  }, [allProducts]);

  const fruitsAndVeggies = useMemo(() => {
    const matched = allProducts.filter((p) => p.category === 'produce' || p.category === 'grocery');
    return (matched.length > 0 ? matched : allProducts).slice(0, 8);
  }, [allProducts]);

  const specialOffers = useMemo(() => {
    return allProducts.filter((p) => p.mrpPaise > p.pricePaise).slice(0, 8);
  }, [allProducts]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Top Blinkit-Style Brand & Location Header */}
      <View style={styles.topHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <ELLogo variant="dark" size={38} style={{ marginRight: 10 }} />
          <View style={styles.headerLeft}>
            <View style={styles.deliveryBadge}>
              <Clock size={12} color="#064e3b" strokeWidth={2.5} />
              <Text style={styles.deliveryBadgeText}>delivery in 15 minutes</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setLocationModalVisible(true)}
              style={styles.locationSelector}
            >
              <MapPin size={15} color="#047857" />
              <Text style={styles.locationName} numberOfLines={1}>
                {selectedNeighborhood}
              </Text>
              <ChevronDown size={14} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={refreshLocation}
            style={[styles.headerBtn, isGpsActive && styles.headerBtnActive]}
          >
            <Navigation size={16} color={isGpsActive ? '#047857' : '#64748b'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(customer)/profile')}
            style={styles.avatarBtn}
          >
            <UserIcon size={18} color="#064e3b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Large Rounded Search Bar with Visual & Voice Shortcuts */}
      <View style={styles.searchBarWrapper}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/(customer)/search')}
          style={styles.searchBar}
        >
          <Search size={18} color="#94a3b8" />
          <Text style={styles.searchPlaceholder} numberOfLines={1}>
            Search "milk, atta, banana, chips..."
          </Text>
          <View style={styles.searchShortcuts}>
            <TouchableOpacity
              onPress={() => setVisualSearchVisible(true)}
              style={styles.shortcutBtn}
            >
              <Camera size={18} color="#047857" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>

      {/* Scrollable Commerce Feeds */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#047857']} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Promotional Campaign Banner Carousel */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / (e.nativeEvent.layoutMeasurement.width || 1));
            setActivePromoIndex(index);
          }}
          style={styles.promoCarousel}
        >
          {promoBanners.map((promo, idx) => (
            <View key={idx} style={[styles.promoCard, { backgroundColor: promo.bgColor }]}>
              <View style={styles.promoBadge}>
                <Sparkles size={11} color="#0f172a" />
                <Text style={styles.promoBadgeText}>{promo.badge}</Text>
              </View>
              <Text style={styles.promoTitle}>{promo.title}</Text>
              <Text style={styles.promoSubtitle}>{promo.subtitle}</Text>
              <View style={styles.promoCodeRow}>
                <Tag size={13} color={promo.accentColor} />
                <Text style={[styles.promoCodeText, { color: promo.accentColor }]}>{promo.code}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Promo Indicators */}
        <View style={styles.indicatorRow}>
          {promoBanners.map((_, i) => (
            <View
              key={i}
              style={[styles.indicatorDot, activePromoIndex === i && styles.indicatorDotActive]}
            />
          ))}
        </View>

        {/* Category Discovery Grid (Blinkit 4x3 style) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <TouchableOpacity onPress={() => router.push('/(customer)/search')}>
            <Text style={styles.sectionAction}>View all ➔</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          {categories.map((cat) => (
            <CategoryTile
              key={cat.id}
              category={cat}
              isSelected={selectedCategory === cat.id}
              onPress={() => setSelectedCategory(cat.id === selectedCategory ? 'all' : cat.id)}
            />
          ))}
        </ScrollView>

        {/* Everyday Essentials Horizontal Carousel */}
        {everydayEssentials.length > 0 && (
          <View style={styles.carouselSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Everyday Essentials</Text>
                <Text style={styles.sectionSubtitle}>Daily household staples delivered fast</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productCarouselRow}
            >
              {everydayEssentials.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  onPress={() => item.storeId && router.push(`/(customer)/store/${item.storeId}`)}
                  width={150}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Best Offers & Deals Section */}
        {specialOffers.length > 0 && (
          <View style={styles.carouselSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Best Offers Near You</Text>
                <Text style={styles.sectionSubtitle}>Save big on neighborhood discounts</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productCarouselRow}
            >
              {specialOffers.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  onPress={() => item.storeId && router.push(`/(customer)/store/${item.storeId}`)}
                  width={150}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Fruits & Vegetables Carousel */}
        {fruitsAndVeggies.length > 0 && (
          <View style={styles.carouselSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Fresh Fruits & Vegetables</Text>
                <Text style={styles.sectionSubtitle}>Farm-fresh produce sourced daily</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productCarouselRow}
            >
              {fruitsAndVeggies.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  onPress={() => item.storeId && router.push(`/(customer)/store/${item.storeId}`)}
                  width={150}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Popular Neighbourhood Stores */}
        <View style={styles.storesSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Neighborhood Stores ({stores.length})</Text>
              <Text style={styles.sectionSubtitle}>Local merchants within 3.0 km</Text>
            </View>
          </View>

          {stores.map((store) => (
            <TouchableOpacity
              key={store.id}
              activeOpacity={0.88}
              onPress={() => router.push(`/(customer)/store/${store.id}`)}
              style={styles.storeCard}
            >
              <View style={styles.storeCardHeader}>
                <View style={styles.storeLogoBox}>
                  <StoreIcon size={24} color="#047857" />
                </View>
                <View style={styles.storeInfo}>
                  <View style={styles.storeNameRow}>
                    <Text style={styles.storeName} numberOfLines={1}>{store.name}</Text>
                    {store.isVerified && (
                      <ShieldCheck size={16} color="#047857" style={{ marginLeft: 4 }} />
                    )}
                  </View>
                  <Text style={styles.storeCategory} numberOfLines={1}>
                    {store.category.toUpperCase()} • {store.addressLine}
                  </Text>
                </View>
                <View style={styles.ratingBadge}>
                  <Star size={12} color="#d97706" fill="#d97706" />
                  <Text style={styles.ratingText}>{store.rating || 4.8}</Text>
                </View>
              </View>

              <View style={styles.storeMetaRow}>
                <View style={styles.metaItem}>
                  <Clock size={13} color="#047857" />
                  <Text style={styles.metaText}>15-20 min</Text>
                </View>
                <Text style={styles.metaDivider}>•</Text>
                <View style={styles.metaItem}>
                  <MapPin size={13} color="#64748b" />
                  <Text style={styles.metaText}>{formatDistance(store.distanceKm || 1.2)}</Text>
                </View>
                <Text style={styles.metaDivider}>•</Text>
                <View style={styles.metaItem}>
                  <Text style={styles.freeDelText}>Free delivery &gt; ₹299</Text>
                </View>
              </View>

              {/* Sample Product Chips */}
              {store.sampleProducts && store.sampleProducts.length > 0 && (
                <View style={styles.sampleChipsRow}>
                  {store.sampleProducts.slice(0, 3).map((prod) => (
                    <View key={prod.id} style={styles.sampleChip}>
                      <Text style={styles.sampleChipText} numberOfLines={1}>
                        {prod.name} ({formatPaise(prod.pricePaise)})
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Persistent Floating Cart Bar */}
      <FloatingCartBar />

      {/* Location Picker Modal */}
      <Modal
        visible={locationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLocationModalVisible(false)}
        >
          <View style={styles.locationModal}>
            <View style={styles.modalDragHandle} />
            <Text style={styles.modalTitle}>Choose Delivery Location</Text>
            <Text style={styles.modalSubtitle}>Currently serving Indore neighbourhoods within 3 km</Text>

            <FlatList
              data={filteredNeighborhoods}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = selectedNeighborhood === item;
                return (
                  <TouchableOpacity
                    style={[styles.neighborhoodOption, isSelected && styles.neighborhoodOptionSelected]}
                    onPress={() => {
                      setSelectedNeighborhood(item);
                      setLocationModalVisible(false);
                    }}
                  >
                    <View style={styles.neighborhoodLeft}>
                      <MapPin size={18} color={isSelected ? '#047857' : '#64748b'} />
                      <Text style={[styles.neighborhoodName, isSelected && styles.neighborhoodNameSelected]}>
                        {item}
                      </Text>
                    </View>
                    {isSelected && <Check size={18} color="#047857" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Visual Search Modal */}
      <VisualSearchModal
        visible={visualSearchVisible}
        onClose={() => setVisualSearchVisible(false)}
        onSearchResults={(keyword) => {
          setVisualSearchVisible(false);
          router.push({ pathname: '/(customer)/search', params: { q: keyword } });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 12,
    paddingBottom: 10,
    backgroundColor: '#ffffff'
  },
  headerLeft: {
    flex: 1
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4
  },
  deliveryBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#064e3b',
    marginLeft: 4,
    textTransform: 'uppercase'
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  locationName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginHorizontal: 4,
    maxWidth: 220
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  headerBtnActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#047857'
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f59e0b'
  },
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#ffffff'
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500'
  },
  searchShortcuts: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  shortcutBtn: {
    padding: 6
  },
  scrollContent: {
    backgroundColor: '#f8fafc',
    paddingBottom: 24
  },
  promoCarousel: {
    paddingHorizontal: 16,
    marginTop: 12
  },
  promoCard: {
    width: 330,
    borderRadius: 20,
    padding: 18,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  promoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8
  },
  promoBadgeText: {
    color: '#0f172a',
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 4
  },
  promoTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
    marginBottom: 4
  },
  promoSubtitle: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 10
  },
  promoCodeRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  promoCodeText: {
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 5,
    letterSpacing: 0.5
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 3
  },
  indicatorDotActive: {
    width: 18,
    backgroundColor: '#047857'
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a'
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '800',
    color: '#047857'
  },
  categoriesRow: {
    paddingHorizontal: 16,
    paddingBottom: 4
  },
  carouselSection: {
    marginTop: 8
  },
  productCarouselRow: {
    paddingHorizontal: 16,
    gap: 12,
    paddingVertical: 4
  },
  storesSection: {
    marginTop: 12
  },
  storeCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  storeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  storeLogoBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  storeInfo: {
    flex: 1
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  storeName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  storeCategory: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400e',
    marginLeft: 3
  },
  storeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  metaText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    marginLeft: 4
  },
  metaDivider: {
    marginHorizontal: 8,
    color: '#cbd5e1'
  },
  freeDelText: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '700'
  },
  sampleChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10
  },
  sampleChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  sampleChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  locationModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '60%'
  },
  modalDragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a'
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 16
  },
  neighborhoodOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  neighborhoodOptionSelected: {
    backgroundColor: '#ecfdf5',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 10
  },
  neighborhoodLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  neighborhoodName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 10
  },
  neighborhoodNameSelected: {
    color: '#047857',
    fontWeight: '800'
  }
});
