import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthenticatedUser, UserRole, LoginRequestDto, LoginResponseData, ActivateAccountDto } from '@internos/types';
import { Permission, hasPermission as checkPermission, normalizeRole } from '@internos/shared';
import { apiClient } from '../services/apiClient';

interface AuthContextType {
  user: AuthenticatedUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (dto: LoginRequestDto) => Promise<{ success: boolean; user?: AuthenticatedUser; error?: string }>;
  logout: () => Promise<void>;
  activateAccount: (dto: ActivateAccountDto) => Promise<{ success: boolean; error?: string; message?: string }>;
  hasRole: (...roles: (UserRole | string)[]) => boolean;
  hasPermission: (permission: Permission) => boolean;
  switchDemoRole: (role: UserRole | string, orgCode?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(() => {
    const saved = localStorage.getItem('internos_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('internos_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyAuth() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await apiClient.get<AuthenticatedUser>('/api/v1/auth/me');
        if (response.success && response.data) {
          setUser(response.data);
          localStorage.setItem('internos_user', JSON.stringify(response.data));
        } else {
          // Token invalid
          localStorage.removeItem('internos_token');
          localStorage.removeItem('internos_user');
          setToken(null);
          setUser(null);
        }
      } catch {
        // Keep cached user if offline
      } finally {
        setIsLoading(false);
      }
    }

    verifyAuth();
  }, [token]);

  const login = async (dto: LoginRequestDto) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<LoginResponseData>('/api/v1/auth/login', dto);
      if (response.success && response.data) {
        const { token: receivedToken, user: receivedUser } = response.data;
        setToken(receivedToken);
        setUser(receivedUser);
        localStorage.setItem('internos_token', receivedToken);
        localStorage.setItem('internos_user', JSON.stringify(receivedUser));
        return { success: true, user: receivedUser };
      }
      return {
        success: false,
        error: response.error?.message || 'Login failed. Please verify credentials.',
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network error during login',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } catch {
      // ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('internos_token');
      localStorage.removeItem('internos_user');
    }
  };

  const activateAccount = async (dto: ActivateAccountDto) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<{ message: string }>('/api/v1/auth/activate', dto);
      if (response.success) {
        return { success: true, message: response.data?.message || 'Account activated successfully!' };
      }
      return {
        success: false,
        error: response.error?.message || 'Account activation failed. Token may be invalid or expired.',
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to activate account',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = (...roles: (UserRole | string)[]) => {
    if (!user) return false;
    const current = normalizeRole(user.role);
    const normalized = roles.map(normalizeRole);
    return normalized.includes(current);
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return checkPermission(user.role, permission);
  };

  const switchDemoRole = async (role: UserRole | string, orgCode = 'ORG_A') => {
    const roleKey = normalizeRole(role);
    const domain = orgCode === 'ORG_B' ? 'org-b.com' : 'org-a.com';
    const email = `${roleKey.toLowerCase()}@${domain}`;

    await login({
      email,
      password: 'Password123!',
      organizationCode: orgCode,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        activateAccount,
        hasRole,
        hasPermission,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
