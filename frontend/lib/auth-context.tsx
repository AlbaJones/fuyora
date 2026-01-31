'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from './api';
import type { User, AuthContextType, RegisterData } from './types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Check if banned and redirect
  useEffect(() => {
    if (user?.is_banned && window.location.pathname !== '/banned') {
      router.push('/banned');
    }
  }, [user, router]);

  const checkAuth = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      // Get current user from backend
      const response = await api.get('/auth/me');
      const userData = response.data.user;
      
      // Add can_sell computed property
      const userWithPermissions = {
        ...userData,
        can_sell: userData.kyc_status === 'APPROVED',
      };
      
      setUser(userWithPermissions);
    } catch (error) {
      // Token invalid, clear it
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;
      
      // Add can_sell computed property
      const userWithPermissions = {
        ...userData,
        can_sell: userData.kyc_status === 'APPROVED',
      };
      
      // Store token
      localStorage.setItem(TOKEN_KEY, token);
      setUser(userWithPermissions);

      // Redirect based on ban status
      if (userWithPermissions.is_banned) {
        router.push('/banned');
        return;
      }

      // Redirect based on permissions
      if (userWithPermissions.is_admin) {
        router.push('/admin/dashboard');
      } else if (userWithPermissions.can_sell) {
        router.push('/seller/products');
      } else {
        router.push('/products');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao fazer login');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await api.post('/auth/register', data);
      const { token, user: userData } = response.data;
      
      // Add can_sell computed property
      const userWithPermissions = {
        ...userData,
        can_sell: userData.kyc_status === 'APPROVED',
      };
      
      // Store token
      localStorage.setItem(TOKEN_KEY, token);
      setUser(userWithPermissions);

      // After registration, always redirect to marketplace
      // Users can navigate to KYC if they want to sell
      router.push('/products');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao criar conta');
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      router.push('/');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper to get token
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
