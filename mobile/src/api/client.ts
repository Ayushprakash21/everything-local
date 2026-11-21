import { Platform } from 'react-native';
import { SecureStorage } from '../utils/secureStore';

/**
 * Authoritative API URL Resolution
 * 1. Always prioritize EXPO_PUBLIC_API_URL injected at build time or via .env
 * 2. In release/standalone builds (!__DEV__), default to production HTTPS API
 * 3. In local dev simulator (__DEV__), provide platform-specific loopback
 */
export const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  // Standalone release builds on physical phones must use HTTPS endpoint, never emulator loopback
  if (!__DEV__) {
    return 'https://api.everythinglocal.in/api';
  }

  // Local development simulator fallbacks
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000/api';
  }
  return 'http://localhost:4000/api';
};

const BASE_URL = getBaseUrl();

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await SecureStorage.getToken();
  const headers = new Headers(options.headers || {});

  // Do not set Content-Type if body is FormData (let browser/runtime set multipart boundary)
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ApiError(
        response.status,
        data.error || data.message || `Request failed with status ${response.status}`,
        data
      );
    }

    return data as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or offline failure
    throw new ApiError(
      0,
      error.message === 'Network request failed'
        ? `Unable to connect to Everything Local API server at ${BASE_URL}. Please check your internet connection.`
        : error.message || 'Network communication error'
    );
  }
}
