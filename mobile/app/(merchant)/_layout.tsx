import React from 'react';
import { Tabs } from 'expo-router';
import { Package, Store, PlusCircle, DollarSign, Settings } from 'lucide-react-native';

export default function MerchantTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dispatch',
          tabBarIcon: ({ color, size }) => <Package size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="catalogue"
        options={{
          title: 'Catalogue',
          tabBarIcon: ({ color, size }) => <Store size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="product/add"
        options={{
          title: 'Add Item',
          tabBarIcon: ({ color, size }) => <PlusCircle size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ color, size }) => <DollarSign size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size - 2} color={color} />,
        }}
      />
    </Tabs>
  );
}
