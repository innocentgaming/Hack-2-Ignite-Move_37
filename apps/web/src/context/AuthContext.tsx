import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthenticatedUser, UserRole, LoginRequestDto, LoginResponseData } from '@internos/types';
import { apiClient } from '../services/apiClient';

interface AuthContextType {
  user: AuthenticatedUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (dto: LoginRequestDto) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
  switchDemoRole: (role: UserRole) => Promise<void>;
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
        return { success: true };
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

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('internos_token');
    localStorage.removeItem('internos_user');
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false;
    if (user.role === UserRole.SUPER_ADMIN) return true;
    return roles.includes(user.role);
  };

  const switchDemoRole = async (role: UserRole) => {
    const credentials: Record<UserRole, { email: string; pass: string }> = {
      [UserRole.INSTITUTION_ADMIN]: { email: 'admin@apex.edu', pass: 'Password123!' },
      [UserRole.FACULTY_SUPERVISOR]: { email: 'dr.sharma@apex.edu', pass: 'Password123!' },
      [UserRole.INDUSTRY_MENTOR]: { email: 'raj.patel@acmecloud.com', pass: 'Password123!' },
      [UserRole.STUDENT]: { email: 'alex.student@apex.edu', pass: 'Password123!' },
      [UserRole.SUPER_ADMIN]: { email: 'superadmin@internos.local', pass: 'Password123!' },
    };

    const target = credentials[role];
    if (target) {
      await login({
        email: target.email,
        password: target.pass,
        organizationCode: 'apex-inst',
      });
    }
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
        hasRole,
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
