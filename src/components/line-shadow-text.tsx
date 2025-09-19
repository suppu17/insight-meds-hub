import React from 'react';

interface LineShadowTextProps {
  children: React.ReactNode;
  className?: string;
  shadowColor?: string;
}

export function LineShadowText({
  children,
  className = "",
  shadowColor = "white"
}: LineShadowTextProps) {
  return (
    <span
      className={`relative ${className}`}
      style={{
        textShadow: `0 0 1px ${shadowColor}, 0 0 2px ${shadowColor}, 0 0 4px ${shadowColor}`,
      }}
    >
      {children}
    </span>
  );
}