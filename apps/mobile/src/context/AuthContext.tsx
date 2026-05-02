import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import * as SecureStore from '../utils/storage';
import { authService, LoginCredentials, RegisterData } from '../services/authService';
import { setSession, clearSession, getAccessToken } from '../lib/session';

interface User {
  email: string;
  username: string;
  role: 'USER' | 'ORGANIZATION' | 'HOSPITAL';
  fullName?: string;
  nic?: string;
  dob?: string;
  bloodGroup?: string;
  location?: string;
  weight?: string;
  phone?: string;
  // Organization fields
  organizationName?: string;
  registrationNumber?: string;
  website?: string;
  orgType?: 'NGO' | 'GOVERNMENT' | 'PRIVATE' | 'OTHER';
  // Hospital fields
  hospitalName?: string;
  licenseNumber?: string;
  address?: string;
  emergencyContact?: string;
  createdAt?: string;
  points?: number;
  lastDonationDate?: string;
  totalDonations?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  requestDeleteAccount: () => Promise<void>;
  confirmDeleteAccount: (otp: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  verifyRegistration: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string, purpose: 'REGISTER' | 'DELETE') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if token exists on app mount
    loadStoredToken();
  }, []);

  const loadStoredToken = async () => {
    try {
      console.log('Auth: loadStoredToken start');
      const token = await getAccessToken();
      console.log(`Auth: Token check complete (found: ${!!token})`);

      if (token) {
        console.log('Auth: Fetching profile with token...');
        const response = await authService.getMe();
        console.log(`Auth: Profile fetch success (username: ${response?.username})`);
        if (response && response.email) {
          await setSession(token, {
            username: response.username,
            role: response.role.toLowerCase() as any
          });
          setUser(response);
        } else {
          console.warn('Auth: Invalid profile response, clearing session');
          await clearSession();
        }
      } else {
        console.log('Auth: No token found in storage');
      }
    } catch (error) {
      console.error('Auth: Error loading token or profile', error);
      await clearSession();
    } finally {
      setIsLoading(false);
      console.log('Auth: loadStoredToken finished, isLoading=false');
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      console.log('Auth: refreshUser start');
      const token = await getAccessToken();
      if (!token) {
        console.log('Auth: Skip refreshUser, no token found');
        return;
      }
      
      const response = await authService.getMe();
      if (response) {
        setUser(response);
        console.log('Auth: refreshUser success');
      }
    } catch (error) {
      console.error('Auth: Error refreshing user', error);
      // If we get a 401, we should probably clear the session
      if ((error as any)?.response?.status === 401) {
        console.warn('Auth: 401 on refresh, clearing session');
        await clearSession();
        setUser(null);
      }
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      if (response && response.accessToken) {
        await setSession(response.accessToken, {
          username: response.user.username,
          role: response.user.role.toLowerCase() as any
        });
        setUser(response.user);
      } else {
        throw new Error('Login failed: Invalid response format');
      }
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
    setIsLoading(false);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await authService.register(data);
      // OTP verification flow will fetch the token.
      return response;
    } catch (error) {
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyRegistration = useCallback(async (email: string, otp: string) => {
    setIsLoading(true);
    try {
      const response = await authService.verifyRegistration(email, otp);
      if (response && response.accessToken) {
        await setSession(response.accessToken, {
          username: response.user.username,
          role: response.user.role.toLowerCase() as any
        });
        setUser(response.user);
      } else {
        throw new Error('Verification failed: Invalid response format');
      }
    } catch (error) {
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resendOtp = useCallback(async (email: string, purpose: 'REGISTER' | 'DELETE') => {
    try {
      await authService.resendOtp(email, purpose);
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await clearSession();
      setUser(null);
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }, []);

  const requestDeleteAccount = useCallback(async () => {
    try {
      await authService.requestDelete();
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      throw error;
    }
  }, []);

  const confirmDeleteAccount = useCallback(async (otp: string) => {
    try {
      await authService.confirmDelete(otp);
      await SecureStore.deleteItemAsync('userToken');
      setUser(null);
    } catch (error) {
      console.error('Error confirming account deletion:', error);
      throw error;
    }
  }, []);

  const contextValue = React.useMemo(() => ({
    user, 
    isLoading, 
    login, 
    register, 
    logout, 
    updateProfile,
    requestDeleteAccount, 
    confirmDeleteAccount, 
    refreshUser, 
    verifyRegistration, 
    resendOtp
  }), [
    user, 
    isLoading, 
    login, 
    register, 
    logout, 
    updateProfile,
    requestDeleteAccount, 
    confirmDeleteAccount, 
    refreshUser, 
    verifyRegistration, 
    resendOtp
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
