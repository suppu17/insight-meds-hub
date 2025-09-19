import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StytchLogin } from '@stytch/react';
import { Products } from '@stytch/vanilla-js';
import { useStytchUser } from '@stytch/react';
import MedInsightLogo from "@/components/MedInsightLogo";
import AnimatedHeroBackground from "@/components/AnimatedHeroBackground";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const SignUp = () => {
  const { user, isInitialized } = useStytchUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitialized && user) {
      navigate('/dashboard');
    }
  }, [isInitialized, user, navigate]);

  const stytchProps = {
    config: {
      products: [Products.emailMagicLinks],
      emailMagicLinksOptions: {
        loginRedirectURL: `${window.location.origin}/authenticate`,
        loginExpirationMinutes: 30,
        signupRedirectURL: `${window.location.origin}/authenticate`,
        signupExpirationMinutes: 30,
      },
    },
    styles: {
      container: {
        width: '100%',
      },
      colors: {
        primary: '#f97316', // Orange color to match your theme
      },
    },
    callbacks: {
      onEvent: (data: any) => {
        console.log('Stytch event:', data);
      },
      onSuccess: (data: any) => {
        console.log('Stytch success:', data);
      },
      onError: (data: any) => {
        console.error('Stytch error:', data);
      },
    },
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedHeroBackground />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-4 lg:px-12">
        <div className="flex items-center space-x-2 pl-3 sm:pl-6 lg:pl-12">
          <button
            onClick={handleBackToHome}
            className="mr-4 p-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <MedInsightLogo />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-6">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Join Insight Meds Hub
            </h1>
            <p className="text-white/80 text-lg">
              Create your account to access AI-powered health insights
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
            <StytchLogin 
              config={stytchProps.config} 
              styles={stytchProps.styles}
              callbacks={stytchProps.callbacks}
            />
          </div>

          <div className="text-center mt-6">
            <p className="text-white/60 text-sm">
              Already have an account?{" "}
              <button
                onClick={() => navigate('/signin')}
                className="text-orange-400 hover:text-orange-300 font-medium transition-colors"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignUp;