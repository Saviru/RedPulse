import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from '../utils/storage';
import { authService, LoginCredentials, RegisterData } from '../services/authService';
import { setSession, clearSession } from '../../app/lib/session';

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
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        // fetch user profile with the token
        const response = await authService.getMe();
        if (response && response.email) {
          setUser(response);
        } else {
          // Token is invalid/expired
          await SecureStore.deleteItemAsync('userToken');
        }
      }
    } catch (error) {
      console.log('Error loading token', error);
      await SecureStore.deleteItemAsync('userToken');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authService.getMe();
      if (response) {
        setUser(response);
      }
    } catch (error) {
      console.error('Error refreshing user', error);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      if (response && response.accessToken) {
        await SecureStore.setItemAsync('userToken', response.accessToken);
        setSession(response.accessToken, {
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
  };

  const register = async (data: RegisterData) => {
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
  };

  const verifyRegistration = async (email: string, otp: string) => {
    setIsLoading(true);
    try {
      const response = await authService.verifyRegistration(email, otp);
      if (response && response.accessToken) {
        await SecureStore.setItemAsync('userToken', response.accessToken);
        setSession(response.accessToken, {
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
  };

  const resendOtp = async (email: string, purpose: 'REGISTER' | 'DELETE') => {
    try {
      await authService.resendOtp(email, purpose);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await SecureStore.deleteItemAsync('userToken');
      clearSession();
      setUser(null);
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const requestDeleteAccount = async () => {
    try {
      await authService.requestDelete();
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      throw error;
    }
  };

  const confirmDeleteAccount = async (otp: string) => {
    try {
      await authService.confirmDelete(otp);
      await SecureStore.deleteItemAsync('userToken');
      setUser(null);
    } catch (error) {
      console.error('Error confirming account deletion:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user, isLoading, login, register, logout, updateProfile,
      requestDeleteAccount, confirmDeleteAccount, refreshUser, verifyRegistration, resendOtp
    }}>
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
