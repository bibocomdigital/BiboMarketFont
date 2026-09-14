"use client";


import React from 'react';
import { cn } from '@/lib/utils';

type ButtonProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  onClick,
  disabled = false,
  type = 'button',
  icon,
  iconPosition = 'left',
  fullWidth = false,
}: ButtonProps) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-bibocom-primary text-white hover:bg-bibocom-primary/90 focus:ring-bibocom-primary/50',
    secondary: 'bg-bibocom-secondary text-bibocom-primary hover:bg-bibocom-secondary/90 focus:ring-bibocom-secondary/50',
    accent: 'bg-bibocom-accent text-white hover:bg-bibocom-accent/90 focus:ring-bibocom-accent/50',
    ghost: 'bg-transparent hover:bg-bibocom-primary/10 text-bibocom-primary',
    outline: 'bg-transparent border border-bibocom-primary text-bibocom-primary hover:bg-bibocom-primary/10',
  };
  
  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3',
  };

  return (
    <button
      type={type}
      className={cn(
        baseStyles, 
        variants[variant], 
        sizes[size], 
        fullWidth ? 'w-full' : '', 
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && iconPosition === 'left' && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  );
};

export default Button;
