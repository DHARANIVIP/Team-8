/**
 * Card Component
 * Reusable basic UI structure
 */

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`card p-6 ${className || ''}`}
      {...props}
    />
  )
);

Card.displayName = 'Card';
