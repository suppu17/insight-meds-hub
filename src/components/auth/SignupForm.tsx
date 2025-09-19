import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Loader2, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from './useAuth';
import { SignupData } from './AuthTypes';

interface SignupFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  className?: string;
}

/**
 * Enhanced Signup Form Component
 * Features: real-time validation, password strength indicator, form validation
 */
export function SignupForm({ onSuccess, onSwitchToLogin, className = '' }: SignupFormProps) {
  const { signup, isLoading, error, clearError } = useAuth();

  // Form state
  const [formData, setFormData] = useState<SignupData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Clear errors when user starts typing
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000); // Auto-clear after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  /**
   * Password strength validation
   */
  const getPasswordStrength = (password: string) => {
    const requirements = [
      { label: 'At least 8 characters', test: password.length >= 8 },
      { label: 'Contains uppercase letter', test: /[A-Z]/.test(password) },
      { label: 'Contains lowercase letter', test: /[a-z]/.test(password) },
      { label: 'Contains number', test: /\\d/.test(password) },
      { label: 'Contains special character', test: /[!@#$%^&*(),.?\":{}|<>]/.test(password) }
    ];

    const score = requirements.filter(req => req.test).length;
    const strength = score <= 2 ? 'weak' : score <= 3 ? 'medium' : score <= 4 ? 'strong' : 'very-strong';

    return { requirements, score, strength };
  };

  /**
   * Validate individual field
   */
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'email':
        if (!value) return 'Email is required';
        if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value)) return 'Please enter a valid email';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        const { score } = getPasswordStrength(value);
        if (score < 3) return 'Password is too weak';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  };

  /**
   * Handle input changes with validation
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Also clear confirmPassword error if password changes
    if (name === 'password' && fieldErrors.confirmPassword) {
      setFieldErrors(prev => ({
        ...prev,
        confirmPassword: ''
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
      const error = validateField(key, formData[key as keyof SignupData]);
      if (error) errors[key] = error;
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await signup(formData);

      if (success) {
        onSuccess?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <Card className={`glass-card p-8 w-full max-w-md mx-auto ${className}`}>
      {/* Header */}
      <div className=\"text-center mb-8\">
        <h2 className=\"text-3xl font-bold text-white mb-2\">Create Account</h2>
        <p className=\"text-white/80\">Sign up to get started</p>
      </div>

      {/* Global Error Message */}
      {error && (
        <div className=\"mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3\">
          <AlertCircle className=\"w-5 h-5 text-red-600 flex-shrink-0\" />
          <p className=\"text-red-700 text-sm\">{error}</p>
        </div>
      )}

      {/* Signup Form */}
      <form onSubmit={handleSubmit} className=\"space-y-6\">
        {/* Name Field */}
        <div className=\"space-y-2\">
          <label htmlFor=\"name\" className=\"text-sm font-medium text-white\">
            Full Name
          </label>
          <div className=\"relative\">
            <User className=\"absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50\" />
            <Input
              id=\"name\"
              name=\"name\"
              type=\"text\"
              value={formData.name}
              onChange={handleInputChange}
              placeholder=\"Enter your full name\"
              className=\"pl-10 rounded-xl shadow-lg\"
              disabled={isLoading || isSubmitting}
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? 'name-error' : undefined}
            />
          </div>
          {fieldErrors.name && (
            <p id=\"name-error\" className=\"text-red-400 text-sm mt-1\">{fieldErrors.name}</p>
          )}
        </div>

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
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              placeholder=\"Create a strong password\"
              className=\"pl-10 pr-10 rounded-xl shadow-lg\"
              disabled={isLoading || isSubmitting}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'password-error' : 'password-strength'}
            />
            <button
              type=\"button\"
              onClick={() => setShowPassword(prev => !prev)}
              className=\"absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors\"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className=\"w-5 h-5\" /> : <Eye className=\"w-5 h-5\" />}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {(formData.password || passwordFocused) && (
            <div id=\"password-strength\" className=\"mt-3 p-3 bg-white/5 rounded-lg border border-white/10\">
              <div className=\"flex items-center gap-2 mb-2\">
                <span className=\"text-xs font-medium text-white\">Password Strength:</span>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    passwordStrength.strength === 'weak'
                      ? 'bg-red-100 text-red-700'
                      : passwordStrength.strength === 'medium'
                      ? 'bg-yellow-100 text-yellow-700'
                      : passwordStrength.strength === 'strong'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1).replace('-', ' ')}
                </span>
              </div>

              <div className=\"space-y-1\">
                {passwordStrength.requirements.map((req, index) => (
                  <div key={index} className=\"flex items-center gap-2 text-xs\">
                    {req.test ? (
                      <CheckCircle className=\"w-3 h-3 text-green-400\" />
                    ) : (
                      <X className=\"w-3 h-3 text-red-400\" />
                    )}
                    <span className={req.test ? 'text-green-400' : 'text-white/60'}>{req.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {fieldErrors.password && (
            <p id=\"password-error\" className=\"text-red-400 text-sm mt-1\">{fieldErrors.password}</p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className=\"space-y-2\">
          <label htmlFor=\"confirmPassword\" className=\"text-sm font-medium text-white\">
            Confirm Password
          </label>
          <div className=\"relative\">
            <Lock className=\"absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50\" />
            <Input
              id=\"confirmPassword\"
              name=\"confirmPassword\"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder=\"Confirm your password\"
              className=\"pl-10 pr-10 rounded-xl shadow-lg\"
              disabled={isLoading || isSubmitting}
              aria-invalid={!!fieldErrors.confirmPassword}
              aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
            />
            <button
              type=\"button\"
              onClick={() => setShowConfirmPassword(prev => !prev)}
              className=\"absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors\"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className=\"w-5 h-5\" /> : <Eye className=\"w-5 h-5\" />}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p id=\"confirm-password-error\" className=\"text-red-400 text-sm mt-1\">{fieldErrors.confirmPassword}</p>
          )}
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
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>

        {/* Switch to Login */}
        {onSwitchToLogin && (
          <div className=\"text-center pt-4\">
            <p className=\"text-white/80 text-sm\">
              Already have an account?{' '}
              <button
                type=\"button\"
                onClick={onSwitchToLogin}
                className=\"text-orange-400 hover:text-orange-300 font-medium transition-colors\"
              >
                Sign in
              </button>
            </p>
          </div>
        )}
      </form>
    </Card>
  );
}

export default SignupForm;