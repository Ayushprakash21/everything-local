import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'el_auth_token';
const USER_KEY = 'el_user_data';

export class SecureStorage {
  public static async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK
      });
    }
  }

  public static async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  }

  public static async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  }

  // Token Helpers
  public static async saveToken(token: string): Promise<void> {
    await this.setItem(TOKEN_KEY, token);
  }

  public static async getToken(): Promise<string | null> {
    return await this.getItem(TOKEN_KEY);
  }

  public static async removeToken(): Promise<void> {
    await this.removeItem(TOKEN_KEY);
  }

  // User Profile Cache
  public static async saveUser(user: any): Promise<void> {
    await this.setItem(USER_KEY, JSON.stringify(user));
  }

  public static async getUser(): Promise<any | null> {
    const raw = await this.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public static async clearAll(): Promise<void> {
    await this.removeToken();
    await this.removeItem(USER_KEY);
  }
}
