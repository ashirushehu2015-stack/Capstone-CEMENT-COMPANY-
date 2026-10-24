import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types/index.ts';
import { apiAuth, getStoredToken, clearStoredToken } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    companyName?: string;
    officeAddress?: string;
    homeAddress?: string;
    address?: string;
    city?: string;
    state?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  switchUserRoleDemo: (role: UserRole) => Promise<void>;
  // Role helpers
  isCustomer: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isAssistantManager: boolean;
  isAgent: boolean;
  isStoreManager: boolean;
  isSalesOfficer: boolean;
  isCashier: boolean;
  isDeliveryOfficer: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Quick Demo accounts mapping for A.A. Master Nig. Limited (Manager, Asst. Manager, Agent, Customer)
export const DEMO_ACCOUNTS: Record<UserRole, { email: string; pass: string; label: string; role: UserRole }> = {
  CUSTOMER: { email: 'buyer@aamaster.ng', pass: 'Buyer123!', label: 'Customer Facing Portal (Alhaji Mukhtar Dan-Kano)', role: 'CUSTOMER' },
  MANAGER: { email: 'manager@aamaster.ng', pass: 'Manager123!', label: 'Manager (Engr. Sanusi Kalambaina — Approval & Payment Verification)', role: 'MANAGER' },
  ASSISTANT_MANAGER: { email: 'asstmanager@aamaster.ng', pass: 'AsstManager123!', label: 'Assistant Manager (Fatima Aliyu — Queue Verification)', role: 'ASSISTANT_MANAGER' },
  AGENT: { email: 'agent@aamaster.ng', pass: 'Agent123!', label: 'Agent (Haruna Danladi — Production Site Stock Issuance)', role: 'AGENT' },
  // Legacy compatibility fallbacks
  ADMIN: { email: 'manager@aamaster.ng', pass: 'Manager123!', label: 'Manager (Engr. Sanusi Kalambaina)', role: 'ADMIN' },
  STORE_MANAGER: { email: 'manager@aamaster.ng', pass: 'Manager123!', label: 'Manager (Engr. Sanusi Kalambaina)', role: 'STORE_MANAGER' },
  SALES_OFFICER: { email: 'asstmanager@aamaster.ng', pass: 'AsstManager123!', label: 'Assistant Manager (Fatima Aliyu)', role: 'SALES_OFFICER' },
  DELIVERY_OFFICER: { email: 'agent@aamaster.ng', pass: 'Agent123!', label: 'Agent (Haruna Danladi)', role: 'DELIVERY_OFFICER' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      const stored = getStoredToken();
      if (!stored) {
        setUser(null);
        setToken(null);
        setIsLoading(false);
        return;
      }

      try {
        const res = await apiAuth.getMe();
        setUser(res.user);
        setToken(stored);
      } catch {
        setUser(null);
        setToken(null);
        clearStoredToken();
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiAuth.login({ email, password });
      setUser(res.user);
      setToken(res.token);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: Parameters<typeof apiAuth.register>[0]) => {
    setIsLoading(true);
    try {
      const res = await apiAuth.register(data);
      setUser(res.user);
      setToken(res.token);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiAuth.logout();
    } finally {
      setUser(null);
      setToken(null);
      setIsLoading(false);
    }
  };

  const switchUserRoleDemo = async (role: UserRole) => {
    const creds = DEMO_ACCOUNTS[role];
    if (creds) {
      await login(creds.email, creds.pass);
    }
  };

  const role = user?.role;
  const isCustomer = role === 'CUSTOMER';
  const isAdmin = role === 'ADMIN';
  const isManager = role === 'MANAGER' || role === 'STORE_MANAGER' || role === 'ADMIN';
  const isAssistantManager = role === 'ASSISTANT_MANAGER' || role === 'SALES_OFFICER';
  const isAgent = role === 'AGENT' || role === 'DELIVERY_OFFICER';
  const isStoreManager = role === 'STORE_MANAGER' || role === 'MANAGER';
  const isSalesOfficer = role === 'SALES_OFFICER' || role === 'ASSISTANT_MANAGER';
  const isCashier = false;
  const isDeliveryOfficer = role === 'DELIVERY_OFFICER' || role === 'AGENT';
  const isStaff = !isCustomer && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        switchUserRoleDemo,
        isCustomer,
        isAdmin,
        isManager,
        isAssistantManager,
        isAgent,
        isStoreManager,
        isSalesOfficer,
        isCashier,
        isDeliveryOfficer,
        isStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
