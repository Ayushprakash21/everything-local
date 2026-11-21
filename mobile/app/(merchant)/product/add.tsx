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
import { ArrowLeft, Camera, Image as ImageIcon, Check } from 'lucide-react-native';

export default function AddProductScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Grocery Staples');
  const [mrp, setMrp] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('25');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const categories = [
    'Grocery Staples',
    'Dairy & Bakery',
    'Vegetables & Fruits',
    'Edible Oils',
    'Beverages & Snacks'
  ];

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow gallery access to upload product pictures.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.7,
      aspect: [1, 1]
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleTakeCameraPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access to take product photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
      aspect: [1, 1]
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSaveProduct = async () => {
    if (!name.trim() || !price || !mrp) {
      Alert.alert('Incomplete Fields', 'Please fill in product title, MRP, and selling price.');
      return;
    }

    const mrpPaise = Math.round(parseFloat(mrp) * 100);
    const pricePaise = Math.round(parseFloat(price) * 100);
    const stockCount = parseInt(stock, 10) || 0;

    setLoading(true);
    try {
      await request('/merchant/products', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          category,
          mrpPaise,
          pricePaise,
          stock: stockCount,
          isAvailable: true,
          imageUrl: imageUri || undefined
        })
      });

      Alert.alert('Success', 'Product successfully added to your store catalogue.');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Product</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Photo Picker Box */}
        <View style={styles.photoContainer}>
          {imageUri ? (
            <View style={styles.imagePreviewWrapper}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <TouchableOpacity onPress={() => setImageUri(null)} style={styles.removeImageBtn}>
                <Text style={styles.removeImageText}>Change</Text>
              </TouchableOpacity>
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

        {/* Input Fields */}
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Fortune Sunflower Oil 1L"
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
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

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>MRP (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="165.00"
                placeholderTextColor="#94a3b8"
                keyboardType="decimal-pad"
                value={mrp}
                onChangeText={setMrp}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Selling Price (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="145.00"
                placeholderTextColor="#94a3b8"
                keyboardType="decimal-pad"
                value={price}
                onChangeText={setPrice}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Initial Available Stock (Units)</Text>
            <TextInput
              style={styles.input}
              placeholder="25"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              value={stock}
              onChangeText={setStock}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSaveProduct}
          disabled={loading}
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Check size={18} color="#ffffff" />
              <Text style={styles.saveBtnText}>Save Product to Store</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  photoContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  photoPickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoPickBtn: {
    flex: 1,
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 6,
  },
  photoPickText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#047857',
  },
  imagePreviewWrapper: {
    alignItems: 'center',
    position: 'relative',
  },
  imagePreview: {
    width: 140,
    height: 140,
    borderRadius: 16,
  },
  removeImageBtn: {
    marginTop: 8,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  removeImageText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  catChips: {
    gap: 8,
    paddingVertical: 4,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  catChipTextActive: {
    color: '#ffffff',
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
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
