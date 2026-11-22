import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '../../src/context/CartContext';
import { useAuth } from '../../src/context/AuthContext';
import { formatPaise } from '../../src/utils/format';
import { SafeImage } from '../../src/components/SafeImage';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Store,
  ArrowRight,
  ShieldCheck,
  Bike,
  Sparkles,
  CheckCircle2,
  ChevronLeft
} from 'lucide-react-native';

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
        <View style={styles.emptyIconCircle}>
          <ShoppingBag size={48} color="#047857" />
        </View>
        <Text style={styles.centerTitle}>Sign in to view your cart</Text>
        <Text style={styles.centerSub}>
          Access your neighborhood store cart and saved delivery addresses.
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/auth/login')}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>Sign In to Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#047857" />
      </View>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <View style={styles.centerBox}>
        <View style={styles.emptyIconCircle}>
          <ShoppingBag size={48} color="#94a3b8" />
        </View>
        <Text style={styles.centerTitle}>Your shopping cart is empty</Text>
        <Text style={styles.centerSub}>
          Discover fresh daily essentials from nearby stores within 3 km in Indore!
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.replace('/(customer)')}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>Explore Neighborhood Stores</Text>
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
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          <Text style={styles.headerSubtitle}>{cart.items.length} {cart.items.length === 1 ? 'item' : 'items'} from {cart.store?.name || 'Local Store'}</Text>
        </View>
        <TouchableOpacity onPress={clearCart} style={styles.clearBtn}>
          <Trash2 size={16} color="#ef4444" />
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Single-Store Fulfillment Context Card */}
        {cart.store && (
          <View style={styles.storeCard}>
            <View style={styles.storeLogoBox}>
              <Store size={22} color="#047857" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.storeTag}>FULFILLING DIRECT FROM STORE</Text>
              <Text style={styles.storeName}>{cart.store.name}</Text>
              <Text style={styles.storeAddress} numberOfLines={1}>{cart.store.addressLine}</Text>
            </View>
            <View style={styles.singleStoreBadge}>
              <ShieldCheck size={12} color="#047857" />
              <Text style={styles.singleStoreText}>Single-Store</Text>
            </View>
          </View>
        )}

        {/* Minimum Order Value (₹299) Free Delivery Progress */}
        <View style={[styles.movCard, meetsMinimumOrderValue && styles.movCardSuccess]}>
          <View style={styles.movRow}>
            <View style={styles.movIconBox}>
              <Sparkles size={16} color={meetsMinimumOrderValue ? '#047857' : '#d97706'} />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.movTitle}>
                {meetsMinimumOrderValue
                  ? '🎉 Free Local Delivery Unlocked!'
                  : `Add ${formatPaise(shortfallPaise)} more for Free Delivery`}
              </Text>
              <Text style={styles.movSub}>Minimum Order Value: ₹299.00</Text>
            </View>
          </View>

          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.round(progressRatio * 100)}%` },
                meetsMinimumOrderValue && styles.progressBarFillSuccess
              ]}
            />
          </View>
        </View>

        {/* Cart Item Cards */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionHeader}>Items in Your Cart</Text>

          {cart.items.map((item) => {
            const prod = item.product;
            return (
              <View key={item.id} style={styles.itemCard}>
                <SafeImage
                  uri={prod.imageUrl}
                  style={styles.itemImage}
                  containerStyle={styles.itemImageContainer}
                  resizeMode="cover"
                />

                <View style={styles.itemDetails}>
                  {prod.brand ? (
                    <Text style={styles.itemBrand} numberOfLines={1}>{prod.brand}</Text>
                  ) : null}
                  <Text style={styles.itemName} numberOfLines={2}>{prod.name}</Text>

                  {prod.packageSize ? (
                    <View style={styles.itemPackPill}>
                      <Text style={styles.itemPackText}>{prod.packageSize}</Text>
                    </View>
                  ) : null}

                  <Text style={styles.itemPrice}>{formatPaise(item.unitPricePaise)}</Text>
                </View>

                {/* Stepper */}
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                    style={styles.stepperBtn}
                  >
                    <Minus size={14} color="#ffffff" strokeWidth={3} />
                  </TouchableOpacity>
                  <Text style={styles.stepperQty}>{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                    style={styles.stepperBtn}
                  >
                    <Plus size={14} color="#ffffff" strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Fulfillment Mode Toggle */}
        <View style={styles.fulfillmentSection}>
          <Text style={styles.sectionHeader}>Fulfillment Preference</Text>

          <View style={styles.fulfillmentRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setFulfillmentMode('PICKUP')}
              style={[
                styles.fulfillmentCard,
                fulfillmentMode === 'PICKUP' && styles.fulfillmentCardActive
              ]}
            >
              <View style={styles.radioRow}>
                <View style={[styles.radioCircle, fulfillmentMode === 'PICKUP' && styles.radioCircleActive]} />
                <Text style={styles.fulfillmentTitle}>Store Pickup</Text>
              </View>
              <Text style={styles.fulfillmentFeeFree}>FREE (₹0)</Text>
              <Text style={styles.fulfillmentSub}>Pick up directly from counter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setFulfillmentMode('MERCHANT_DELIVERY')}
              style={[
                styles.fulfillmentCard,
                fulfillmentMode === 'MERCHANT_DELIVERY' && styles.fulfillmentCardActive
              ]}
            >
              <View style={styles.radioRow}>
                <View style={[styles.radioCircle, fulfillmentMode === 'MERCHANT_DELIVERY' && styles.radioCircleActive]} />
                <Text style={styles.fulfillmentTitle}>Doorstep Delivery</Text>
              </View>
              <Text style={styles.fulfillmentFee}>₹25.00</Text>
              <Text style={styles.fulfillmentSub}>Delivered to your doorstep</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Itemized Bill Breakdown */}
        <View style={styles.billCard}>
          <Text style={styles.billTitle}>Bill Breakdown</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Subtotal</Text>
            <Text style={styles.billValue}>{formatPaise(subtotalPaise)}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={[styles.billValue, deliveryFeePaise === 0 && styles.billValueFree]}>
              {deliveryFeePaise === 0 ? 'FREE' : formatPaise(deliveryFeePaise)}
            </Text>
          </View>

          <View style={styles.billDivider} />

          <View style={styles.billTotalRow}>
            <View>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.taxInclusiveText}>Inclusive of all taxes</Text>
            </View>
            <Text style={styles.grandTotalValue}>{formatPaise(totalAmountPaise)}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Bottom Checkout Footer */}
      <View style={styles.footer}>
        <View style={styles.footerPriceCol}>
          <Text style={styles.footerLabel}>Total Payable</Text>
          <Text style={styles.footerPrice}>{formatPaise(totalAmountPaise)}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => {
            router.push({
              pathname: '/(customer)/checkout',
              params: { fulfillmentMode }
            });
          }}
          style={styles.checkoutBtn}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          <ArrowRight size={18} color="#ffffff" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#ffffff'
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  centerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center'
  },
  centerSub: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 280
  },
  primaryBtn: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 24
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 12,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerLeft: {
    flex: 1
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a'
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '700',
    marginTop: 1
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fee2e2'
  },
  clearText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ef4444',
    marginLeft: 4
  },
  scrollContent: {
    padding: 16
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12
  },
  storeLogoBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  storeTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.5
  },
  storeName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 1
  },
  storeAddress: {
    fontSize: 11,
    color: '#64748b'
  },
  singleStoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  singleStoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
    marginLeft: 3
  },
  movCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fef3c7',
    marginBottom: 16
  },
  movCardSuccess: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0'
  },
  movRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  movIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  movTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a'
  },
  movSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginTop: 10,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 3
  },
  progressBarFillSuccess: {
    backgroundColor: '#047857'
  },
  itemsSection: {
    marginBottom: 16
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 10
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    overflow: 'hidden'
  },
  itemImage: {
    width: '100%',
    height: '100%'
  },
  itemDetails: {
    flex: 1,
    marginHorizontal: 12
  },
  itemBrand: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600'
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 17
  },
  itemPackPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2
  },
  itemPackText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600'
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: '#064e3b',
    marginTop: 4
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
    padding: 4
  },
  stepperQty: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 8
  },
  fulfillmentSection: {
    marginBottom: 16
  },
  fulfillmentRow: {
    flexDirection: 'row',
    gap: 10
  },
  fulfillmentCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0'
  },
  fulfillmentCardActive: {
    borderColor: '#047857',
    backgroundColor: '#f0fdf4'
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  radioCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#94a3b8',
    marginRight: 6
  },
  radioCircleActive: {
    borderColor: '#047857',
    backgroundColor: '#047857'
  },
  fulfillmentTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a'
  },
  fulfillmentFee: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2
  },
  fulfillmentFeeFree: {
    fontSize: 14,
    fontWeight: '900',
    color: '#047857',
    marginTop: 2
  },
  fulfillmentSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2
  },
  billCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  billTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 12
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  billLabel: {
    fontSize: 13,
    color: '#64748b'
  },
  billValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a'
  },
  billValueFree: {
    color: '#047857',
    fontWeight: '800'
  },
  billDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a'
  },
  taxInclusiveText: {
    fontSize: 10,
    color: '#94a3b8'
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#064e3b'
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8
  },
  footerPriceCol: {
    flexDirection: 'column'
  },
  footerLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600'
  },
  footerPrice: {
    fontSize: 19,
    fontWeight: '900',
    color: '#064e3b'
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064e3b',
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14
  },
  checkoutBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginRight: 6
  }
});
