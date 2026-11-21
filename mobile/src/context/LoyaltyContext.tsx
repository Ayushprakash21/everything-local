import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoyaltyProfile, PromoOffer } from '../types';

interface LoyaltyContextType {
  profile: LoyaltyProfile;
  offers: PromoOffer[];
  applyReferral: (code: string) => Promise<{ success: boolean; message: string }>;
  redeemPoints: (points: number) => Promise<{ success: boolean; discountPaise: number }>;
}

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);
const LOYALTY_STORAGE = 'el_loyalty_data_v1';

export const LoyaltyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<LoyaltyProfile>({
    pointsBalance: 450,
    tier: 'GOLD',
    referralCode: 'INDORE-AYUSH-100',
    referralCount: 4,
    savingsPaiseThisMonth: 12500 // ₹125.00 saved
  });

  const offers: PromoOffer[] = [
    {
      id: 'OFFER-1',
      code: 'FIRSTLOCAL',
      title: '₹50 OFF on Your First Order',
      discountPaise: 5000,
      minOrderPaise: 29900,
      description: 'Valid for new customers across all Indore stores.'
    },
    {
      id: 'OFFER-2',
      code: 'PALASIAFREE',
      title: 'Free Delivery at Palasia Kirana',
      discountPaise: 2500,
      minOrderPaise: 29900,
      storeCategory: 'grocery',
      description: 'Merchant-funded delivery voucher for neighbourhood orders.'
    },
    {
      id: 'OFFER-3',
      code: 'SAVEMORE',
      title: 'Flat ₹75 OFF on Orders above ₹699',
      discountPaise: 7500,
      minOrderPaise: 69900,
      description: 'Weekend neighbourhood grocery savings.'
    }
  ];

  const applyReferral = async (code: string) => {
    if (code.toUpperCase() === profile.referralCode) {
      return { success: false, message: 'You cannot use your own referral code.' };
    }
    setProfile((prev) => ({
      ...prev,
      pointsBalance: prev.pointsBalance + 100
    }));
    return { success: true, message: '100 Welcome Points added to your wallet!' };
  };

  const redeemPoints = async (points: number) => {
    if (points > profile.pointsBalance) {
      return { success: false, discountPaise: 0 };
    }
    // 1 point = 25 paise (₹0.25)
    const discountPaise = points * 25;
    setProfile((prev) => ({
      ...prev,
      pointsBalance: prev.pointsBalance - points
    }));
    return { success: true, discountPaise };
  };

  return (
    <LoyaltyContext.Provider value={{ profile, offers, applyReferral, redeemPoints }}>
      {children}
    </LoyaltyContext.Provider>
  );
};

export const useLoyalty = () => {
  const context = useContext(LoyaltyContext);
  if (!context) {
    throw new Error('useLoyalty must be used within a LoyaltyProvider');
  }
  return context;
};
