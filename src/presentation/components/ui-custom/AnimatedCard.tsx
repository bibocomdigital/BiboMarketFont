"use client";


import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

type AnimatedCardProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hoverEffect?: boolean;
};

const AnimatedCard = ({
  children,
  className,
  delay = 0,
  hoverEffect = true,
}: AnimatedCardProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [delay]);

  return (
    <div
      ref={cardRef}
      className={cn(
        'glass-card p-6 opacity-0 transform translate-y-8',
        isVisible ? 'opacity-100 translate-y-0 transition-all duration-700 ease-out-expo' : '',
        hoverEffect ? 'hover-scale' : '',
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default AnimatedCard;
