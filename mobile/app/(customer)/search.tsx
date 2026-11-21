import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useLocation } from '../../src/context/LocationContext';
import { useCart } from '../../src/context/CartContext';
import { Product } from '../../src/types';
import { request } from '../../src/api/client';
import { formatPaise, formatDistance } from '../../src/utils/format';
import { VisualSearchModal } from '../../src/components/VisualSearchModal';
import { Search, Camera, Plus, Check, Store as StoreIcon, Sparkles } from 'lucide-react-native';

export default function CustomerSearchScreen() {
  const { coords } = useLocation();
  const { addItem } = useCart();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showVisualModal, setShowVisualModal] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setProducts([]);
      return;
    }

    setLoading(true);
    try {
      const res = await request<{ products: any[] }>(
        `/customer/products/search?q=${encodeURIComponent(text.trim())}&lat=${coords.latitude}&lng=${coords.longitude}`
      );
      setProducts(res.products);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVisualResult = (detectedKeyword: string) => {
    setQuery(detectedKeyword);
    handleSearch(detectedKeyword);
  };

  const handleAdd = async (storeId: string, productId: string) => {
    const res = await addItem(storeId, productId, 1);
    if (res.success) {
      setAddedIds((prev) => ({ ...prev, [productId]: true }));
      setTimeout(() => setAddedIds((prev) => ({ ...prev, [productId]: false })), 1200);
    } else if (res.conflictMessage) {
      alert(res.conflictMessage);
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Product Search & AI</Text>
        <Text style={styles.headerSub}>Find essentials across 3 km Indore stores</Text>

        <View style={styles.searchBarRow}>
          <View style={styles.searchWrapper}>
            <Search size={18} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.input}
              placeholder="Search Atta, Milk, Potatoes, Bread..."
              placeholderTextColor="#94a3b8"
              value={query}
              onChangeText={handleSearch}
              autoCapitalize="none"
              returnKeyType="search"
            />
          </View>

          <TouchableOpacity
            onPress={() => setShowVisualModal(true)}
            style={styles.cameraBtn}
            accessibilityLabel="Search by image or camera"
          >
            <Camera size={20} color="#059669" />
          </TouchableOpacity>
        </View>

        {/* Quick Suggestion Pills */}
        <View style={styles.pillsRow}>
          {['Atta', 'Milk', 'Potatoes', 'Sunflower Oil', 'Butter'].map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => handleSearch(item)}
              style={styles.pill}
            >
              <Text style={styles.pillText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.centerText}>Searching nearby neighborhood stock...</Text>
        </View>
      ) : products.length === 0 && query ? (
        <View style={styles.centerContainer}>
          <StoreIcon size={44} color="#cbd5e1" />
          <Text style={styles.centerTitle}>No products found for "{query}"</Text>
          <Text style={styles.centerText}>Try another keyword or snap a photo of the packet.</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.centerContainer}>
          <Sparkles size={44} color="#cbd5e1" />
          <Text style={styles.centerTitle}>Visual & Text Search</Text>
          <Text style={styles.centerText}>
            Type any item name or tap the camera icon to search by product packaging.
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isAdded = addedIds[item.id];
            return (
              <View style={styles.card}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.storeTag}>{item.store?.name} • {formatDistance(item.distanceKm)}</Text>
                  <Text style={styles.title}>{item.name}</Text>
                  <Text style={styles.price}>{formatPaise(item.pricePaise)}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleAdd(item.storeId, item.id)}
                  style={[styles.addBtn, isAdded && styles.addBtnSuccess]}
                >
                  {isAdded ? (
                    <Check size={16} color="#ffffff" />
                  ) : (
                    <>
                      <Plus size={16} color="#059669" />
                      <Text style={styles.addBtnText}>ADD</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

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
    backgroundColor: '#f8fafc',
  },
  header: {
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
    marginBottom: 12,
  },
  searchBarRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  cameraBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pillText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
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
  storeTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
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
    color: '#0f172a',
  },
  addBtn: {
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
  addBtnSuccess: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 10,
  },
  centerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  centerText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
});
