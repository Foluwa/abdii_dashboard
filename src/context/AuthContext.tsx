"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, handleApiError } from '@/lib/api';
import { User, UserRole, AdminLoginRequest, AdminLoginResponse, hasPermission } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: AdminLoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkPermission: (permission: string) => boolean;
  isAdmin: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider Component
 * Manages authentication state and user session
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log('🔐 AUTH STATE CHANGED:', {
      isAuthenticated: !!user,
      userEmail: user?.email,
      userRole: user?.role,
      isLoading
    });
  }, [user, isLoading]);

  /**
   * Load user from sessionStorage on mount
   * sessionStorage is more secure as it clears when browser/tab closes
   */
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = sessionStorage.getItem('user');
        const accessToken = sessionStorage.getItem('access_token');
        
        // Validate both user data and token exist
        if (storedUser && accessToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          console.log('User loaded from sessionStorage:', parsedUser.email);
        } else {
          // Clear invalid session
          console.log('No valid session found, clearing storage');
          sessionStorage.clear();
        }
      } catch (error) {
        console.error('Failed to load user from sessionStorage:', error);
        sessionStorage.clear();
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  /**
   * Login function
   */
  const login = async (credentials: AdminLoginRequest) => {
    try {
      const response = await apiClient.post<AdminLoginResponse>(
        '/api/v1/auth/admin/login',
        credentials
      );

      const { user: userData, access_token, refresh_token } = response.data;

      console.log('Login successful, storing tokens...');
      console.log('Access token length:', access_token?.length);
      console.log('User role:', userData.role);

      // Store tokens FIRST in sessionStorage (more secure - clears on browser/tab close)
      sessionStorage.setItem('access_token', access_token);
      sessionStorage.setItem('refresh_token', refresh_token);
      sessionStorage.setItem('user', JSON.stringify(userData));

      // Set a client-side cookie for middleware detection (session cookie)
      document.cookie = `user=${encodeURIComponent(JSON.stringify(userData))}; path=/; SameSite=Strict; Secure`;

      // Update state
      setUser(userData);

      console.log('Tokens stored, user state updated');

      // Wait longer to ensure everything is set
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('Redirecting to dashboard...');
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  };

  /**
   * Logout function
   * Clears all auth data and redirects to login
   */
  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      
      // Clear state first to prevent any race conditions
      setUser(null);
      
      // Clear all session storage (more thorough than removing individual items)
      sessionStorage.clear();

      // Clear client-side cookie
      document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      console.log('✅ Logout complete, redirecting to login');
      
      // Force a hard redirect to login page (clears all state)
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even on error
      sessionStorage.clear();
      document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.location.href = '/';
    }
  };

  /**
   * Check if user has specific permission
   */
  const checkPermission = (permission: string): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    checkPermission,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Hook to require authentication
 * Protects routes by redirecting unauthenticated users
 */
export const useRequireAuth = (requiredPermission?: string) => {
  const { isAuthenticated, isLoading, checkPermission, user } = useAuth();
  const router = useRouter();
  const [shouldRender, setShouldRender] = React.useState(false);

  useEffect(() => {
    console.log('🔒 ROUTE PROTECTION CHECK:', {
      isLoading,
      isAuthenticated,
      hasToken: !!sessionStorage.getItem('access_token'),
      currentPath: window.location.pathname,
      requiredPermission,
      userRole: user?.role
    });

    // Don't redirect while still loading
    if (isLoading) {
      console.log('⏳ Still loading auth state, skipping redirect check');
      setShouldRender(false);
      return;
    }

    // Check if we have tokens in sessionStorage as a fallback
    const hasToken = typeof window !== 'undefined' && sessionStorage.getItem('access_token');
    
    // Only redirect if truly not authenticated (no user AND no token)
    if (!isAuthenticated && !hasToken) {
      console.log('❌ Not authenticated, redirecting to login');
      setShouldRender(false);
      // Prevent redirect loops - only redirect once
      if (window.location.pathname !== '/') {
        router.replace('/');
      }
      return;
    }

    // Check permission if required
    if (requiredPermission && user && !checkPermission(requiredPermission)) {
      console.log('⛔ Permission denied, redirecting to dashboard');
      setShouldRender(false);
      if (window.location.pathname !== '/dashboard') {
        router.replace('/dashboard');
      }
      return;
    }

    // If we get here, user is authenticated
    console.log('✅ Authentication check passed, rendering content');
    setShouldRender(true);
  }, [isAuthenticated, isLoading, requiredPermission, checkPermission, router, user]);

  return { isLoading: isLoading || !shouldRender };
};
