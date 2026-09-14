"use client";


import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Shops from '@/components/Shops';
import ProductsGrid from '@/components/ProductsGrid';
import CallToAction from '@/components/CallToAction';
import Footer from '@/components/Footer';
import { ArrowUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Vérifier si un token de complétion de profil existe dans l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      console.log('Token détecté, redirection vers la page de complétion de profil');
      navigate(`/complete-profile?token=${token}`);
      return;
    }
    
    // Ne pas vérifier le token dans localStorage pour la page d'accueil
    // Cette modification permet aux utilisateurs d'accéder à l'accueil même s'ils ont un token
  }, [navigate]);
  
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Smooth scroll effect for anchor links
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchorLink = target.closest('a[href^="#"]');
      
      if (anchorLink) {
        e.preventDefault();
        const targetId = anchorLink.getAttribute('href');
        if (targetId) {
          const targetElement = document.querySelector(targetId);
          if (targetElement) {
            window.scrollTo({
              top: targetElement.getBoundingClientRect().top + window.scrollY - 100,
              behavior: 'smooth',
            });
          }
        }
      }
    };

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };

    document.addEventListener('click', handleAnchorClick);
    window.addEventListener('scroll', handleScroll);
    return () => {
      document.removeEventListener('click', handleAnchorClick);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-bibocom-light to-white overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-hero-pattern opacity-5"></div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-bibocom-secondary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 left-20 w-64 h-64 bg-bibocom-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-bibocom-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-bibocom-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
        
        <div className="absolute top-1/4 left-1/2 w-2 h-2 bg-bibocom-accent rounded-full"></div>
        <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-bibocom-secondary rounded-full"></div>
        <div className="absolute top-2/3 left-1/3 w-2 h-2 bg-bibocom-primary rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/3 w-4 h-4 bg-bibocom-accent/50 rounded-full"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10">
        <Header />
        <main className="flex-grow">
          <Hero />
         
          <ProductsGrid />
          <Shops hideWhenUnavailable />
         
        </main>
        <Footer />
      </div>

      {/* Scroll to top button */}
      <button 
        onClick={scrollToTop} 
        className={`fixed bottom-8 right-8 p-3 rounded-full bg-bibocom-primary text-white shadow-lg transition-all duration-300 hover:bg-bibocom-primary/90 hover:scale-110 z-50 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
        aria-label="Retour en haut"
      >
        <ArrowUp size={20} />
      </button>
    </div>
  );
};

export default Index;
