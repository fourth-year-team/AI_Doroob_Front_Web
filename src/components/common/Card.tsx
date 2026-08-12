import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}

export function Card({ children, className, padded = true }: CardProps) {
  return (
    <div className={`card ${padded ? 'card--pad' : ''} ${className ?? ''}`}>
      {children}
    </div>
  );
}
