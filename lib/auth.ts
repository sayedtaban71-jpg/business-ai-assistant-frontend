import ApiHelper from '@/utils/apiHelper';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface UserCompany {
  id: string;
  user_id: string;
  name: string;
  url: string;
  description: string;
}

export interface OnboardingData {
  companyName: string;
  companyUrl?: string;
  solution: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export const authAPI = {
  // Test CORS connection
  testCors: async (): Promise<any> => {
    // console.log('Testing CORS connection...');
    const response = await ApiHelper.get(`${process.env.NEXT_PUBLIC_BASE_URL}/test-cors`);
    return response.data;
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    console.log('Attempting login with:', credentials.email);
    const response = await ApiHelper.post(`${API_BASE_URL}/auth/login`, credentials);
    return response.data;
  },

  // Signup user
  signup: async (userData: SignupData): Promise<User> => {
    console.log('Attempting signup with:', userData.email);
    const response = await ApiHelper.post(`${API_BASE_URL}/auth/signup`, userData);
    return response.data;
  },

  // Get current user info
  getCurrentUser: async (): Promise<User> => {
    const response = await ApiHelper.get(`${API_BASE_URL}/auth/me`, {}, {}, {}, true);
    return response.data;
  },

  // Get user Company
  getUserCompany: async (): Promise<UserCompany | null> => {
    const response = await ApiHelper.get(`${API_BASE_URL}/auth/me/company`, {}, {}, {}, true);
    return response.data;
  },

  // Save onboarding data
  saveOnboardingData: async (onboardingData: OnboardingData): Promise<UserCompany> => {
    const response = await ApiHelper.post(`${API_BASE_URL}/auth/me/company`, onboardingData, {}, {}, true);
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await ApiHelper.put(`${API_BASE_URL}/auth/me`, userData, {}, {}, true);
    return response.data;
  },

  // Logout user
  logout: async (): Promise<void> => {
    await ApiHelper.post(`${API_BASE_URL}/auth/logout`, {}, {}, {}, true);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('onboardingData')
  },
};

// Local storage utilities
export const authStorage = {
  setToken: (token: string) => {
    localStorage.setItem('auth_token', token);
    // Also set the token for ApiHelper compatibility
    localStorage.setItem('userToken', token);
  },

  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },

  setUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser: (): User | null => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  clear: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('userToken');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },
};

export default authAPI;
