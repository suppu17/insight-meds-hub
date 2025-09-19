import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from './useAuth';
import { LoginData } from './AuthTypes';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignup?: () => void;
  className?: string;
}

/**
 * Enhanced Login Form Component
 * Features: form validation, password visibility toggle, loading states, error handling
 */
export function LoginForm({ onSuccess, onSwitchToSignup, className = '' }: LoginFormProps) {
  const { login, isLoading, error, clearError } = useAuth();

  // Form state
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
    rememberMe: false
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear errors when user starts typing
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000); // Auto-clear after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  /**
   * Validate individual field
   */
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'email':
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        return '';
      default:
        return '';
    }
  };

  /**
   * Handle input changes with validation
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear general error
    if (error) {
      clearError();
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const errors: Record<string, string> = {};
    Object.keys(formData).forEach(key => {
      if (key !== 'rememberMe') {
        const error = validateField(key, formData[key as keyof LoginData] as string);
        if (error) errors[key] = error;
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await login(formData);

      if (success) {
        onSuccess?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <Card className={`glass-card p-8 w-full max-w-md mx-auto ${className}`}>
      {/* Header */}
      <div className=\"text-center mb-8\">
        <h2 className=\"text-3xl font-bold text-white mb-2\">Welcome Back</h2>
        <p className=\"text-white/80\">Sign in to your account</p>
      </div>

      {/* Global Error Message */}
      {error && (
        <div className=\"mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3\">
          <AlertCircle className=\"w-5 h-5 text-red-600 flex-shrink-0\" />
          <p className=\"text-red-700 text-sm\">{error}</p>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className=\"space-y-6\">
        {/* Email Field */}
        <div className=\"space-y-2\">
          <label htmlFor=\"email\" className=\"text-sm font-medium text-white\">
            Email Address
          </label>
          <div className=\"relative\">
            <Mail className=\"absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50\" />
            <Input
              id=\"email\"
              name=\"email\"
              type=\"email\"
              value={formData.email}
              onChange={handleInputChange}
              placeholder=\"Enter your email\"
              className=\"pl-10 rounded-xl shadow-lg\"
              disabled={isLoading || isSubmitting}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            />
          </div>
          {fieldErrors.email && (
            <p id=\"email-error\" className=\"text-red-400 text-sm mt-1\">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div className=\"space-y-2\">
          <label htmlFor=\"password\" className=\"text-sm font-medium text-white\">
            Password
          </label>
          <div className=\"relative\">
            <Lock className=\"absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50\" />
            <Input
              id=\"password\"
              name=\"password\"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange}
              placeholder=\"Enter your password\"
              className=\"pl-10 pr-10 rounded-xl shadow-lg\"
              disabled={isLoading || isSubmitting}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            />
            <button
              type=\"button\"
              onClick={togglePasswordVisibility}
              className=\"absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors\"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className=\"w-5 h-5\" /> : <Eye className=\"w-5 h-5\" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p id=\"password-error\" className=\"text-red-400 text-sm mt-1\">{fieldErrors.password}</p>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className=\"flex items-center justify-between\">
          <label className=\"flex items-center gap-2 cursor-pointer\">
            <input
              type=\"checkbox\"
              name=\"rememberMe\"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className=\"w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500\"
              disabled={isLoading || isSubmitting}
            />
            <span className=\"text-sm text-white/80\">Remember me</span>
          </label>

          <button
            type=\"button\"
            className=\"text-sm text-orange-400 hover:text-orange-300 transition-colors\"
          >
            Forgot password?
          </button>
        </div>

        {/* Submit Button */}
        <Button
          type=\"submit\"
          disabled={isLoading || isSubmitting}
          className=\"w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl shadow-lg transition-all duration-300 font-medium\"
        >
          {isLoading || isSubmitting ? (
            <>
              <Loader2 className=\"w-5 h-5 mr-2 animate-spin\" />
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </Button>

        {/* Switch to Signup */}
        {onSwitchToSignup && (
          <div className=\"text-center pt-4\">
            <p className=\"text-white/80 text-sm\">
              Don't have an account?{' '}
              <button
                type=\"button\"
                onClick={onSwitchToSignup}
                className=\"text-orange-400 hover:text-orange-300 font-medium transition-colors\"
              >
                Sign up
              </button>
            </p>
          </div>
        )}
      </form>
    </Card>
  );
}

export default LoginForm;