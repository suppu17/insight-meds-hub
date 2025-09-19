import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import AnimatedHeroBackground from '@/components/AnimatedHeroBackground';
import MedInsightLogo from '@/components/MedInsightLogo';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
  onAuthSuccess?: () => void;
  className?: string;
}

/**
 * Combined Authentication Page Component
 * Manages switching between login and signup forms with smooth transitions
 */
export function AuthPage({
  initialMode = 'login',
  onAuthSuccess,
  className = ''
}: AuthPageProps) {
  const [currentMode, setCurrentMode] = useState<'login' | 'signup'>(initialMode);

  const handleAuthSuccess = () => {
    onAuthSuccess?.();
  };

  const switchToLogin = () => {
    setCurrentMode('login');
  };

  const switchToSignup = () => {
    setCurrentMode('signup');
  };

  return (
    <div className={`min-h-screen relative overflow-hidden ${className}`}>
      {/* Animated Background */}
      <AnimatedHeroBackground />

      {/* Content */}
      <div className=\"relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12\">
        {/* Logo */}
        <div className=\"mb-8\">
          <MedInsightLogo />
        </div>

        {/* Auth Forms Container */}
        <div className=\"w-full max-w-md mx-auto\">
          {/* Login/Signup Toggle Animation */}
          <div className=\"relative overflow-hidden\">
            <div
              className={`transition-transform duration-500 ease-in-out ${
                currentMode === 'login' ? 'translate-x-0' : '-translate-x-full'
              }`}
              style={{ width: '200%' }}
            >
              <div className=\"flex w-full\">
                {/* Login Form */}
                <div className=\"w-1/2 flex-shrink-0\">
                  <LoginForm
                    onSuccess={handleAuthSuccess}
                    onSwitchToSignup={switchToSignup}
                  />
                </div>

                {/* Signup Form */}
                <div className=\"w-1/2 flex-shrink-0\">
                  <SignupForm
                    onSuccess={handleAuthSuccess}
                    onSwitchToLogin={switchToLogin}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className=\"mt-12 text-center\">
          <p className=\"text-white/60 text-sm\">
            Secure authentication powered by Stitch
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;