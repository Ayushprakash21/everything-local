import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { LocationProvider } from '../src/context/LocationContext';
import { CartProvider } from '../src/context/CartContext';
import { HouseholdProvider } from '../src/context/HouseholdContext';
import { LoyaltyProvider } from '../src/context/LoyaltyContext';
import { OfflineBanner } from '../src/components/OfflineBanner';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LocationProvider>
          <CartProvider>
            <HouseholdProvider>
              <LoyaltyProvider>
                <StatusBar style="dark" />
                <OfflineBanner />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="auth/login" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="auth/register" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="(customer)" options={{ headerShown: false }} />
                  <Stack.Screen name="(merchant)" options={{ headerShown: false }} />
                </Stack>
              </LoyaltyProvider>
            </HouseholdProvider>
          </CartProvider>
        </LocationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
