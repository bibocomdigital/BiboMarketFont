"use client";


import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Hero, { HomeCategoryCards, HomeSellerBanner } from '@/components/Hero';
import { HomeMenu, HomeRightRail } from '@/components/home/HomeRails';
import Shops from '@/components/Shops';
import ProductsGrid from '@/components/ProductsGrid';
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
      
      if (!anchorLink) return;

      const targetId = (anchorLink.getAttribute('href') || '').trim();
      if (targetId.length <= 1) {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      try {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          window.scrollTo({
            top: targetElement.getBoundingClientRect().top + window.scrollY - 100,
            behavior: 'smooth',
          });
        }
      } catch {
        // href="#..." invalide : on n'essaie pas le scroll
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
    <div className="relative flex min-h-dvh w-full min-w-0 flex-col overflow-x-clip bg-[#f6f7fb]">
      <div className="relative z-10">
        <Header />
        <main className="min-w-0 flex-grow pt-32 md:pt-24">
          <div className="home-layout grid min-w-0 gap-3 px-3 py-3 md:grid-cols-[280px_minmax(0,1fr)] md:items-start">
            <aside className="hidden md:sticky md:top-24 md:z-20 md:block md:self-start">
              <HomeMenu />
            </aside>
            <div className="min-w-0 space-y-2">
              <Hero />
              <section id="produits" className="scroll-mt-24 py-6">
                <h2 className="text-xl font-semibold text-bibocom-primary">Produits populaires</h2>
                <div className="mt-4">
                  <ProductsGrid hideSearchBar hideCategoryPills />
                </div>
              </section>
              <HomeCategoryCards />
              <Shops hideWhenUnavailable embedded />
              <HomeSellerBanner />
            </div>
            <aside className="home-rail min-w-0 min-[1200px]:sticky min-[1200px]:top-24 min-[1200px]:z-20 min-[1200px]:self-start">
              <HomeRightRail />
            </aside>
          </div>
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
