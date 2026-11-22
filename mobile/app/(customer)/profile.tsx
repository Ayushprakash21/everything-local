import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useLoyalty } from '../../src/context/LoyaltyContext';
import { formatPaise } from '../../src/utils/format';
import { ELLogo } from '../../src/components/ELLogo';
import {
  User as UserIcon,
  Award,
  Share2,
  Package,
  Store,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Tag
} from 'lucide-react-native';

export default function CustomerProfileScreen() {
  const router = useRouter();
  const { user, logout, switchRole } = useAuth();
  const { profile, offers } = useLoyalty();

  const handleShareReferral = async () => {
    try {
      await Share.share({
        message: `Join Everything Local in Indore with my code ${profile.referralCode} and get ₹50 off your first neighbourhood order! https://everythinglocal.in/join`
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSwitchToSeller = () => {
    switchRole('MERCHANT');
    router.replace('/(merchant)');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <ELLogo variant="dark" size={32} />
          <Text style={styles.headerTitle}>Account & Rewards</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <UserIcon size={24} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.name || 'Guest Shopper'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'Sign in to access rewards'}</Text>
          </View>
          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>{user?.role || 'GUEST'}</Text>
          </View>
        </View>

        {/* Loyalty & Savings Dashboard (Ecosystem 6) */}
        <View style={styles.loyaltyCard}>
          <View style={styles.loyaltyTop}>
            <View style={styles.loyaltyIcon}>
              <Award size={22} color="#ffffff" />
            </View>
            <View>
              <Text style={styles.tierText}>{profile.tier} MEMBER</Text>
              <Text style={styles.pointsText}>{profile.pointsBalance} Points</Text>
            </View>
          </View>

          <View style={styles.savingsRow}>
            <Text style={styles.savingsLabel}>Household Savings this month:</Text>
            <Text style={styles.savingsValue}>{formatPaise(profile.savingsPaiseThisMonth)}</Text>
          </View>
        </View>

        {/* Referral Program Card */}
        <View style={styles.referralCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.referralTag}>INVITE NEIGHBORS</Text>
            <Text style={styles.referralTitle}>Share code & earn ₹100</Text>
            <Text style={styles.referralCodeText}>{profile.referralCode}</Text>
          </View>
          <TouchableOpacity onPress={handleShareReferral} style={styles.shareBtn}>
            <Share2 size={16} color="#059669" />
            <Text style={styles.shareBtnText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Exclusive Merchant Offers */}
        <View style={styles.offersSection}>
          <Text style={styles.sectionTitle}>Neighbourhood Offers & Vouchers</Text>
          {offers.map((offer) => (
            <View key={offer.id} style={styles.offerCard}>
              <Tag size={16} color="#059669" />
              <View style={{ flex: 1 }}>
                <Text style={styles.offerTitle}>{offer.title}</Text>
                <Text style={styles.offerDesc}>{offer.description}</Text>
              </View>
              <View style={styles.codePill}>
                <Text style={styles.codePillText}>{offer.code}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Navigation Action Links */}
        <View style={styles.menuCard}>
          <TouchableOpacity
            onPress={() => router.push('/(customer)/orders')}
            style={styles.menuRow}
          >
            <View style={styles.menuLeft}>
              <Package size={18} color="#0f172a" />
              <Text style={styles.menuTitle}>My Order History</Text>
            </View>
            <ChevronRight size={18} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSwitchToSeller}
            style={[styles.menuRow, { borderBottomWidth: 0 }]}
          >
            <View style={styles.menuLeft}>
              <Store size={18} color="#059669" />
              <Text style={[styles.menuTitle, { color: '#059669' }]}>Switch to Merchant Portal</Text>
            </View>
            <ChevronRight size={18} color="#059669" />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        {user ? (
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <LogOut size={16} color="#ef4444" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => router.push('/auth/login')}
            style={styles.signInBtn}
          >
            <Text style={styles.signInText}>Sign In to Account</Text>
          </TouchableOpacity>
        )}
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
    paddingBottom: 40,
    gap: 16,
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  userEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  roleTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  loyaltyCard: {
    backgroundColor: '#047857',
    borderRadius: 24,
    padding: 20,
    gap: 14,
  },
  loyaltyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loyaltyIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#a7f3d0',
    letterSpacing: 0.5,
  },
  pointsText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  savingsLabel: {
    fontSize: 12,
    color: '#d1fae5',
    fontWeight: '600',
  },
  savingsValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  referralCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  referralTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  referralTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  referralCodeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#059669',
    marginTop: 4,
    letterSpacing: 1,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  offersSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  offerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  offerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  offerDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  codePill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  codePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
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
  signInBtn: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  signInText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
