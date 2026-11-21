import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { request } from '../../../src/api/client';
import { uploadProductImage, ingestCatalogueImageUrl } from '../../../src/utils/imageUpload';
import { BarcodeScannerModal, ScannedProductData } from '../../../src/components/BarcodeScannerModal';
import { CatalogueSearchModal } from '../../../src/components/CatalogueSearchModal';
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  Check,
  ScanBarcode,
  Search,
  Sparkles,
  Info,
  RefreshCw,
  Package
} from 'lucide-react-native';

export default function AddProductScreen() {
  const router = useRouter();

  // Product form states
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [barcode, setBarcode] = useState('');
  const [packageSize, setPackageSize] = useState('');
  const [category, setCategory] = useState('Grocery Staples');
  const [mrp, setMrp] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('25');

  // Image storage states
  const [permanentImageUrl, setPermanentImageUrl] = useState<string | null>(null);
  const [catalogueImageUrl, setCatalogueImageUrl] = useState<string | null>(null);
  const [imageLicensingNotice, setImageLicensingNotice] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Catalogue matching metadata
  const [catalogueMatched, setCatalogueMatched] = useState(false);
  const [catalogueSource, setCatalogueSource] = useState<string | null>(null);

  // Modals
  const [scannerVisible, setScannerVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const categories = [
    'Grocery Staples',
    'Dairy & Bakery',
    'Vegetables & Fruits',
    'Edible Oils',
    'Beverages & Snacks'
  ];

  // Handler when barcode scanner or catalogue search selects a product
  const handleProductIdentified = async (product: ScannedProductData) => {
    if (product.barcode) {
      setBarcode(product.barcode);
    }

    if (product.found) {
      setCatalogueMatched(true);
      setCatalogueSource(product.source || 'Open Food Facts');

      if (product.name) setName(product.name);
      if (product.brand) setBrand(product.brand);
      if (product.packageSize) setPackageSize(product.packageSize);
      if (product.category && categories.includes(product.category)) {
        setCategory(product.category);
      }

      if (product.imageUrl) {
        setCatalogueImageUrl(product.imageUrl);
        setImageLicensingNotice(product.licenseNotice || 'Image courtesy of Open Food Facts (ODbL / CC-BY-SA)');
        // Ingest into our storage asynchronously for permanent reliability
        ingestCatalogueImage(product.imageUrl);
      } else {
        setCatalogueImageUrl(null);
        setPermanentImageUrl(null);
      }

      Alert.alert(
        'Product Identified',
        `Matched "${product.name || product.barcode}" from ${product.source || 'catalogue'}. Please set your selling price and available stock.`
      );
    } else {
      setCatalogueMatched(false);
      setCatalogueSource(null);
      Alert.alert(
        'Product Not In External Catalogue',
        `Barcode ${product.barcode} was not found in the external database. You can enter product details and upload a photo manually.`
      );
    }
  };

  // Ingest catalogue image into our backend storage
  const ingestCatalogueImage = async (url: string) => {
    try {
      setUploadingImage(true);
      const storedUrl = await ingestCatalogueImageUrl(url);
      setPermanentImageUrl(storedUrl);
    } catch (e: any) {
      console.warn('Catalogue image ingestion failed, falling back to direct URL:', e.message);
      // Fallback: retain direct external URL
      setPermanentImageUrl(url);
    } finally {
      setUploadingImage(false);
    }
  };

  // Pick photo from device gallery and upload to storage endpoint
  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow gallery access to upload product pictures.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1]
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await uploadDevicePhoto(result.assets[0].uri);
    }
  };

  // Take photo with device camera and upload to storage endpoint
  const handleTakeCameraPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access to take product photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1]
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await uploadDevicePhoto(result.assets[0].uri);
    }
  };

  // Upload local file URI to server /api/upload/image
  const uploadDevicePhoto = async (localUri: string) => {
    setUploadingImage(true);
    try {
      const permanentUrl = await uploadProductImage(localUri);
      setPermanentImageUrl(permanentUrl);
      setCatalogueImageUrl(null);
      setImageLicensingNotice('Merchant uploaded original photograph');
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Could not upload image to storage service. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Final confirmation and product save
  const handleSaveProduct = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Field', 'Please enter a product title.');
      return;
    }
    if (!mrp || isNaN(parseFloat(mrp))) {
      Alert.alert('Missing Field', 'Please enter a valid MRP in rupees.');
      return;
    }
    if (!price || isNaN(parseFloat(price))) {
      Alert.alert('Missing Field', 'Please enter a valid selling price in rupees.');
      return;
    }

    const mrpPaise = Math.round(parseFloat(mrp) * 100);
    const pricePaise = Math.round(parseFloat(price) * 100);
    const stockCount = parseInt(stock, 10) || 0;

    if (pricePaise > mrpPaise) {
      Alert.alert('Invalid Price', 'Selling price cannot exceed Maximum Retail Price (MRP).');
      return;
    }

    setSaving(true);
    try {
      await request('/merchant/products', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          brand: brand.trim() || undefined,
          barcode: barcode.trim() || undefined,
          packageSize: packageSize.trim() || undefined,
          category,
          mrpPaise,
          pricePaise,
          stock: stockCount,
          isAvailable: true,
          imageUrl: permanentImageUrl || catalogueImageUrl || undefined
        })
      });

      Alert.alert('Success', 'Product successfully confirmed and added to your store catalogue.');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save product');
    } finally {
      setSaving(false);
    }
  };

  const displayedImage = permanentImageUrl || catalogueImageUrl;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Product to Store</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Quick Catalogue Auto-Fill Actions */}
        <View style={styles.quickActionsCard}>
          <View style={styles.quickActionHeader}>
            <Sparkles size={18} color="#059669" />
            <Text style={styles.quickActionTitle}>Fast Catalogue Identification</Text>
          </View>
          <Text style={styles.quickActionSubtitle}>
            Scan the product barcode to automatically pull name, brand, category, and verified image.
          </Text>

          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              style={styles.scanBarcodeBtn}
              onPress={() => setScannerVisible(true)}
            >
              <ScanBarcode size={20} color="#FFFFFF" />
              <Text style={styles.scanBarcodeBtnText}>Scan Barcode</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.searchCatalogueBtn}
              onPress={() => setSearchModalVisible(true)}
            >
              <Search size={18} color="#059669" />
              <Text style={styles.searchCatalogueBtnText}>Search by Name</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Catalogue Match Banner */}
        {catalogueMatched && (
          <View style={styles.matchBanner}>
            <View style={styles.matchIconWrap}>
              <Check size={16} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.matchTitle}>Verified Catalogue Match</Text>
              <Text style={styles.matchSubtitle}>
                Pre-filled from {catalogueSource || 'external catalogue'}. You must verify or edit your store's selling price and stock below.
              </Text>
            </View>
          </View>
        )}

        {/* Product Image Section */}
        <View style={styles.photoContainer}>
          <Text style={styles.sectionHeading}>Product Photograph</Text>

          {displayedImage ? (
            <View style={styles.imagePreviewWrapper}>
              <Image source={{ uri: displayedImage }} style={styles.imagePreview} resizeMode="contain" />

              {uploadingImage && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.uploadingText}>Saving to secure storage...</Text>
                </View>
              )}

              {imageLicensingNotice && (
                <Text style={styles.licenseNoticeText}>{imageLicensingNotice}</Text>
              )}

              <View style={styles.imageActionRow}>
                <TouchableOpacity onPress={handleTakeCameraPhoto} style={styles.imageReplaceBtn}>
                  <Camera size={14} color="#059669" />
                  <Text style={styles.imageReplaceText}>Take New Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handlePickPhoto} style={styles.imageReplaceBtn}>
                  <ImageIcon size={14} color="#059669" />
                  <Text style={styles.imageReplaceText}>From Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setPermanentImageUrl(null);
                    setCatalogueImageUrl(null);
                    setImageLicensingNotice(null);
                  }}
                  style={styles.imageRemoveBtn}
                >
                  <Text style={styles.imageRemoveText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              {uploadingImage ? (
                <View style={styles.uploadingPlaceholder}>
                  <ActivityIndicator size="large" color="#059669" />
                  <Text style={styles.uploadingPlaceholderText}>Uploading photo to storage...</Text>
                </View>
              ) : (
                <View style={styles.photoPickerRow}>
                  <TouchableOpacity onPress={handleTakeCameraPhoto} style={styles.photoPickBtn}>
                    <Camera size={22} color="#059669" />
                    <Text style={styles.photoPickText}>Take Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handlePickPhoto} style={styles.photoPickBtn}>
                    <ImageIcon size={22} color="#059669" />
                    <Text style={styles.photoPickText}>From Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Product Confirmation Form */}
        <View style={styles.formCard}>
          <Text style={styles.sectionHeading}>Product Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Fortune Sunlite Refined Sunflower Oil"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Brand</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Fortune"
                placeholderTextColor="#94A3B8"
                value={brand}
                onChangeText={setBrand}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Net Qty / Size</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1 L or 500 g"
                placeholderTextColor="#94A3B8"
                value={packageSize}
                onChangeText={setPackageSize}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Barcode / GTIN</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 8901058017687"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              value={barcode}
              onChangeText={setBarcode}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Store Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catChips}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[styles.catChip, category === c && styles.catChipActive]}
                >
                  <Text style={[styles.catChipText, category === c && styles.catChipTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Pricing & Inventory Notice */}
          <View style={styles.pricingNoticeBox}>
            <Info size={16} color="#0369A1" />
            <Text style={styles.pricingNoticeText}>
              External catalogue data never dictates your selling price. Please set your own store MRP, selling price, and stock count.
            </Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>MRP (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="165.00"
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
                value={mrp}
                onChangeText={setMrp}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Selling Price (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="145.00"
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
                value={price}
                onChangeText={setPrice}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Available Stock (Units) *</Text>
            <TextInput
              style={styles.input}
              placeholder="25"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              value={stock}
              onChangeText={setStock}
            />
          </View>
        </View>

        {/* Confirmation Submit Button */}
        <TouchableOpacity
          onPress={handleSaveProduct}
          disabled={saving || uploadingImage}
          style={[styles.saveBtn, (saving || uploadingImage) && styles.saveBtnDisabled]}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Check size={20} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Confirm & Add Product to Catalogue</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onProductFound={handleProductIdentified}
      />

      {/* Keyword Catalogue Search Modal */}
      <CatalogueSearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onSelectProduct={handleProductIdentified}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A'
  },
  scrollContent: {
    padding: 16,
    gap: 16
  },
  quickActionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  quickActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A'
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10
  },
  scanBarcodeBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 8
  },
  scanBarcodeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  searchCatalogueBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 6
  },
  searchCatalogueBtnText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '700'
  },
  matchBanner: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    padding: 14,
    gap: 12
  },
  matchIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2
  },
  matchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 2
  },
  matchSubtitle: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 16
  },
  photoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12
  },
  photoPickerRow: {
    flexDirection: 'row',
    gap: 12
  },
  photoPickBtn: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 6
  },
  photoPickText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#047857'
  },
  uploadingPlaceholder: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadingPlaceholderText: {
    marginTop: 8,
    fontSize: 13,
    color: '#059669',
    fontWeight: '600'
  },
  imagePreviewWrapper: {
    alignItems: 'center',
    position: 'relative'
  },
  imagePreview: {
    width: 140,
    height: 140,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  uploadingText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6
  },
  licenseNoticeText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center'
  },
  imageActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10
  },
  imageReplaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4
  },
  imageReplaceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A'
  },
  imageRemoveBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  imageRemoveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626'
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14
  },
  inputGroup: {
    gap: 6
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155'
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600'
  },
  row: {
    flexDirection: 'row',
    gap: 12
  },
  catChips: {
    gap: 8,
    paddingVertical: 4
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  catChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669'
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B'
  },
  catChipTextActive: {
    color: '#FFFFFF'
  },
  pricingNoticeBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 10,
    gap: 8,
    alignItems: 'center'
  },
  pricingNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#0369A1',
    lineHeight: 16
  },
  saveBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#059669',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 32
  },
  saveBtnDisabled: {
    opacity: 0.6
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800'
  }
});
