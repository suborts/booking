
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContextType, LoginRequest, LoginResponse } from '@/types/auth';
import AuthService from '@/services/authService';
import { toast } from '@/hooks/use-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<LoginResponse['body']['userInfo'] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const authService = AuthService.getInstance();

  const login = async (credentials?: LoginRequest): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      
      setToken(response.body.token);
      setUserInfo(response.body.userInfo);
      setIsAuthenticated(true);
      
      toast({
        title: "Authentication Successful",
        description: `Welcome ${response.body.userInfo.name}!`,
      });

      return true;
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: "Authentication Failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUserInfo(null);
    setIsAuthenticated(false);
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  // Auto-login on mount with hardcoded credentials
  useEffect(() => {
    const autoLogin = async () => {
      try {
        const currentToken = authService.getToken();
        if (currentToken && authService.isTokenValid()) {
          setToken(currentToken);
          setIsAuthenticated(true);
        } else {
          // Auto-login with hardcoded credentials
          await login();
        }
      } catch (error) {
        console.error('Auto-login failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    autoLogin();
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    token,
    userInfo,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
