import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ApiClient } from '../api/client';

export type UserRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'SUPPORT_SUPERVISOR' | 'SUPPORT_AGENT' | 'REQUESTER';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  tenantId: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  tenantId: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, tenantId?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  apiClient: ApiClient;
}

export const defaultApiClient = new ApiClient('/api/v1');

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = 'satem_helpdesk_user';
const STORAGE_KEY_TOKEN = 'satem_helpdesk_token';
const STORAGE_KEY_TENANT = 'satem_helpdesk_tenant';

export const AuthProvider: React.FC<{ children: ReactNode; client?: ApiClient }> = ({
  children,
  client = defaultApiClient,
}) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY_USER);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY_TOKEN) || null;
    } catch {
      return null;
    }
  });

  const [tenantId, setTenantId] = useState<string>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY_TENANT) || 'satem-demo';
    } catch {
      return 'satem-demo';
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sincronizar ApiClient con estado inicial
  useEffect(() => {
    client.setTenant(tenantId);
    if (token) {
      client.setAccessToken(token);
    }
  }, [client, tenantId, token]);

  const login = async (
    email: string,
    password: string,
    targetTenant: string = tenantId || 'satem-demo'
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      client.setTenant(targetTenant);

      const res = await client.request<{ accessToken: string; user: UserProfile }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res.success && res.data) {
        const { accessToken, user: loggedUser } = res.data;
        setUser(loggedUser);
        setToken(accessToken);
        setTenantId(targetTenant);
        client.setAccessToken(accessToken);

        try {
          sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(loggedUser));
          sessionStorage.setItem(STORAGE_KEY_TOKEN, accessToken);
          sessionStorage.setItem(STORAGE_KEY_TENANT, targetTenant);
        } catch {
          // Ignorar errores de almacenamiento local en sandbox
        }

        return { success: true };
      } else {
        return { success: false, error: res.message || res.error || 'Credenciales inválidas.' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de conexión con el servidor.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await client.request('/auth/logout', { method: 'POST' });
    } catch {
      // Ignorar error al cerrar sesión
    } finally {
      setUser(null);
      setToken(null);
      client.setAccessToken(null);
      try {
        sessionStorage.removeItem(STORAGE_KEY_USER);
        sessionStorage.removeItem(STORAGE_KEY_TOKEN);
      } catch {
        // Ignorar
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        tenantId,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        apiClient: client,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
