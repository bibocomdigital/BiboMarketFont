
import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Heart, ChevronRight, MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-bibocom-primary text-white">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 px-6 sm:px-10 py-16">
          {/* Company Info */}
          <div className="md:col-span-1">
            <h3 className="text-xl font-bold mb-6">
              BIBOCOM<span className="text-bibocom-accent">MARKET</span>
            </h3>
            <p className="mb-6 text-white/80">
              La révolution du e-commerce au Sénégal. Connectez-vous, achetez, vendez et prospérez dans notre écosystème numérique.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-300">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-300">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-300">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-300">
                <Linkedin size={18} />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Liens Rapides</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-white/80 hover:text-white transition-colors duration-300 flex items-center">
                  <ChevronRight size={14} className="mr-2" />
                  Accueil
                </a>
              </li>
              <li>
                <a href="#" className="text-white/80 hover:text-white transition-colors duration-300 flex items-center">
                  <ChevronRight size={14} className="mr-2" />
                  À propos
                </a>
              </li>
              <li>
                <a href="#" className="text-white/80 hover:text-white transition-colors duration-300 flex items-center">
                  <ChevronRight size={14} className="mr-2" />
                  Fonctionnalités
                </a>
              </li>
              <li>
                <a href="#" className="text-white/80 hover:text-white transition-colors duration-300 flex items-center">
                  <ChevronRight size={14} className="mr-2" />
                  Témoignages
                </a>
              </li>
              <li>
                <a href="#" className="text-white/80 hover:text-white transition-colors duration-300 flex items-center">
                  <ChevronRight size={14} className="mr-2" />
                  Contact
                </a>
              </li>
            </ul>
          </div>
          
          {/* Types d'utilisateurs */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Types d'utilisateurs</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-white/80 hover:text-white transition-colors duration-300 flex items-center">
                  <ChevronRight size={14} className="mr-2" />
                  Commerçants
                </a>
              </li>
              <li>
                <a href="#" className="text-white/80 hover:text-white transition-colors duration-300 flex items-center">
                  <ChevronRight size={14} className="mr-2" />
                  Clients
                </a>
              </li>
              <li>
                <a href="#" className="text-white/80 hover:text-white transition-colors duration-300 flex items-center">
                  <ChevronRight size={14} className="mr-2" />
                  Fournisseurs
                </a>
              </li>
              <li>
                <a href="#" className="text-white/80 hover:text-white transition-colors duration-300 flex items-center">
                  <ChevronRight size={14} className="mr-2" />
                  Badge Vérifié
                </a>
              </li>
              <li>
                <a href="#" className="text-white/80 hover:text-white transition-colors duration-300 flex items-center">
                  <ChevronRight size={14} className="mr-2" />
                  Support
                </a>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin size={18} className="mr-3 mt-1 flex-shrink-0" />
                <span className="text-white/80">
                  123 Rue Commerciale, Dakar, Sénégal
                </span>
              </li>
              <li className="flex items-center">
                <Phone size={18} className="mr-3 flex-shrink-0" />
                <span className="text-white/80">+221 77 123 45 67</span>
              </li>
              <li className="flex items-center">
                <Mail size={18} className="mr-3 flex-shrink-0" />
                <span className="text-white/80">contact@bibocommarket.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Footer */}
        <div className="py-6 border-t border-white/10 px-6 sm:px-10">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/80 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} BIBOCOM MARKET. Tous droits réservés.
            </p>
            <div className="flex items-center text-white/80 text-sm">
              <a href="#" className="hover:text-white transition-colors duration-300 mr-6">
                Conditions d'utilisation
              </a>
              <a href="#" className="hover:text-white transition-colors duration-300 mr-6">
                Politique de confidentialité
              </a>
              <p className="flex items-center">
                Fait avec <Heart size={14} className="mx-1 text-bibocom-accent" /> au Sénégal
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
