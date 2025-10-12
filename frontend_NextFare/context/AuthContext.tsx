import React, { createContext, useState, useEffect, ReactNode } from "react";
import { User, CreateUserRequest } from "../types/user";
import { LoginCredentials, RegisterData } from "../types/auth";
import AuthService from "../services/AuthService";
import UserApiService from "../services/UserApiService";
import { tokenStorage } from "../utils/tokenStorage";
import client from "../types/client";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // checks if user is already logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // set up axios interceptor to add token to requests
  useEffect(() => {
    const requestInterceptor = client.interceptors.request.use(
      async (config) => {
        const token = await tokenStorage.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // set up response interceptor for token refresh
    const responseInterceptor = client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // if get 401 and we haven't retried yet, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = await tokenStorage.getRefreshToken();
            if (refreshToken) {
              const response = await AuthService.refreshToken(refreshToken);
              await tokenStorage.updateToken(response.id_token);

              // retry with new token
              originalRequest.headers.Authorization = `Bearer ${response.id_token}`;
              return client(originalRequest);
            }
          } catch (refreshError) {
            // refresh failed so logout user
            await logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    // remove interceptors on unmount
    return () => {
      client.interceptors.request.eject(requestInterceptor);
      client.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const isAuth = await tokenStorage.isAuthenticated();

      if (isAuth) {
        // get user profile from backend
        const userProfile = await UserApiService.getProfile();
        setUser(userProfile);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      // clear invalid tokens
      await tokenStorage.clearTokens();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      // Authenticate with Firebase
      const authResponse = await AuthService.login(credentials);

      // Save tokens
      await tokenStorage.saveTokens(
        authResponse.idToken,
        authResponse.refreshToken,
        authResponse.localId
      );

      // Fetch user profile from backend
      const userProfile = await UserApiService.getProfile();
      setUser(userProfile);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      // Create Firebase account
      const authResponse = await AuthService.register(data);

      // Save tokens
      await tokenStorage.saveTokens(
        authResponse.idToken,
        authResponse.refreshToken,
        authResponse.localId
      );

      // Create user profile in backend
      const profileData: CreateUserRequest = {
        username: data.username,
      };

      const userProfile = await UserApiService.createOrUpdateProfile(
        profileData
      );
      setUser(userProfile);
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await tokenStorage.clearTokens();
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const userProfile = await UserApiService.getProfile();
      setUser(userProfile);
    } catch (error) {
      console.error("Failed to refresh user:", error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
