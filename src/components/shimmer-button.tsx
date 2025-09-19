import React from 'react';
import { Button } from '@/components/ui/button';

interface ShimmerButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ShimmerButton({
  children,
  className = "",
  onClick
}: ShimmerButtonProps) {
  return (
    <Button
      className={`group relative overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/25 ${className}`}
      onClick={onClick}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000" />
      <span className="relative z-10">{children}</span>
    </Button>
  );
}