
import React from 'react';
import { cn } from '@/lib/utils';

type BadgeProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
};

const Badge = ({
  children,
  variant = 'primary',
  size = 'sm',
  className,
}: BadgeProps) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-full font-medium';
  
  const variants = {
    primary: 'bg-bibocom-primary/10 text-bibocom-primary',
    secondary: 'bg-bibocom-secondary/20 text-bibocom-primary',
    accent: 'bg-bibocom-accent/10 text-bibocom-accent',
    outline: 'bg-transparent border border-bibocom-primary/30 text-bibocom-primary',
  };
  
  const sizes = {
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  return (
    <span
      className={cn(baseStyles, variants[variant], sizes[size], className)}
    >
      {children}
    </span>
  );
};

export default Badge;
