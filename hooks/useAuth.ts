'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import {authAPI, authStorage, User, LoginCredentials, SignupData, UserCompany, OnboardingData} from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  saveOnboardingData: (data: OnboardingData) => Promise<void>;
  isAuthenticated: boolean;
  showOnboarding: boolean;
  onboardingData: UserCompany | null;
  setShowOnboarding: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingData, setOnboardingData] = useState<UserCompany | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = authStorage.getToken();
        if (token) {
          const userData = await authAPI.getCurrentUser();
          setUser(userData);
          authStorage.setUser(userData);
          
          // Fetch onboarding data from backend
          try {
            const userCompany = await authAPI.getUserCompany();
            setOnboardingData(userCompany);
            
            // Show onboarding if no company data exists
            if (!userCompany) {
              setShowOnboarding(true);
            }
          } catch (error) {
            console.error('Failed to fetch user company:', error);
            // If there's an error fetching company data, show onboarding
            setShowOnboarding(true);
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        authStorage.clear();
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      
      // Test CORS connection first (optional - can be disabled)
      try {
        await authAPI.testCors();
        // console.log('CORS test successful');
      } catch (corsError) {
        console.warn('CORS test failed, proceeding with login anyway:', corsError);
        // Don't block login if CORS test fails - just warn
        // toast.warning('Server connection test failed, but proceeding with login...');
      }
      
      const response = await authAPI.login(credentials);
      authStorage.setToken(response.access_token);

      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      authStorage.setUser(userData);

      toast.success('Successfully logged in!');

      // Fetch onboarding data from backend
      try {
        const userCompany = await authAPI.getUserCompany();
        setOnboardingData(userCompany);
        
        // Show onboarding if no company data exists
        if (!userCompany) {
          setShowOnboarding(true);
        }
        router.push('/company');

      } catch (error) {
        console.error('Failed to fetch user company:', error);
        setShowOnboarding(true);
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData: SignupData) => {
    try {
      setLoading(true);
      await authAPI.signup(userData);
      toast.success('Account created successfully! Please log in.');
      router.push('/login');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Signup failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const saveOnboardingData = async (data: OnboardingData) => {
    try {
      setLoading(true);
      const userCompany = await authAPI.saveOnboardingData(data);
      setOnboardingData(userCompany);
      setShowOnboarding(false);
      toast.success('Onboarding data saved successfully!');
      router.push('/company');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to save onboarding data';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      setOnboardingData(null);
      authStorage.clear();
      setShowOnboarding(false);
      toast.success('Successfully logged out!');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if the API call fails, clear local storage
      setUser(null);
      setOnboardingData(null);
      authStorage.clear();
      setShowOnboarding(false);
      router.push('/login');
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      setLoading(true);
      const updatedUser = await authAPI.updateProfile(userData);
      setUser(updatedUser);
      authStorage.setUser(updatedUser);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to update profile';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    updateProfile,
    saveOnboardingData,
    isAuthenticated: !!user,
    showOnboarding,
    onboardingData,
    setShowOnboarding
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
