import { useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useStytchUser } from '@stytch/react';
import MedInsightLogo from "@/components/MedInsightLogo";
import AnimatedHeroBackground from "@/components/AnimatedHeroBackground";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isInitialized } = useStytchUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitialized && !user) {
      console.log('ProtectedRoute: No user found, redirecting to signin');
      navigate('/signin');
    }
  }, [isInitialized, user, navigate]);

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <AnimatedHeroBackground />

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-4 lg:px-12">
          <div className="flex items-center space-x-2 pl-3 sm:pl-6 lg:pl-12">
            <MedInsightLogo />
          </div>
        </header>

        {/* Loading Content */}
        <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-6">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                  <h1 className="text-2xl font-bold text-white">
                    Loading...
                  </h1>
                  <p className="text-white/80 text-center">
                    Please wait while we verify your session.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Render protected content if authenticated
  if (user) {
    return <>{children}</>;
  }

  // Return null while redirecting
  return null;
};

export default ProtectedRoute;