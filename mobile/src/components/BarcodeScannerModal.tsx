import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, Flashlight, AlertCircle, Search, Keyboard } from 'lucide-react-native';
import { request } from '../api/client';

export interface ScannedProductData {
  found: boolean;
  barcode: string;
  name?: string;
  brand?: string;
  category?: string;
  packageSize?: string;
  imageUrl?: string;
  source?: string;
  licenseNotice?: string;
  message?: string;
}

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onProductFound: (product: ScannedProductData) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  visible,
  onClose,
  onProductFound
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Prevent duplicate scan firing
  const scanLockRef = useRef(false);

  const handleBarcodeScanned = async (result: { data: string; type: string }) => {
    const rawBarcode = result.data?.trim();
    if (!rawBarcode || scanLockRef.current || isProcessing) {
      return;
    }

    scanLockRef.current = true;
    setIsProcessing(true);
    setStatusMessage(`Scanning barcode: ${rawBarcode}...`);

    await performLookup(rawBarcode);
  };

  const performLookup = async (barcodeToSearch: string) => {
    try {
      setStatusMessage('Querying product catalogue...');
      const catalogueResult = await request<ScannedProductData>(
        `/merchant/catalogue/lookup?barcode=${encodeURIComponent(barcodeToSearch)}`
      );

      setIsProcessing(false);
      scanLockRef.current = false;
      onClose();

      if (catalogueResult && catalogueResult.found) {
        onProductFound(catalogueResult);
      } else {
        // Return not-found result with prefilled barcode so merchant can complete manual entry
        onProductFound({
          found: false,
          barcode: barcodeToSearch,
          message: catalogueResult?.message || 'Product not found in catalogue'
        });
      }
    } catch (err: any) {
      console.warn('Catalogue lookup error:', err);
      setIsProcessing(false);
      scanLockRef.current = false;
      setStatusMessage(null);
      Alert.alert(
        'Catalogue Lookup Issue',
        'Could not reach the catalogue service. You can enter the product details manually.',
        [
          {
            text: 'Enter Details Manually',
            onPress: () => {
              onClose();
              onProductFound({
                found: false,
                barcode: barcodeToSearch,
                message: 'Catalogue lookup offline'
              });
            }
          },
          { text: 'Try Again', style: 'cancel' }
        ]
      );
    }
  };

  const handleManualLookup = () => {
    const clean = manualBarcode.trim();
    if (!clean) {
      Alert.alert('Invalid Barcode', 'Please enter a valid barcode number.');
      return;
    }
    setIsProcessing(true);
    performLookup(clean);
  };

  const resetScanner = () => {
    scanLockRef.current = false;
    setIsProcessing(false);
    setStatusMessage(null);
    setShowManualInput(false);
    setManualBarcode('');
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={resetScanner}>
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={resetScanner}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Product Barcode</Text>
          <TouchableOpacity
            style={[styles.headerButton, torchEnabled && styles.torchActive]}
            onPress={() => setTorchEnabled(!torchEnabled)}
          >
            <Flashlight size={22} color={torchEnabled ? '#10B981' : '#FFFFFF'} />
          </TouchableOpacity>
        </View>

        {/* Camera or Fallback View */}
        {showManualInput ? (
          <View style={styles.manualContainer}>
            <Keyboard size={48} color="#10B981" />
            <Text style={styles.manualTitle}>Manual Barcode Entry</Text>
            <Text style={styles.manualSubtitle}>
              Type the numbers printed under the product's barcode (EAN-13, EAN-8, or UPC):
            </Text>

            <TextInput
              style={styles.barcodeInput}
              placeholder="e.g. 8901058017687"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              value={manualBarcode}
              onChangeText={setManualBarcode}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.primaryButton, isProcessing && styles.buttonDisabled]}
              onPress={handleManualLookup}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Search size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryButtonText}>Look Up Product</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowManualInput(false)}>
              <Text style={styles.secondaryButtonText}>Back to Camera Scanner</Text>
            </TouchableOpacity>
          </View>
        ) : !permission || !permission.granted ? (
          <View style={styles.permissionContainer}>
            <AlertCircle size={56} color="#F59E0B" />
            <Text style={styles.permissionTitle}>Camera Permission Required</Text>
            <Text style={styles.permissionText}>
              EveryBazaar uses your camera to scan barcodes and look up products automatically from the catalogue.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
              <Text style={styles.primaryButtonText}>Grant Camera Access</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowManualInput(true)}>
              <Text style={styles.secondaryButtonText}>Enter Barcode Manually</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cameraWrapper}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              enableTorch={torchEnabled}
              barcodeScannerSettings={{
                barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'qr']
              }}
              onBarcodeScanned={isProcessing ? undefined : handleBarcodeScanned}
            />

            {/* Visual Reticle Overlay */}
            <View style={styles.overlay}>
              <View style={styles.unfocusedTop} />
              <View style={styles.middleRow}>
                <View style={styles.unfocusedSide} />
                <View style={styles.targetReticle}>
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                  <View style={styles.aimLine} />
                </View>
                <View style={styles.unfocusedSide} />
              </View>
              <View style={styles.unfocusedBottom}>
                <Text style={styles.guidanceText}>
                  Align barcode inside the frame to scan automatically
                </Text>

                {isProcessing && (
                  <View style={styles.processingBadge}>
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.processingText}>{statusMessage || 'Looking up product...'}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.manualSwitchButton}
                  onPress={() => setShowManualInput(true)}
                  disabled={isProcessing}
                >
                  <Keyboard size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.manualSwitchText}>Enter Barcode Manually</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A'
  },
  header: {
    height: 60,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10
  },
  headerButton: {
    padding: 8,
    borderRadius: 8
  },
  torchActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)'
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700'
  },
  cameraWrapper: {
    flex: 1
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center'
  },
  unfocusedTop: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.65)'
  },
  middleRow: {
    flexDirection: 'row',
    height: 220,
    width: '100%'
  },
  unfocusedSide: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)'
  },
  targetReticle: {
    width: 280,
    height: 220,
    borderRadius: 16,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#10B981'
  },
  cornerTL: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 10 },
  cornerTR: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 10 },
  cornerBL: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 10 },
  cornerBR: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 10 },
  aimLine: {
    width: '90%',
    height: 2,
    backgroundColor: '#10B981',
    opacity: 0.8
  },
  unfocusedBottom: {
    flex: 1.3,
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24
  },
  guidanceText: {
    color: '#E2E8F0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16
  },
  processingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  },
  manualSwitchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24
  },
  manualSwitchText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#0F172A'
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center'
  },
  permissionText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24
  },
  manualContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A'
  },
  manualTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8
  },
  manualSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24
  },
  barcodeInput: {
    width: '100%',
    backgroundColor: '#1E293B',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#334155',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 20
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12
  },
  buttonDisabled: {
    opacity: 0.6
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  },
  secondaryButton: {
    paddingVertical: 12
  },
  secondaryButtonText: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '600'
  }
});
