/**
 * Glassmorphism Background Component
 *
 * Provides floating geometric shapes and ambient background effects
 * inspired by the Dribbble glassmorphism design
 */

import React from 'react';

const GlassmorphismBackground: React.FC = () => {
  return (
    <>
      {/* Main gradient background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Base dark gradient matching Dribbble reference */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900" />

        {/* Animated gradient orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-gradient-to-br from-blue-500/25 to-purple-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-gradient-to-br from-indigo-500/15 to-blue-500/25 rounded-full blur-3xl animate-pulse"
             style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-violet-400/15 to-blue-400/15 rounded-full blur-3xl animate-pulse"
             style={{ animationDelay: '4s' }} />
      </div>

      {/* Floating geometric shapes */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Hexagons */}
        <div className="absolute top-20 left-20 w-16 h-16 opacity-10">
          <div className="w-full h-full bg-gradient-to-br from-white/40 to-white/10 transform rotate-12 animate-float-slow"
               style={{ clipPath: 'polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)' }} />
        </div>

        <div className="absolute bottom-32 right-32 w-12 h-12 opacity-15">
          <div className="w-full h-full bg-gradient-to-br from-purple-300/50 to-pink-300/20 transform -rotate-45 animate-float-medium"
               style={{ clipPath: 'polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)' }} />
        </div>

        <div className="absolute top-1/3 right-20 w-8 h-8 opacity-20">
          <div className="w-full h-full bg-gradient-to-br from-blue-300/40 to-violet-300/30 transform rotate-90 animate-float-fast"
               style={{ clipPath: 'polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)' }} />
        </div>

        {/* Circles and ellipses */}
        <div className="absolute top-40 right-40 w-6 h-6 bg-gradient-to-br from-white/30 to-white/5 rounded-full animate-float-slow opacity-20" />
        <div className="absolute bottom-40 left-40 w-10 h-10 bg-gradient-to-br from-purple-300/25 to-pink-300/10 rounded-full animate-float-medium opacity-15" />
        <div className="absolute top-2/3 left-1/4 w-4 h-4 bg-gradient-to-br from-blue-300/35 to-violet-300/15 rounded-full animate-float-fast opacity-25" />

        {/* Triangles */}
        <div className="absolute top-60 left-60 w-8 h-8 opacity-12">
          <div className="w-full h-full bg-gradient-to-br from-white/40 to-white/10 transform rotate-45 animate-float-medium"
               style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        </div>

        <div className="absolute bottom-60 right-60 w-6 h-6 opacity-18">
          <div className="w-full h-full bg-gradient-to-br from-purple-300/40 to-pink-300/20 transform -rotate-30 animate-float-slow"
               style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        </div>

        {/* Additional decorative elements */}
        <div className="absolute top-1/4 left-1/2 w-3 h-3 bg-gradient-to-br from-white/50 to-white/20 rounded-full animate-float-fast opacity-30" />
        <div className="absolute bottom-1/4 right-1/3 w-5 h-5 bg-gradient-to-br from-violet-300/30 to-blue-300/15 rounded-full animate-float-slow opacity-20" />

        {/* Larger background shapes */}
        <div className="absolute top-10 right-10 w-20 h-20 opacity-5">
          <div className="w-full h-full bg-gradient-to-br from-white/30 to-purple-300/10 transform rotate-12 animate-float-very-slow"
               style={{ clipPath: 'polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)' }} />
        </div>

        <div className="absolute bottom-10 left-10 w-24 h-24 opacity-8">
          <div className="w-full h-full bg-gradient-to-br from-purple-300/25 to-pink-300/10 rounded-full animate-float-very-slow" />
        </div>
      </div>

      {/* Subtle overlay texture */}
      <div
        className="fixed inset-0 z-0 opacity-[0.02] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />
    </>
  );
};

export default GlassmorphismBackground;