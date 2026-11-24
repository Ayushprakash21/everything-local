function resolveApiBase(): string {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('dev') || host.includes('localhost') || host.includes('127.0.0.1')) {
      return host.includes('workers.dev')
        ? 'https://everybazaar-api-dev.everything-local.workers.dev'
        : '';
    }
    if (host.includes('workers.dev') || host.includes('everybazar') || host.includes('everybazaar') || host.includes('everythinglocal')) {
      return 'https://everything-local-api.everything-local.workers.dev';
    }
  }
  return '';
}

const API_BASE = resolveApiBase();
const BASE_URL = `${API_BASE}/api`;

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
  const token = localStorage.getItem('el_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(response.status, data.error || data.message || 'Request failed', data);
  }

  return data as T;
}

export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(rupees);
}
