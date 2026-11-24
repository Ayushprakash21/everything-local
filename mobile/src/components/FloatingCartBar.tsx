import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useCart } from '../context/CartContext';
import { useRouter } from 'expo-router';
import { ShoppingBag, ArrowRight } from 'lucide-react-native';
import { formatPaise } from '../utils/format';

export const FloatingCartBar: React.FC = () => {
  const { itemCount, subtotalPaise } = useCart();
  const router = useRouter();

  if (itemCount === 0) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push('/(customer)/cart')}
        style={styles.bar}
      >
        <View style={styles.leftRow}>
          <View style={styles.iconCircle}>
            <ShoppingBag size={18} color="#064e3b" />
          </View>
          <View style={styles.textCol}>
            <Text style={styles.itemCountText}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
            <Text style={styles.priceText}>{formatPaise(subtotalPaise)}</Text>
          </View>
        </View>

        <View style={styles.rightRow}>
          <Text style={styles.viewCartText}>View Cart</Text>
          <ArrowRight size={16} color="#fef3c7" strokeWidth={2.5} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 76 : 68,
    left: 12,
    right: 12,
    zIndex: 999
  },
  bar: {
    backgroundColor: '#064e3b',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#047857'
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  textCol: {
    flexDirection: 'column'
  },
  itemCountText: {
    color: '#a7f3d0',
    fontSize: 11,
    fontWeight: '700'
  },
  priceText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900'
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  viewCartText: {
    color: '#fef3c7',
    fontSize: 13,
    fontWeight: '800',
    marginRight: 4
  }
});
