import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLocation } from '../../src/context/LocationContext';
import { useCart } from '../../src/context/CartContext';
import { Product } from '../../src/types';
import { request } from '../../src/api/client';
import { ProductCard } from '../../src/components/ProductCard';
import { FloatingCartBar } from '../../src/components/FloatingCartBar';
import { VisualSearchModal } from '../../src/components/VisualSearchModal';
import {
  Search as SearchIcon,
  Camera,
  X,
  Sparkles,
  TrendingUp,
  Store as StoreIcon,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react-native';

const TRENDING_KEYWORDS = [
  'Milk',
  'Atta',
  'Amul Butter',
  'Potato',
  'Tomato',
  'Sugar',
  'Sunflower Oil',
  'Bread'
];

const SEARCH_CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'grocery', label: 'Grocery & Staples' },
  { id: 'produce', label: 'Fruits & Veg' },
  { id: 'bakery', label: 'Dairy & Bakery' },
  { id: 'snacks', label: 'Snacks & Munchies' }
];

export default function CustomerSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const { coords } = useLocation();
  const { addItem } = useCart();

  const [query, setQuery] = useState(params.q || '');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showVisualModal, setShowVisualModal] = useState(false);

  const executeSearch = async (text: string, category: string = selectedCategory) => {
    if (!text.trim()) {
      setProducts([]);
      return;
    }

    setLoading(true);
    try {
      const catParam = category !== 'all' ? `&category=${category}` : '';
      const res = await request<{ products: Product[] }>(
        `/customer/products/search?q=${encodeURIComponent(text.trim())}&lat=${coords.latitude}&lng=${coords.longitude}${catParam}`
      );
      setProducts(res.products || []);
    } catch (e) {
      console.error('Search error:', e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.q) {
      setQuery(params.q);
      executeSearch(params.q);
    }
  }, [params.q]);

  const handleTextChange = (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setProducts([]);
    }
  };

  const handleSubmit = () => {
    if (query.trim()) {
      executeSearch(query.trim());
    }
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    if (query.trim()) {
      executeSearch(query.trim(), catId);
    }
  };

  const handleVisualResult = (detectedKeyword: string) => {
    setQuery(detectedKeyword);
    executeSearch(detectedKeyword);
  };

  const handleClear = () => {
    setQuery('');
    setProducts([]);
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Search Products</Text>
          <View style={styles.radiusPill}>
            <Text style={styles.radiusText}>3 km Indore</Text>
          </View>
        </View>

        {/* Search Bar Input */}
        <View style={styles.searchBarWrapper}>
          <SearchIcon size={20} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder='Search "atta, milk, oil, bread..."'
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={handleTextChange}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoFocus={false}
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={handleClear} style={styles.iconBtn}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setShowVisualModal(true)} style={styles.cameraBtn}>
              <Camera size={18} color="#064E3B" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter Chips */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={SEARCH_CATEGORIES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoryFilters}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item.id;
            return (
              <TouchableOpacity
                onPress={() => handleCategorySelect(item.id)}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Content Area */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#064E3B" />
          <Text style={styles.centerText}>Searching live inventory in neighborhood stores...</Text>
        </View>
      ) : products.length > 0 ? (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.resultsGrid}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={({ item }) => <ProductCard product={item} />}
          ListHeaderComponent={
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                Found {products.length} {products.length === 1 ? 'product' : 'products'} for "{query}"
              </Text>
            </View>
          }
        />
      ) : query.trim().length > 0 ? (
        <View style={styles.centerContainer}>
          <StoreIcon size={48} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No products matching "{query}"</Text>
          <Text style={styles.emptySub}>
            Try searching for a general keyword like "Milk", "Atta", or "Rice", or scan packaging.
          </Text>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setShowVisualModal(true)}
          >
            <Camera size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>Scan Packaging with Camera</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.idleContainer}>
          {/* Trending Searches */}
          <View style={styles.sectionHeader}>
            <TrendingUp size={18} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Trending Searches</Text>
          </View>
          <View style={styles.keywordGrid}>
            {TRENDING_KEYWORDS.map((kw) => (
              <TouchableOpacity
                key={kw}
                onPress={() => {
                  setQuery(kw);
                  executeSearch(kw);
                }}
                style={styles.keywordPill}
              >
                <SearchIcon size={14} color="#64748B" style={{ marginRight: 6 }} />
                <Text style={styles.keywordText}>{kw}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Visual AI Banner */}
          <TouchableOpacity
            onPress={() => setShowVisualModal(true)}
            style={styles.visualSearchBanner}
          >
            <View style={styles.visualIconBox}>
              <Sparkles size={24} color="#064E3B" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.visualTitle}>Scan Product Packaging</Text>
              <Text style={styles.visualSub}>
                Take a quick photo of any wrapper or packet to find it instantly in nearby stores.
              </Text>
            </View>
            <ChevronRight size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Bottom Cart Pill */}
      <FloatingCartBar />

      {/* Visual Search Modal */}
      <VisualSearchModal
        visible={showVisualModal}
        onClose={() => setShowVisualModal(false)}
        onSearchResults={handleVisualResult}
      />
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5
  },
  radiusPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20
  },
  radiusText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#064E3B'
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    height: '100%'
  },
  iconBtn: {
    padding: 6
  },
  cameraBtn: {
    backgroundColor: '#E6F4EA',
    padding: 8,
    borderRadius: 10
  },
  categoryFilters: {
    paddingTop: 12,
    gap: 8
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8
  },
  filterChipActive: {
    backgroundColor: '#064E3B',
    borderColor: '#064E3B'
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B'
  },
  filterChipTextActive: {
    color: '#FFFFFF'
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B'
  },
  resultsGrid: {
    paddingHorizontal: 12,
    paddingBottom: 100
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  centerText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center'
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 16,
    textAlign: 'center'
  },
  emptySub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  idleContainer: {
    flex: 1,
    padding: 16
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  },
  keywordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24
  },
  keywordPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1
  },
  keywordText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155'
  },
  visualSearchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  visualIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center'
  },
  visualTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4
  },
  visualSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16
  }
});
