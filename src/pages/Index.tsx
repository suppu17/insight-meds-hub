import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStytchUser } from '@stytch/react';
import MedInsightLogo from "@/components/MedInsightLogo";
import AnimatedHeroBackground from "@/components/AnimatedHeroBackground";
import { Button } from "@/components/ui/button";
import { ArrowRight, Menu } from "lucide-react";
import { LineShadowText } from "@/components/line-shadow-text";
import { ShimmerButton } from "@/components/shimmer-button";

const Index = () => {
  const navigate = useNavigate();
  const { user, isInitialized } = useStytchUser();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (isInitialized && user) {
      navigate('/dashboard');
    }
  }, [isInitialized, user, navigate]);

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/signin');
    }
  };

  const handleSignIn = () => {
    navigate('/signin');
  };

  const handleSignUp = () => {
    navigate('/signup');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedHeroBackground />

      {/* Header Navigation */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-4 lg:px-12">
        <div className="flex items-center space-x-2 pl-3 sm:pl-6 lg:pl-12">
          <MedInsightLogo />
        </div>



        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleSignIn} className="text-white/80 hover:text-white transition-colors px-4 py-2 rounded-xl text-sm font-medium">
            Sign In
          </Button>
          <ShimmerButton onClick={handleSignUp} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg">
            Sign Up
          </ShimmerButton>
        </div>
      </header>


      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-start justify-center min-h-[calc(100vh-80px)] px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto pt-8 sm:pt-16">

        <h1 className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight mb-6 sm:mb-8 text-balance max-w-5xl">
          Empower Your Health
          <br />
          with AI-Driven Insights
        </h1>

        <p className="text-white text-base sm:text-lg md:text-xl lg:text-2xl mb-8 sm:mb-12 max-w-4xl leading-relaxed">
          Discover comprehensive Drug Education, Visual Guides, Clinical Research, and AI-powered Symptom Analysis—all in one place to support smarter health decisions and personalized care.
        </p>

        {/* Feature Badges */}
        <div className="flex flex-wrap gap-3 mb-8 sm:mb-12">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
            <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span className="text-white text-sm">Drug Analyser</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
            <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            <span className="text-white text-sm">Symptom Checker</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
            </svg>
            <span className="text-white text-sm">Real-Time</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
            <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
            </svg>
            <span className="text-white text-sm">Voice AI ChatBot</span>
          </div>
        </div>

        <Button
          onClick={handleGetStarted}
          className="group relative bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base md:text-xs lg:text-lg font-semibold flex items-center gap-2 backdrop-blur-sm border border-orange-400/30 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5"
        >
          Get Started
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 group-hover:-rotate-12 transition-transform duration-300" />
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Button>
      </main>
    </div>
  );
};

export default Index;