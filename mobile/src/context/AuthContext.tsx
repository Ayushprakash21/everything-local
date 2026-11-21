import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { request } from '../api/client';
import { SecureStorage } from '../utils/secureStore';
import { NotificationService } from '../utils/notifications';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isLoading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<User>;
  register: (data: { email: string; name: string; password: string; role: UserRole; phone?: string }) => Promise<User>;
  logout: () => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const token = await SecureStorage.getToken();
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const res = await request<{ user: User }>('/auth/me');
      setUser(res.user);
      setRole(res.user.role);
      await SecureStorage.saveUser(res.user);

      // Register device for push notifications
      NotificationService.registerForPushNotificationsAsync();
    } catch (err) {
      console.warn('Session expired, clearing storage');
      await SecureStorage.clearAll();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (emailOrPhone: string, password: string): Promise<User> => {
    const res = await request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrPhone, password })
    });

    await SecureStorage.saveToken(res.token);
    await SecureStorage.saveUser(res.user);
    setUser(res.user);
    setRole(res.user.role);

    NotificationService.registerForPushNotificationsAsync();
    return res.user;
  };

  const register = async (data: { email: string; name: string; password: string; role: UserRole; phone?: string }): Promise<User> => {
    const res = await request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    await SecureStorage.saveToken(res.token);
    await SecureStorage.saveUser(res.user);
    setUser(res.user);
    setRole(res.user.role);
    return res.user;
  };

  const logout = async () => {
    await SecureStorage.clearAll();
    setUser(null);
    setRole('CUSTOMER');
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
  };

  return (
    <AuthContext.Provider value={{ user, role, isLoading, login, register, logout, switchRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
