import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  getItemQuantity: (productId: string) => number;
  addItem: (storeId: string, productId: string, quantity?: number) => Promise<{ success: boolean; conflictMessage?: string }>;
  updateQuantity: (productId: string, quantity: number, storeId?: string) => Promise<{ success: boolean; error?: string }>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_CART_STORAGE_KEY = 'everythinglocal_guest_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(() => {
    try {
      const saved = localStorage.getItem(GUEST_CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [subtotalPaise, setSubtotalPaise] = useState<number>(0);
  const [shortfallPaise, setShortfallPaise] = useState<number>(29900);
  const [meetsMinimumOrderValue, setMeetsMinimumOrderValue] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Synchronize cart with backend when user is logged in
  const refreshCart = useCallback(async () => {
    if (!user) {
      // Unauthenticated: load from localStorage
      try {
        const saved = localStorage.getItem(GUEST_CART_STORAGE_KEY);
        if (saved) {
          const parsedCart: Cart = JSON.parse(saved);
          setCart(parsedCart);
          const total = (parsedCart.items || []).reduce((sum, item) => sum + item.unitPricePaise * item.quantity, 0);
          setSubtotalPaise(total);
          setMeetsMinimumOrderValue(total >= 29900);
          setShortfallPaise(Math.max(0, 29900 - total));
        } else {
          setCart(null);
          setSubtotalPaise(0);
          setShortfallPaise(29900);
          setMeetsMinimumOrderValue(false);
        }
      } catch {
        setCart(null);
      }
      return;
    }

    try {
      setIsLoading(true);
      const res = await request<{
        cart: Cart;
        subtotalPaise: number;
        shortfallPaise: number;
        meetsMinimumOrderValue: boolean;
      }>('/customer/cart');

      setCart(res.cart);
      setSubtotalPaise(res.subtotalPaise || 0);
      setShortfallPaise(res.shortfallPaise || 0);
      setMeetsMinimumOrderValue(res.meetsMinimumOrderValue ?? false);

      // Clear guest cart once logged in and synced
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    } catch (err) {
      console.error('Failed to fetch cart from server:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Fast O(1) quantity map indexed by productId
  const quantitiesByProductId = useMemo(() => {
    const map: Record<string, number> = {};
    if (cart && cart.items) {
      for (const item of cart.items) {
        map[item.productId] = item.quantity;
      }
    }
    return map;
  }, [cart]);

  const getItemQuantity = useCallback((productId: string): number => {
    return quantitiesByProductId[productId] || 0;
  }, [quantitiesByProductId]);

  const itemCount = useMemo(() => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Add Item to Cart (Starts at quantity 1 or increments)
  const addItem = async (
    storeId: string,
    productId: string,
    quantity: number = 1
  ): Promise<{ success: boolean; conflictMessage?: string }> => {
    if (!user) {
      return { success: false, conflictMessage: 'AUTH_REQUIRED' };
    }

    try {
      // Optimistic preview update
      setCart((prev) => {
        if (!prev) return prev;
        const existingIdx = prev.items.findIndex((i) => i.productId === productId);
        let updatedItems = [...prev.items];
        if (existingIdx >= 0) {
          updatedItems[existingIdx] = {
            ...updatedItems[existingIdx],
            quantity: updatedItems[existingIdx].quantity + quantity
          };
        }
        return { ...prev, items: updatedItems };
      });

      await request('/customer/cart/items', {
        method: 'POST',
        body: JSON.stringify({ storeId, productId, quantity })
      });

      await refreshCart();
      return { success: true };
    } catch (error: any) {
      await refreshCart(); // Rollback on error
      if (error.data?.storeConflict) {
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

  // Update Item Quantity directly (0 removes, 1..N updates)
  const updateQuantity = async (
    productId: string,
    quantity: number,
    storeId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'AUTH_REQUIRED' };
    }

    const targetStoreId = storeId || cart?.storeId;
    if (!targetStoreId) {
      return { success: false, error: 'Store information missing' };
    }

    try {
      // Optimistic local state update for zero lag
      setCart((prev) => {
        if (!prev) return prev;
        let updatedItems = [...prev.items];
        const existingIdx = updatedItems.findIndex((i) => i.productId === productId);

        if (quantity <= 0) {
          if (existingIdx >= 0) {
            updatedItems.splice(existingIdx, 1);
          }
        } else if (existingIdx >= 0) {
          updatedItems[existingIdx] = {
            ...updatedItems[existingIdx],
            quantity
          };
        }
        return { ...prev, items: updatedItems };
      });

      await request('/customer/cart/items', {
        method: 'POST',
        body: JSON.stringify({
          storeId: targetStoreId,
          productId,
          quantity: Math.max(0, quantity)
        })
      });

      await refreshCart();
      return { success: true };
    } catch (err: any) {
      await refreshCart(); // Rollback
      return { success: false, error: err.message || 'Failed to update quantity' };
    }
  };

  // Remove specific item by CartItem ID
  const removeItem = async (itemId: string) => {
    if (!user) return;
    try {
      await request(`/customer/cart/items/${itemId}`, { method: 'DELETE' });
      await refreshCart();
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  // Clear Entire Cart
  const clearCart = async () => {
    if (!user) {
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
      setCart(null);
      setSubtotalPaise(0);
      setShortfallPaise(29900);
      setMeetsMinimumOrderValue(false);
      return;
    }

    try {
      await request('/customer/cart', { method: 'DELETE' });
      await refreshCart();
    } catch (err) {
      console.error('Failed to clear cart:', err);
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
        isCartOpen,
        setIsCartOpen,
        getItemQuantity,
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
