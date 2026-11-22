import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { ELLogo } from '../src/components/ELLogo';

export default function IndexGateway() {
  const router = useRouter();
  const { user, role, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user && role === 'MERCHANT') {
        router.replace('/(merchant)');
      } else {
        router.replace('/(customer)');
      }
    }
  }, [isLoading, user, role]);

  return (
    <View style={styles.container}>
      <View style={styles.brandBox}>
        <ELLogo variant="dark" size={88} style={{ marginBottom: 16 }} />
        <Text style={styles.brandTitle}>Everything Local</Text>
        <Text style={styles.tagline}>Shop more. Save more. Live better.</Text>
      </View>
      <ActivityIndicator size="large" color="#059669" style={styles.spinner} />
      <Text style={styles.marketLabel}>Indore Hyperlocal Network</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#059669',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    fontStyle: 'italic',
  },
  spinner: {
    marginTop: 12,
  },
  marketLabel: {
    position: 'absolute',
    bottom: 32,
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
