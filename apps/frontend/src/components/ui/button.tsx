/**
 * Button Component
 * Reusable basic UI structure
 */

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className, ...props }, ref) => {
    const baseClasses = 'px-4 py-2 rounded font-semibold transition-colors duration-200';
    const variantClasses = {
      primary: 'bg-primary text-btn-text hover:bg-primary-hover border border-primary',
      secondary: 'bg-btn-secondary text-primary border border-btn-secondary-border hover:bg-primary-light',
    };

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${className || ''}`}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
