import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HouseholdItem } from '../types';

interface HouseholdContextType {
  items: HouseholdItem[];
  addItem: (title: string, quantity?: string, category?: string) => Promise<void>;
  toggleItem: (id: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearCompleted: () => Promise<void>;
  convertRecipeToList: (recipeQuery: string) => Promise<HouseholdItem[]>;
  isLoading: boolean;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);
const STORAGE_KEY = 'el_household_items_v1';

export const HouseholdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<HouseholdItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setItems(JSON.parse(raw));
        } else {
          // Default initial household items
          const defaults: HouseholdItem[] = [
            { id: '1', title: 'Aashirvaad Atta', quantity: '5 kg', category: 'Grocery Staples', isCompleted: false, addedBy: 'Ayush' },
            { id: '2', title: 'Sanchi Gold Milk', quantity: '2 packets', category: 'Dairy & Bakery', isCompleted: false, addedBy: 'Pooja' },
            { id: '3', title: 'Malwa Potatoes', quantity: '2 kg', category: 'Vegetables', isCompleted: true, addedBy: 'Ayush' }
          ];
          setItems(defaults);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
        }
      } catch (e) {
        console.error('Failed to load household items:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadItems();
  }, []);

  const saveItems = async (newItems: HouseholdItem[]) => {
    setItems(newItems);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
  };

  const addItem = async (title: string, quantity: string = '1 unit', category: string = 'General Essentials') => {
    const newItem: HouseholdItem = {
      id: Date.now().toString(),
      title,
      quantity,
      category,
      isCompleted: false,
      addedBy: 'Me'
    };
    await saveItems([newItem, ...items]);
  };

  const toggleItem = async (id: string) => {
    const updated = items.map((i) => (i.id === id ? { ...i, isCompleted: !i.isCompleted } : i));
    await saveItems(updated);
  };

  const removeItem = async (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    await saveItems(updated);
  };

  const clearCompleted = async () => {
    const updated = items.filter((i) => !i.isCompleted);
    await saveItems(updated);
  };

  // Recipe-to-Shopping-List Smart AI Engine
  const convertRecipeToList = async (recipeQuery: string): Promise<HouseholdItem[]> => {
    const query = recipeQuery.toLowerCase();
    let generated: Array<{ title: string; quantity: string; category: string }> = [];

    if (query.includes('poha')) {
      generated = [
        { title: 'Indori Thick Poha', quantity: '500g', category: 'Grocery Staples' },
        { title: 'Red Onions', quantity: '500g', category: 'Vegetables' },
        { title: 'Raw Peanuts', quantity: '200g', category: 'Grocery Staples' },
        { title: 'Green Chillies & Lemon', quantity: '100g', category: 'Vegetables' },
        { title: 'Indori Jeeravan Masala', quantity: '1 pack', category: 'Spices & Seasoning' }
      ];
    } else if (query.includes('chai') || query.includes('tea')) {
      generated = [
        { title: 'Tata Tea Gold', quantity: '500g', category: 'Beverages' },
        { title: 'Sanchi Full Cream Milk', quantity: '1L', category: 'Dairy & Bakery' },
        { title: 'Madhur Pure Sugar', quantity: '1kg', category: 'Grocery Staples' },
        { title: 'Fresh Ginger & Cardamom', quantity: '100g', category: 'Vegetables' }
      ];
    } else {
      // General basket optimization
      generated = [
        { title: `${recipeQuery} Base Ingredients`, quantity: '1 pack', category: 'Grocery Staples' },
        { title: 'Cooking Oil / Ghee', quantity: '1L', category: 'Edible Oils' }
      ];
    }

    const newGeneratedItems: HouseholdItem[] = generated.map((g, idx) => ({
      id: `${Date.now()}-${idx}`,
      title: g.title,
      quantity: g.quantity,
      category: g.category,
      isCompleted: false,
      addedBy: 'AI Assistant'
    }));

    await saveItems([...newGeneratedItems, ...items]);
    return newGeneratedItems;
  };

  return (
    <HouseholdContext.Provider
      value={{ items, addItem, toggleItem, removeItem, clearCompleted, convertRecipeToList, isLoading }}
    >
      {children}
    </HouseholdContext.Provider>
  );
};

export const useHousehold = () => {
  const context = useContext(HouseholdContext);
  if (!context) {
    throw new Error('useHousehold must be used within a HouseholdProvider');
  }
  return context;
};
