import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { User, Store, LoginCredentials, RegisterCredentials, AuthContextType, AuthResponse } from '../types';
import authService from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = authService.getCurrentUser();
        const storedStores = authService.getUserStores();
        const storedCurrentStore = authService.getCurrentStore();

        if (storedUser) {
          setUser(storedUser);
          setStores(storedStores);
          setCurrentStore(storedCurrentStore);
        }
      } catch (error) {
        // Clear any corrupted data
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Clear any existing cache before login to prevent data leakage
      queryClient.clear();
      queryClient.removeQueries();
      
      const response = await authService.login(credentials);
      
      // Check if response exists and has required properties
      if (!response) {
        throw new Error('Login failed: No response received');
      }
      
      if (!response.user) {
        throw new Error('Login failed: User data not received');
      }
      
      setUser(response.user);
      setStores(response.stores || []);
      if (response.stores && response.stores.length > 0) {
        setCurrentStore(response.stores[0]);
      }
      
      // Note: We don't redirect here - let the Login component handle redirect
      // based on whether user has companyId or not
    } catch (error) {
      // Re-throw error to be handled by the component
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      const response = await authService.register(credentials);
      
      // Check if response exists and has required properties
      if (!response) {
        throw new Error('Registration failed: No response received');
      }
      
      if (!response.user) {
        throw new Error('Registration failed: User data not received');
      }
      
      // Always store user data (even if company registration is needed)
      // This allows the user to proceed to company registration
      setUser(response.user);
      setStores(response.stores || []);
      
      // Return response so component can handle redirect
      return response;
    } catch (error) {
      // Re-throw error to be handled by the component
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    // Clear React Query cache to prevent data leakage between users
    queryClient.clear();
    queryClient.removeQueries();
    
    // Clear auth service (localStorage, sessionStorage, cookies)
    await authService.logout();
    
    // Clear local state
    setUser(null);
    setStores([]);
    setCurrentStore(null);
  };

  const updateCurrentStore = (store: Store): void => {
    authService.setCurrentStore(store);
    setCurrentStore(store);
  };

  const updateUser = (updatedUser: User): void => {
    // Update storage
    const userStr = JSON.stringify(updatedUser);
    if (localStorage.getItem('user')) {
      localStorage.setItem('user', userStr);
    } else {
      sessionStorage.setItem('user', userStr);
    }
    // Update state
    setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    stores,
    currentStore,
    login,
    register,
    logout,
    setCurrentStore: updateCurrentStore,
    setUser: updateUser,
    isAuthenticated: !!user,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 