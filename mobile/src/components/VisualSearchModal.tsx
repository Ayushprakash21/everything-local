import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, X, Sparkles, CheckCircle2 } from 'lucide-react-native';

interface VisualSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSearchResults: (detectedKeyword: string) => void;
}

export const VisualSearchModal: React.FC<VisualSearchModalProps> = ({
  visible,
  onClose,
  onSearchResults
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [detectedItem, setDetectedItem] = useState<string | null>(null);

  const handleCapturePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera permission is required to capture product packaging.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
      aspect: [4, 3]
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      processImage(result.assets[0].uri);
    }
  };

  const handlePickGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Gallery permission is required to select photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.7,
      aspect: [4, 3]
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      processImage(result.assets[0].uri);
    }
  };

  const processImage = (uri: string) => {
    setSelectedImage(uri);
    setIsAnalyzing(true);

    // AI Vision Product Detection simulation
    setTimeout(() => {
      setIsAnalyzing(false);
      // Sample local product matching for Indore market
      const samples = ['Atta', 'Sunflower Oil', 'Potatoes', 'Milk', 'Bread'];
      const matched = samples[Math.floor(Math.random() * samples.length)];
      setDetectedItem(matched);
    }, 1500);
  };

  const handleApplyResult = () => {
    if (detectedItem) {
      onSearchResults(detectedItem);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setDetectedItem(null);
    setIsAnalyzing(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Sparkles size={20} color="#059669" />
              <Text style={styles.title}>Visual Product Search</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Take a photo of any grocery packet, fruit, or vegetable to find it in your 3 km neighborhood stores.
          </Text>

          {/* Preview or Capture Options */}
          {selectedImage ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              {isAnalyzing && (
                <View style={styles.analyzingOverlay}>
                  <ActivityIndicator size="large" color="#ffffff" />
                  <Text style={styles.analyzingText}>Analyzing packaging with local catalogue...</Text>
                </View>
              )}

              {detectedItem && (
                <View style={styles.resultBox}>
                  <CheckCircle2 size={20} color="#059669" />
                  <Text style={styles.resultText}>Matched Product: <Text style={styles.highlight}>{detectedItem}</Text></Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.optionsRow}>
              <TouchableOpacity onPress={handleCapturePhoto} style={styles.optionCard}>
                <View style={styles.iconCircle}>
                  <Camera size={26} color="#059669" />
                </View>
                <Text style={styles.optionTitle}>Take Photo</Text>
                <Text style={styles.optionDesc}>Point at any item</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handlePickGallery} style={styles.optionCard}>
                <View style={styles.iconCircle}>
                  <ImageIcon size={26} color="#059669" />
                </View>
                <Text style={styles.optionTitle}>From Gallery</Text>
                <Text style={styles.optionDesc}>Upload screenshot</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Action buttons */}
          {detectedItem && (
            <TouchableOpacity onPress={handleApplyResult} style={styles.searchBtn}>
              <Text style={styles.searchBtnText}>Search Nearby Stores for "{detectedItem}"</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 18,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  optionCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 11,
    color: '#94a3b8',
  },
  previewContainer: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  analyzingText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
  },
  resultBox: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  resultText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  highlight: {
    color: '#059669',
    fontWeight: '800',
  },
  searchBtn: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  searchBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
