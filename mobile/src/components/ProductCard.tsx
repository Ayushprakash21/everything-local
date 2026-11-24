import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Product } from '../types';
import { formatPaise, calculateDiscountPct } from '../utils/format';
import { useCart } from '../context/CartContext';
import { Plus, Minus, ShoppingBag } from 'lucide-react-native';
import { SafeImage } from './SafeImage';

interface ProductCardProps {
  product: Product;
  storeId?: string;
  onPress?: () => void;
  width?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  storeId,
  onPress,
  width = 160
}) => {
  const { cart, addItem, updateQuantity } = useCart();
  const effectiveStoreId = storeId || product.storeId || product.store?.id || '';

  const cartItem = cart?.items?.find((item) => item.productId === product.id);
  const quantity = cartItem?.quantity || 0;

  const discount = calculateDiscountPct(product.mrpPaise, product.pricePaise);
  const isOutOfStock = product.stock <= 0 || !product.isAvailable;

  const handleAdd = async (e: any) => {
    e?.stopPropagation?.();
    if (!effectiveStoreId || isOutOfStock) return;
    const res = await addItem(effectiveStoreId, product.id, 1);
    if (!res.success && res.conflictMessage) {
      alert(res.conflictMessage);
    }
  };

  const handleIncrement = (e: any) => {
    e?.stopPropagation?.();
    if (isOutOfStock) return;
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrement = (e: any) => {
    e?.stopPropagation?.();
    updateQuantity(product.id, quantity - 1);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.card, { width }]}
    >
      {/* Product Image Container */}
      <View style={styles.imageContainer}>
        <SafeImage
          uri={product.imageUrl}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Discount Badge */}
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        )}

        {/* Pack Size Pill */}
        {product.packageSize ? (
          <View style={styles.packSizePill}>
            <Text style={styles.packSizeText} numberOfLines={1}>
              {product.packageSize}
            </Text>
          </View>
        ) : null}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <View style={styles.stockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.details}>
        {/* Brand */}
        {product.brand ? (
          <Text style={styles.brand} numberOfLines={1}>
            {product.brand}
          </Text>
        ) : null}

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Price & Action Row */}
        <View style={styles.actionRow}>
          <View style={styles.priceCol}>
            <Text style={styles.price}>{formatPaise(product.pricePaise)}</Text>
            {product.mrpPaise > product.pricePaise && (
              <Text style={styles.mrp}>{formatPaise(product.mrpPaise)}</Text>
            )}
          </View>

          {/* Add / Stepper */}
          {quantity === 0 ? (
            <TouchableOpacity
              onPress={handleAdd}
              disabled={isOutOfStock}
              style={[
                styles.addBtn,
                isOutOfStock && styles.addBtnDisabled
              ]}
            >
              <Text style={[styles.addBtnText, isOutOfStock && styles.addBtnTextDisabled]}>
                ADD
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                onPress={handleDecrement}
                style={styles.stepperBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Minus size={14} color="#ffffff" strokeWidth={3} />
              </TouchableOpacity>
              <Text style={styles.stepperCount}>{quantity}</Text>
              <TouchableOpacity
                onPress={handleIncrement}
                style={styles.stepperBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Plus size={14} color="#ffffff" strokeWidth={3} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 4
  },
  imageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#f8fafc',
    position: 'relative'
  },
  image: {
    width: '100%',
    height: '100%'
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#f59e0b',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  discountText: {
    color: '#0f172a',
    fontSize: 10,
    fontWeight: '800'
  },
  packSizePill: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  packSizeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700'
  },
  stockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  outOfStockText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  details: {
    padding: 10
  },
  brand: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 2
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 17,
    height: 34
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8
  },
  priceCol: {
    flexDirection: 'column'
  },
  price: {
    fontSize: 14,
    fontWeight: '900',
    color: '#064e3b'
  },
  mrp: {
    fontSize: 10,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    fontWeight: '500'
  },
  addBtn: {
    borderWidth: 1.5,
    borderColor: '#047857',
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 5
  },
  addBtnDisabled: {
    borderColor: '#cbd5e1',
    backgroundColor: '#f1f5f9'
  },
  addBtnText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '900'
  },
  addBtnTextDisabled: {
    color: '#94a3b8'
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064e3b',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 3
  },
  stepperBtn: {
    padding: 3
  },
  stepperCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 6
  }
});
