import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { X, Search, Package, Check } from 'lucide-react-native';
import { request } from '../api/client';
import { ScannedProductData } from './BarcodeScannerModal';

interface CatalogueSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectProduct: (product: ScannedProductData) => void;
}

export const CatalogueSearchModal: React.FC<CatalogueSearchModalProps> = ({
  visible,
  onClose,
  onSelectProduct
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ScannedProductData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    const clean = query.trim();
    if (!clean) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await request<{ results: ScannedProductData[] }>(
        `/merchant/catalogue/search?query=${encodeURIComponent(clean)}`
      );
      setResults(res.results || []);
    } catch (e: any) {
      Alert.alert('Search Error', e.message || 'Unable to query catalogue');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: ScannedProductData) => {
    onSelectProduct(item);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Catalogue Search</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <View style={styles.inputWrapper}>
            <Search size={20} color="#64748B" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by product name or brand (e.g. Parle-G)"
              placeholderTextColor="#94A3B8"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.searchBtnText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Results */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={styles.loadingText}>Searching verified catalogue...</Text>
          </View>
        ) : searched && results.length === 0 ? (
          <View style={styles.centerContainer}>
            <Package size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No catalogue matches found</Text>
            <Text style={styles.emptyText}>
              Try another search term or enter the product details manually.
            </Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item, index) => item.barcode || String(index)}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.card} onPress={() => handleSelect(item)}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.productThumb} resizeMode="contain" />
                ) : (
                  <View style={styles.thumbPlaceholder}>
                    <Package size={24} color="#94A3B8" />
                  </View>
                )}
                <View style={styles.productDetails}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.name || 'Unnamed Product'}
                  </Text>
                  {item.brand && <Text style={styles.productBrand}>Brand: {item.brand}</Text>}
                  <View style={styles.metaRow}>
                    <Text style={styles.categoryBadge}>{item.category || 'Grocery Staples'}</Text>
                    {item.packageSize && <Text style={styles.packageSizeText}>{item.packageSize}</Text>}
                  </View>
                </View>
                <View style={styles.selectIconWrap}>
                  <Check size={18} color="#059669" />
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF'
  },
  closeBtn: {
    padding: 6
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A'
  },
  searchBarContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0
  },
  searchBtn: {
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 10
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#334155',
    marginTop: 16,
    marginBottom: 6
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center'
  },
  listContent: {
    padding: 16
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  productThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F8FAFC'
  },
  thumbPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2
  },
  productBrand: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  categoryBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6
  },
  packageSizeText: {
    fontSize: 12,
    color: '#64748B'
  },
  selectIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center'
  }
});
