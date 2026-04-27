import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as api from '../services/api';

export interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function verifyAuth() {
      try {
        const result = await api.verifyAuth();
        if (!cancelled) {
          setIsAuthenticated(result.success && !!result.data?.valid);
        }
      } catch {
        if (!cancelled) {
          setIsAuthenticated(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    verifyAuth();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await api.login(username, password);
    if (result.success) {
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: result.error };
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setIsAuthenticated(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ isAuthenticated, isLoading, login, logout }),
    [isAuthenticated, isLoading, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return ctx;
}
