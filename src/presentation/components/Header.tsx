"use client";


import React, { useState, useEffect } from 'react';
import { Menu, X, ShoppingCart, Search, ChevronDown } from 'lucide-react';
import Button from './ui-custom/Button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navigationLinks = [
    { name: 'Accueil', href: '#' },
    { name: 'Catégories', href: '#', hasDropdown: true },
    { name: 'Boutiques', href: '/boutique' },
    { name: 'À propos', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <>
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 w-full transition-all duration-300',
        'bg-bibocom-light/95 backdrop-blur-md',
        isScrolled ? 'border-b border-slate-200/80 py-3 shadow-sm' : 'border-b border-transparent py-4 md:py-5'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-lg font-bold text-bibocom-primary sm:text-xl md:text-2xl">
                BIBOCOM<span className="text-bibocom-accent">MARKET</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-8">
            {navigationLinks.map((link) => (
              <div key={link.name} className="relative group">
                <a
                  href={link.href}
                  className="text-bibocom-primary hover:text-bibocom-accent text-sm font-medium transition-colors duration-300 flex items-center"
                >
                  {link.name}
                  {link.hasDropdown && (
                    <ChevronDown size={16} className="ml-1 transition-transform duration-300 group-hover:rotate-180" />
                  )}
                </a>
                {link.hasDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-48 rounded-md shadow-lg py-1 glass opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top scale-95 group-hover:scale-100 bg-white">
                    <a href="#" className="block px-4 py-2 text-sm text-bibocom-primary hover:bg-bibocom-primary/10 transition-colors duration-200">
                      Électronique
                    </a>
                    <a href="#" className="block px-4 py-2 text-sm text-bibocom-primary hover:bg-bibocom-primary/10 transition-colors duration-200">
                      Mode
                    </a>
                    <a href="#" className="block px-4 py-2 text-sm text-bibocom-primary hover:bg-bibocom-primary/10 transition-colors duration-200">
                      Maison
                    </a>
                    <a href="#" className="block px-4 py-2 text-sm text-bibocom-primary hover:bg-bibocom-primary/10 transition-colors duration-200">
                      Beauté
                    </a>

                    {/* 🔹 Nouveau lien : Show Room */}
                    <a href="#" className="block px-4 py-2 text-sm text-bibocom-primary hover:bg-bibocom-primary/10 transition-colors duration-200">
                      Show Room
                    </a>

                    {/* 🔹 Nouveau lien : Immobilier */}
                    <a href="#" className="block px-4 py-2 text-sm text-bibocom-primary hover:bg-bibocom-primary/10 transition-colors duration-200">
                      Immobilier
                    </a>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Search, Cart and Action Buttons */}
          <div className="hidden lg:flex items-center gap-3 xl:gap-4">
            <button className="text-bibocom-primary hover:text-bibocom-accent transition-colors duration-300">
              <Search size={20} />
            </button>
            <button className="text-bibocom-primary hover:text-bibocom-accent transition-colors duration-300 relative">
              <ShoppingCart size={20} />
              <span className="absolute -top-1 -right-1 bg-bibocom-accent text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                0
              </span>
            </button>
            <Link to="/login">
              <Button size="sm" variant="outline">
                Se connecter
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">
                S'inscrire
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button 
              type="button"
              className="p-2 text-bibocom-primary"
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={isMobileMenuOpen}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>
    </header>

      <div 
        className={cn(
          'fixed inset-0 z-[60] overflow-y-auto bg-bibocom-light lg:hidden',
          'transition-transform duration-300 ease-in-out',
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="flex h-full flex-col overflow-y-auto px-6 pt-6">
          <div className="mb-8 flex items-center justify-between">
            <span className="text-xl font-bold text-bibocom-primary">
              BIBOCOM<span className="text-bibocom-accent">MARKET</span>
            </span>
            <button
              type="button"
              className="rounded-lg p-2 text-bibocom-primary"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Fermer le menu"
            >
              <X size={24} />
            </button>
          </div>
          <nav className="flex flex-col space-y-6">
            {navigationLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-bibocom-primary hover:text-bibocom-accent text-lg font-medium transition-colors duration-300"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
          </nav>
          <div className="mt-8 flex w-full flex-col gap-3">
            <Link
              to="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex h-12 w-full items-center justify-center rounded-xl border border-bibocom-primary bg-white text-sm font-medium text-bibocom-primary transition-colors hover:bg-bibocom-primary/5"
            >
              Se connecter
            </Link>
            <Link
              to="/register"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-bibocom-primary text-sm font-medium text-white transition-colors hover:bg-[#081c30]"
            >
              S&apos;inscrire
            </Link>
          </div>
          <div className="mt-auto mb-10 flex items-center justify-center space-x-6">
            <button className="text-bibocom-primary hover:text-bibocom-accent transition-colors duration-300">
              <Search size={24} />
            </button>
            <button className="text-bibocom-primary hover:text-bibocom-accent transition-colors duration-300 relative">
              <ShoppingCart size={24} />
              <span className="absolute -top-1 -right-1 bg-bibocom-accent text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                0
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
