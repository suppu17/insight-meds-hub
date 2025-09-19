import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStytchUser, useStytch } from '@stytch/react';
import MedInsightLogo from "@/components/MedInsightLogo";
import AnimatedHeroBackground from "@/components/AnimatedHeroBackground";
import AuthDebug from "@/components/AuthDebug";
import { Loader2 } from "lucide-react";

const Authenticate = () => {
  const { user, isInitialized } = useStytchUser();
  const stytch = useStytch();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthentication = async () => {
      if (!isInitialized) {
        console.log('Stytch not initialized yet...');
        return;
      }

      // Check if user is already authenticated
      if (user) {
        console.log('User already authenticated:', user.user_id);
        navigate('/dashboard');
        return;
      }

      // Check for magic link token in URL
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const stytch_token_type = urlParams.get('stytch_token_type');

      console.log('Authenticate page - URL params:', { 
        token: !!token, 
        stytch_token_type,
        currentUser: !!user 
      });

      if (token && stytch_token_type === 'magic_links') {
        try {
          console.log('Authenticating magic link token...');
          const result = await stytch.magicLinks.authenticate(token, {
            session_duration_minutes: 60, // 1 hour (default safe duration)
          });
          
          console.log('Magic link authentication result:', result);
          
          if (result && result.user) {
            console.log('Authentication successful, user:', result.user.user_id);
            // Wait a bit for the user state to update, then navigate
            setTimeout(() => {
              navigate('/dashboard');
            }, 1000);
          } else {
            console.error('Authentication succeeded but no user returned');
            navigate('/signin');
          }
        } catch (error) {
          console.error('Magic link authentication failed:', error);
          navigate('/signin');
        }
      } else {
        // No valid token, redirect to signin
        console.log('No magic link token found, redirecting to signin');
        navigate('/signin');
      }
    };

    handleAuthentication();
  }, [isInitialized, user, stytch, navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedHeroBackground />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-4 lg:px-12">
        <div className="flex items-center space-x-2 pl-3 sm:pl-6 lg:pl-12">
          <MedInsightLogo />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-6">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                <h1 className="text-2xl font-bold text-white">
                  Authenticating...
                </h1>
                <p className="text-white/80 text-center">
                  Please wait while we verify your magic link and sign you in.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Authenticate;