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
    <header
      className={cn(
        'fixed w-full top-0 left-0 z-50 transition-all duration-300',
        isScrolled ? 'glass py-3 shadow-md' : 'bg-transparent py-5'
      )}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-xl md:text-2xl font-bold text-bibocom-primary">
                BIBOCOM<span className="text-bibocom-accent">MARKET</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
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
          <div className="hidden md:flex items-center space-x-4">
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
          <div className="md:hidden flex items-center">
            <button 
              className="text-bibocom-primary p-2"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div 
        className={cn(
          'md:hidden fixed inset-0 bg-white z-40 transition-transform duration-300 ease-in-out transform',
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex flex-col h-full pt-20 px-6">
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
          <div className="mt-8 space-y-4">
            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button fullWidth variant="outline">
                Se connecter
              </Button>
            </Link>
            <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
              <Button fullWidth>
                S'inscrire
              </Button>
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
    </header>
  );
};

export default Header;
