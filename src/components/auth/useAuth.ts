import { useState, useEffect, useCallback } from 'react';
import { AuthState, User, LoginData, SignupData } from './AuthTypes';
import { authService } from './AuthService';

/**
 * Custom hook for authentication management
 * Provides authentication state and methods for login/signup/logout
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    error: null
  });

  /**
   * Initialize authentication state on mount
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = authService.getStoredToken();

        if (token && authService.isAuthenticated()) {
          // Verify token with server and get user profile
          const profileResponse = await authService.getProfile();

          if (profileResponse.success && profileResponse.user) {
            setAuthState({
              user: profileResponse.user,
              token,
              isLoading: false,
              error: null
            });
          } else {
            // Token is invalid, clear it
            await authService.logout();
            setAuthState({
              user: null,
              token: null,
              isLoading: false,
              error: null
            });
          }
        } else {
          // No valid token found
          setAuthState({
            user: null,
            token: null,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setAuthState({
          user: null,
          token: null,
          isLoading: false,
          error: 'Failed to initialize authentication'
        });
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login user with email and password
   */
  const login = useCallback(async (loginData: LoginData): Promise<boolean> => {
    setAuthState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      const response = await authService.login(loginData);

      if (response.success && response.user && response.token) {
        setAuthState({
          user: response.user,
          token: response.token,
          isLoading: false,
          error: null
        });
        return true;
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: response.message || 'Login failed'
        }));
        return false;
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }));
      return false;
    }
  }, []);

  /**
   * Register new user
   */
  const signup = useCallback(async (signupData: SignupData): Promise<boolean> => {
    setAuthState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      const response = await authService.signup(signupData);

      if (response.success) {
        // For signup, we might want to redirect to login or auto-login
        if (response.user && response.token) {
          // Auto-login after successful signup
          setAuthState({
            user: response.user,
            token: response.token,
            isLoading: false,
            error: null
          });
        } else {
          // Just show success message, user needs to login
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            error: null
          }));
        }
        return true;
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: response.message || 'Signup failed'
        }));
        return false;
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Signup failed'
      }));
      return false;
    }
  }, []);

  /**
   * Logout current user
   */
  const logout = useCallback(async (): Promise<void> => {
    setAuthState(prev => ({
      ...prev,
      isLoading: true
    }));

    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        error: null
      });
    }
  }, []);

  /**
   * Clear authentication error
   */
  const clearError = useCallback(() => {
    setAuthState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  /**
   * Refresh authentication token
   */
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    if (!authState.token) return false;

    try {
      const response = await authService.refreshToken();

      if (response.success && response.token) {
        setAuthState(prev => ({
          ...prev,
          token: response.token,
          error: null
        }));
        return true;
      } else {
        // Refresh failed, logout user
        await logout();
        return false;
      }
    } catch (error) {
      await logout();
      return false;
    }
  }, [authState.token, logout]);

  return {
    // State
    user: authState.user,
    token: authState.token,
    isLoading: authState.isLoading,
    error: authState.error,
    isAuthenticated: !!authState.user && !!authState.token,

    // Actions
    login,
    signup,
    logout,
    clearError,
    refreshAuth
  };
}

export default useAuth;