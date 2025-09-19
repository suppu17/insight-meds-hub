import { AuthResponse, LoginData, SignupData } from './AuthTypes';

// Configuration for MedInsight backend API with Stytch authentication
const AUTH_CONFIG = {
  baseUrl: 'http://localhost:8000', // Local FastAPI backend
  endpoints: {
    signup: '/auth/signup',
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    profile: '/auth/me',
    validate: '/auth/validate-token',
    magicLink: '/auth/magic-link/send',
    magicLinkVerify: '/auth/magic-link/verify',
    otpSend: '/auth/otp/send',
    otpVerify: '/auth/otp/verify'
  },
  timeout: 10000 // 10 second timeout
};

// Enhanced API client with proper error handling
class AuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = AUTH_CONFIG.baseUrl;
  }

  /**
   * Makes authenticated API requests with proper error handling
   */
  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<AuthResponse> {
    const url = `${this.baseUrl}${endpoint}`;

    // Add default headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };

    // Add auth token if available
    const token = this.getStoredToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AUTH_CONFIG.timeout);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Parse response
      const data = await response.json();

      // Handle HTTP errors
      if (!response.ok) {
        return {
          success: false,
          message: data.message || `HTTP ${response.status}: ${response.statusText}`,
          errors: data.errors
        };
      }

      return {
        success: true,
        ...data
      };

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            message: 'Request timeout. Please try again.'
          };
        }

        return {
          success: false,
          message: error.message || 'Network error occurred'
        };
      }

      return {
        success: false,
        message: 'An unexpected error occurred'
      };
    }
  }

  /**
   * User signup with email and password
   */
  async signup(userData: SignupData): Promise<AuthResponse> {
    // Client-side validation
    const validationError = this.validateSignupData(userData);
    if (validationError) {
      return {
        success: false,
        message: validationError
      };
    }

    // Remove confirmPassword from API request
    const { confirmPassword, ...apiData } = userData;

    const response = await this.makeRequest(AUTH_CONFIG.endpoints.signup, {
      method: 'POST',
      body: JSON.stringify(apiData)
    });

    // Store token on successful signup
    if (response.success && response.token) {
      this.storeToken(response.token);
    }

    return response;
  }

  /**
   * User login with email and password
   */
  async login(loginData: LoginData): Promise<AuthResponse> {
    // Client-side validation
    const validationError = this.validateLoginData(loginData);
    if (validationError) {
      return {
        success: false,
        message: validationError
      };
    }

    const response = await this.makeRequest(AUTH_CONFIG.endpoints.login, {
      method: 'POST',
      body: JSON.stringify(loginData)
    });

    // Store token on successful login
    if (response.success && response.token) {
      this.storeToken(response.token, loginData.rememberMe);
    }

    return response;
  }

  /**
   * Logout user and clear stored token
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint to invalidate token on server
      await this.makeRequest(AUTH_CONFIG.endpoints.logout, {
        method: 'POST'
      });
    } catch (error) {
      // Continue with local logout even if server logout fails
      console.warn('Server logout failed:', error);
    } finally {
      this.clearToken();
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<AuthResponse> {
    const response = await this.makeRequest(AUTH_CONFIG.endpoints.refresh, {
      method: 'POST'
    });

    if (response.success && response.token) {
      this.storeToken(response.token);
    }

    return response;
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<AuthResponse> {
    return this.makeRequest(AUTH_CONFIG.endpoints.profile, {
      method: 'GET'
    });
  }

  /**
   * Send magic link to user's email for passwordless authentication
   */
  async sendMagicLink(email: string): Promise<AuthResponse> {
    if (!email) {
      return {
        success: false,
        message: 'Email is required'
      };
    }

    if (!this.isValidEmail(email)) {
      return {
        success: false,
        message: 'Please enter a valid email'
      };
    }

    return this.makeRequest(AUTH_CONFIG.endpoints.magicLink, {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  /**
   * Verify magic link token and authenticate user
   */
  async verifyMagicLink(token: string): Promise<AuthResponse> {
    if (!token) {
      return {
        success: false,
        message: 'Magic link token is required'
      };
    }

    const response = await this.makeRequest(AUTH_CONFIG.endpoints.magicLinkVerify, {
      method: 'POST',
      body: JSON.stringify({ token })
    });

    // Store token on successful verification
    if (response.success && response.token) {
      this.storeToken(response.token);
    }

    return response;
  }

  /**
   * Send OTP code to user's email
   */
  async sendOTP(email: string): Promise<AuthResponse> {
    if (!email) {
      return {
        success: false,
        message: 'Email is required'
      };
    }

    if (!this.isValidEmail(email)) {
      return {
        success: false,
        message: 'Please enter a valid email'
      };
    }

    return this.makeRequest(AUTH_CONFIG.endpoints.otpSend, {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  /**
   * Verify OTP code and authenticate user
   */
  async verifyOTP(methodId: string, code: string): Promise<AuthResponse> {
    if (!methodId || !code) {
      return {
        success: false,
        message: 'Method ID and OTP code are required'
      };
    }

    if (!/^\d{4,8}$/.test(code)) {
      return {
        success: false,
        message: 'Please enter a valid OTP code'
      };
    }

    const response = await this.makeRequest(AUTH_CONFIG.endpoints.otpVerify, {
      method: 'POST',
      body: JSON.stringify({ method_id: methodId, code })
    });

    // Store token on successful verification
    if (response.success && response.token) {
      this.storeToken(response.token);
    }

    return response;
  }

  /**
   * Validate JWT token with backend
   */
  async validateToken(token?: string): Promise<AuthResponse> {
    const tokenToValidate = token || this.getStoredToken();

    if (!tokenToValidate) {
      return {
        success: false,
        message: 'No token to validate'
      };
    }

    return this.makeRequest(AUTH_CONFIG.endpoints.validate, {
      method: 'POST',
      body: JSON.stringify({ token: tokenToValidate })
    });
  }

  /**
   * Store authentication token securely
   */
  private storeToken(token: string, remember: boolean = false): void {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('medinsight_auth_token', token);

    // Also store in opposite storage to clear old tokens
    const otherStorage = remember ? sessionStorage : localStorage;
    otherStorage.removeItem('medinsight_auth_token');
  }

  /**
   * Retrieve stored authentication token
   */
  getStoredToken(): string | null {
    return localStorage.getItem('medinsight_auth_token') ||
           sessionStorage.getItem('medinsight_auth_token');
  }

  /**
   * Clear stored authentication token
   */
  private clearToken(): void {
    localStorage.removeItem('medinsight_auth_token');
    sessionStorage.removeItem('medinsight_auth_token');
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    return !!token && !this.isTokenExpired(token);
  }

  /**
   * Basic JWT token expiration check
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch (error) {
      return true; // Treat invalid tokens as expired
    }
  }

  /**
   * Validate signup data
   */
  private validateSignupData(data: SignupData): string | null {
    if (!data.email) return 'Email is required';
    if (!this.isValidEmail(data.email)) return 'Please enter a valid email';
    if (!data.password) return 'Password is required';
    if (data.password.length < 8) return 'Password must be at least 8 characters';
    if (data.password !== data.confirmPassword) return 'Passwords do not match';
    return null;
  }

  /**
   * Validate login data
   */
  private validateLoginData(data: LoginData): string | null {
    if (!data.email) return 'Email is required';
    if (!this.isValidEmail(data.email)) return 'Please enter a valid email';
    if (!data.password) return 'Password is required';
    return null;
  }

  /**
   * Simple email validation
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;