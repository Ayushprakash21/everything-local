import React, { createContext, useContext, useState, useEffect } from 'react';
import { Cart, CartItem, Product } from '../types';
import { request, ApiError } from '../api/client';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  itemCount: number;
  subtotalPaise: number;
  shortfallPaise: number;
  meetsMinimumOrderValue: boolean;
  isLoading: boolean;
  addItem: (storeId: string, productId: string, quantity?: number) => Promise<{ success: boolean; conflictMessage?: string }>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [subtotalPaise, setSubtotalPaise] = useState<number>(0);
  const [shortfallPaise, setShortfallPaise] = useState<number>(0);
  const [meetsMinimumOrderValue, setMeetsMinimumOrderValue] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshCart = async () => {
    if (!user) {
      setCart(null);
      setSubtotalPaise(0);
      setShortfallPaise(29900);
      setMeetsMinimumOrderValue(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await request<any>('/customer/cart');
      setCart(res.cart);
      setSubtotalPaise(res.subtotalPaise || 0);
      setShortfallPaise(res.shortfallPaise || 0);
      setMeetsMinimumOrderValue(res.meetsMinimumOrderValue ?? false);
    } catch {
      // Offline fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [user]);

  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const addItem = async (
    storeId: string,
    productId: string,
    quantity: number = 1
  ): Promise<{ success: boolean; conflictMessage?: string }> => {
    if (!user) {
      return { success: false, conflictMessage: 'Please sign in to add items to your cart.' };
    }

    try {
      await request('/customer/cart/items', {
        method: 'POST',
        body: JSON.stringify({ storeId, productId, quantity })
      });
      await refreshCart();
      return { success: true };
    } catch (error: any) {
      if (error instanceof ApiError && error.data?.storeConflict) {
        return {
          success: false,
          conflictMessage: error.data.message
        };
      }
      return {
        success: false,
        conflictMessage: error.message || 'Failed to add item to cart'
      };
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!cart?.storeId) return;
    try {
      await request('/customer/cart/items', {
        method: 'POST',
        body: JSON.stringify({
          storeId: cart.storeId,
          productId,
          quantity
        })
      });
      await refreshCart();
    } catch (e) {
      console.error(e);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await request(`/customer/cart/items/${itemId}`, { method: 'DELETE' });
      await refreshCart();
    } catch (e) {
      console.error(e);
    }
  };

  const clearCart = async () => {
    try {
      await request('/customer/cart', { method: 'DELETE' });
      await refreshCart();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        subtotalPaise,
        shortfallPaise,
        meetsMinimumOrderValue,
        isLoading,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
