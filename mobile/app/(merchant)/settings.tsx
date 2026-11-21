import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Store } from '../../src/types';
import { request } from '../../src/api/client';
import { Store as StoreIcon, MapPin, Clock, LogOut, ShoppingBag, ShieldCheck, Check } from 'lucide-react-native';

export default function MerchantSettingsScreen() {
  const router = useRouter();
  const { user, logout, switchRole } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [selectedRadius, setSelectedRadius] = useState<number>(3.0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await request<{ store: Store }>('/merchant/store');
        setStore(res.store);
        if (res.store) {
          setSelectedRadius(res.store.serviceRadiusKm);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchStore();
  }, []);

  const handleUpdateRadius = async (radiusKm: number) => {
    setSelectedRadius(radiusKm);
    setSaving(true);
    try {
      await request('/merchant/store', {
        method: 'PUT',
        body: JSON.stringify({ serviceRadiusKm: radiusKm })
      });
      Alert.alert('Updated', `Your hyper-local delivery radius is now ${radiusKm} km.`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchToCustomer = () => {
    switchRole('CUSTOMER');
    router.replace('/(customer)');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Store Controls & Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Store Card */}
        <View style={styles.card}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <StoreIcon size={24} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.storeName}>{store?.name || 'My Store'}</Text>
              <Text style={styles.category}>{store?.category.toUpperCase()} • Verified Partner</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MapPin size={14} color="#64748b" />
            <Text style={styles.infoText}>{store?.addressLine}, Indore</Text>
          </View>

          <View style={styles.infoRow}>
            <Clock size={14} color="#64748b" />
            <Text style={styles.infoText}>Operating: 8:00 AM - 10:00 PM</Text>
          </View>
        </View>

        {/* Hyperlocal Service Radius Config */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hyperlocal Service Radius</Text>
          <Text style={styles.cardSub}>
            Customer addresses outside your radius will only be offered In-Store Pickup.
          </Text>

          <View style={styles.radiusRow}>
            {[2.0, 2.5, 3.0, 3.5, 5.0].map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => handleUpdateRadius(r)}
                style={[styles.radiusBtn, selectedRadius === r && styles.radiusBtnActive]}
              >
                <Text style={[styles.radiusText, selectedRadius === r && styles.radiusTextActive]}>
                  {r} km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Switch Portal Button */}
        <TouchableOpacity onPress={handleSwitchToCustomer} style={styles.switchBtn}>
          <ShoppingBag size={18} color="#059669" />
          <Text style={styles.switchBtnText}>Switch to Customer Marketplace</Text>
        </TouchableOpacity>

        {/* Sign out */}
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <LogOut size={16} color="#ef4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
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
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  category: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  cardSub: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  radiusBtn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  radiusBtnActive: {
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
  },
  radiusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  radiusTextActive: {
    color: '#059669',
    fontWeight: '800',
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
  },
  switchBtnText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '800',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff5f5',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fed7d7',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '800',
  },
});
