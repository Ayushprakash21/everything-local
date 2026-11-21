import { Platform } from 'react-native';
import { SecureStorage } from '../utils/secureStore';

// Default API URLs for different development and production environments
const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Android Emulator accesses host loopback via 10.0.2.2
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000/api';
  }
  // iOS Simulator / Web
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

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
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
    // Network failure
    throw new ApiError(0, 'Unable to connect to Everything Local network. Please check your internet connection.', {
      networkError: true
    });
  }
}
