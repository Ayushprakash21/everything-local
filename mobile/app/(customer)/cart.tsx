import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '../../src/context/CartContext';
import { useAuth } from '../../src/context/AuthContext';
import { formatPaise } from '../../src/utils/format';
import { ShoppingBag, Plus, Minus, Trash2, Store, ArrowRight, ShieldCheck, Bike } from 'lucide-react-native';

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    cart,
    subtotalPaise,
    shortfallPaise,
    meetsMinimumOrderValue,
    updateQuantity,
    removeItem,
    clearCart,
    isLoading
  } = useCart();

  const [fulfillmentMode, setFulfillmentMode] = useState<'PICKUP' | 'MERCHANT_DELIVERY'>('PICKUP');

  if (!user) {
    return (
      <View style={styles.centerBox}>
        <ShoppingBag size={52} color="#cbd5e1" />
        <Text style={styles.centerTitle}>Sign in to view your cart</Text>
        <Text style={styles.centerSub}>Access your neighborhood stores and manage your shopping cart.</Text>
        <TouchableOpacity onPress={() => router.push('/auth/login')} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <View style={styles.centerBox}>
        <ShoppingBag size={52} color="#cbd5e1" />
        <Text style={styles.centerTitle}>Your cart is empty</Text>
        <Text style={styles.centerSub}>
          Discover fresh daily essentials from nearby stores within 3 km in Indore!
        </Text>
        <TouchableOpacity onPress={() => router.replace('/(customer)')} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Explore Stores</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const deliveryFeePaise = fulfillmentMode === 'PICKUP' ? 0 : 2500; // ₹25
  const totalAmountPaise = subtotalPaise + deliveryFeePaise;
  const movTargetPaise = 29900;
  const progressRatio = Math.min(1.0, subtotalPaise / movTargetPaise);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Single-Store Context Card */}
        {cart.store && (
          <View style={styles.storeCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.storeTag}>ORDERING FROM NEIGHBORHOOD STORE</Text>
              <Text style={styles.storeName}>{cart.store.name}</Text>
            </View>
            <View style={styles.singleStoreBadge}>
              <ShieldCheck size={12} color="#059669" />
              <Text style={styles.singleStoreText}>Single-Store Cart</Text>
            </View>
          </View>
        )}

        {/* Minimum Order Value (₹299) Card */}
        <View style={[styles.movCard, meetsMinimumOrderValue && styles.movCardSuccess]}>
          <View style={styles.movRow}>
            <Text style={[styles.movText, meetsMinimumOrderValue && styles.movTextSuccess]}>
              {meetsMinimumOrderValue
                ? '✓ ₹299 Minimum Order Requirement Met!'
                : `Add ${formatPaise(shortfallPaise)} more to checkout`}
            </Text>
            <Text style={styles.movRatio}>
              {formatPaise(subtotalPaise)} / ₹299
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressRatio * 100}%` },
                meetsMinimumOrderValue && { backgroundColor: '#059669' }
              ]}
            />
          </View>
        </View>

        {/* Items List */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionLabel}>ORDER ITEMS ({cart.items.length})</Text>
          {cart.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.itemName}>{item.product.name}</Text>
                <Text style={styles.itemPrice}>
                  {formatPaise(item.unitPricePaise * item.quantity)}
                </Text>
              </View>

              <View style={styles.qtyContainer}>
                <TouchableOpacity
                  onPress={() => {
                    if (item.quantity > 1) {
                      updateQuantity(item.productId, item.quantity - 1);
                    } else {
                      removeItem(item.id);
                    }
                  }}
                  style={styles.qtyBtn}
                >
                  <Minus size={14} color="#0f172a" />
                </TouchableOpacity>

                <Text style={styles.qtyNum}>{item.quantity}</Text>

                <TouchableOpacity
                  onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                  style={styles.qtyBtn}
                >
                  <Plus size={14} color="#0f172a" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => removeItem(item.id)}
                  style={styles.removeBtn}
                >
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Fulfillment Mode Choice */}
        <View style={styles.fulfillmentSection}>
          <Text style={styles.sectionLabel}>CHOOSE FULFILLMENT MODE</Text>
          <View style={styles.modeRow}>
            <TouchableOpacity
              onPress={() => setFulfillmentMode('PICKUP')}
              style={[styles.modeCard, fulfillmentMode === 'PICKUP' && styles.modeCardActive]}
            >
              <View style={styles.modeIconRow}>
                <Store size={18} color={fulfillmentMode === 'PICKUP' ? '#059669' : '#64748b'} />
                <Text style={styles.freePill}>FREE ₹0</Text>
              </View>
              <Text style={styles.modeTitle}>Self Pickup</Text>
              <Text style={styles.modeSub}>Ready in ~15 mins at counter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFulfillmentMode('MERCHANT_DELIVERY')}
              style={[styles.modeCard, fulfillmentMode === 'MERCHANT_DELIVERY' && styles.modeCardActive]}
            >
              <View style={styles.modeIconRow}>
                <Bike size={18} color={fulfillmentMode === 'MERCHANT_DELIVERY' ? '#059669' : '#64748b'} />
                <Text style={styles.deliveryFeePill}>₹25.00</Text>
              </View>
              <Text style={styles.modeTitle}>Local Delivery</Text>
              <Text style={styles.modeSub}>To your door within 3 km</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bill Breakdown */}
        <View style={styles.billCard}>
          <Text style={styles.billTitle}>Bill Breakdown</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Subtotal</Text>
            <Text style={styles.billValue}>{formatPaise(subtotalPaise)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Fulfillment Fee</Text>
            <Text style={styles.billValue}>
              {fulfillmentMode === 'PICKUP' ? '₹0.00 (Free Pickup)' : '₹25.00'}
            </Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Applicable Taxes</Text>
            <Text style={styles.billValue}>₹0.00</Text>
          </View>
          <View style={[styles.billRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>{formatPaise(totalAmountPaise)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Checkout Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.totalHint}>Total Amount</Text>
          <Text style={styles.bottomTotal}>{formatPaise(totalAmountPaise)}</Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            if (meetsMinimumOrderValue) {
              router.push({
                pathname: '/(customer)/checkout',
                params: { fulfillmentMode }
              });
            } else {
              alert(`Minimum order value is ₹299. Please add ${formatPaise(shortfallPaise)} more.`);
            }
          }}
          disabled={!meetsMinimumOrderValue}
          style={[styles.checkoutBtn, !meetsMinimumOrderValue && styles.checkoutBtnDisabled]}
        >
          <Text style={styles.checkoutBtnText}>
            {meetsMinimumOrderValue ? 'Proceed to Pay' : 'Min Order ₹299'}
          </Text>
          <ArrowRight size={16} color="#ffffff" />
        </TouchableOpacity>
      </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  clearText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ef4444',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 16,
  },
  storeCard: {
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
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
  },
  singleStoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  singleStoreText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  movCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  movCardSuccess: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  movRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  movText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
    flex: 1,
  },
  movTextSuccess: {
    color: '#047857',
  },
  movRatio: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    marginLeft: 8,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 3,
  },
  itemsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyNum: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    minWidth: 16,
    textAlign: 'center',
  },
  removeBtn: {
    marginLeft: 6,
    padding: 4,
  },
  fulfillmentSection: {
    gap: 8,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modeCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  modeCardActive: {
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
  },
  modeIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  freePill: {
    fontSize: 9,
    fontWeight: '900',
    color: '#059669',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  deliveryFeePill: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  modeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  modeSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  billCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  billTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  billValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  totalRow: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalHint: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  bottomTotal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  checkoutBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 16,
  },
  checkoutBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  checkoutBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  centerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  centerSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  primaryBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
