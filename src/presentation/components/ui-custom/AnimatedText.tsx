"use client";


import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

type AnimatedTextProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: 'fade' | 'slide' | 'scale';
};

const AnimatedText = ({
  children,
  className,
  delay = 0,
  variant = 'fade',
}: AnimatedTextProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      }
    );

    if (textRef.current) {
      observer.observe(textRef.current);
    }

    return () => {
      if (textRef.current) {
        observer.unobserve(textRef.current);
      }
    };
  }, [delay]);

  const getAnimationClass = () => {
    if (!isVisible) return 'opacity-0';
    
    switch (variant) {
      case 'fade':
        return 'animate-fade-in';
      case 'slide':
        return 'animate-slide-in-left';
      case 'scale':
        return 'animate-scale-in';
      default:
        return 'animate-fade-in';
    }
  };

  return (
    <div
      ref={textRef}
      className={cn(getAnimationClass(), className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default AnimatedText;
