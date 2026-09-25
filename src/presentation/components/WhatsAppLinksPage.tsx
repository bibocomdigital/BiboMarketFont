"use client";

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ShoppingBag, 
  ExternalLink, 
  Tag,
  ArrowLeft,
  ShoppingCart,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

// URL de base pour les images
const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';


const WhatsAppLinksPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Ancien flux WhatsApp : on ouvre désormais la messagerie interne.
  useEffect(() => {
    navigate('/client-dashboard?view=messages', { replace: true });
  }, [navigate]);

  // Récupérer les liens depuis l'état de navigation
  const { links = [] } = location.state || {};

  // Fonction pour retourner à la page précédente
  const goBack = (event) => {
    if (event) event.preventDefault();
    navigate(-1); // Retourne à la page précédente
  };

  // Fonction pour générer une couleur de fond aléatoire
  const getRandomColor = () => {
    const colors = [
      'bg-blue-100', 'bg-green-100', 'bg-yellow-100', 
      'bg-purple-100', 'bg-pink-100', 'bg-indigo-100',
      'bg-red-100', 'bg-orange-100', 'bg-teal-100'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  // Fonction pour obtenir les initiales d'un texte
  const getInitials = (text) => {
    if (!text) return 'P';
    return text.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Fonction pour extraire le chemin d'accès du fichier depuis une URL complète ou un chemin relatif
  const extractImageFileName = (url) => {
    if (!url) return null;
    
    // Si c'est une URL complète avec 'votre-domaine'
    if (url.includes('votre-domaine') && url.includes('uploads')) {
      // Trouver le segment uploads et tout ce qui suit
      const match = url.match(/uploads\/(.*)/);
      if (match && match[1]) {
        return `/uploads/${match[1]}`;
      }
    }
    
    // Si c'est déjà un chemin relatif commençant par /uploads
    if (url.startsWith('/uploads')) {
      return url;
    }
    
    // Pour les logos qui sont juste des noms de fichiers ou des chemins partiels
    if (url.includes('/')) {
      const parts = url.split('/');
      const fileName = parts[parts.length - 1];
      return `/uploads/${fileName}`;
    }
    
    // Si c'est juste un nom de fichier, ajouter /uploads/ devant
    if (!url.startsWith('/') && !url.startsWith('http')) {
      return `/uploads/${url}`;
    }
    
    return url;
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 24 
      }
    }
  };
  
  const imageVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        delay: 0.2
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
      Redirection vers la messagerie...
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-8">
      <div className="container mx-auto px-4">
        {/* Titre et bouton retour */}
        <motion.div 
          className="flex items-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            className="text-orange-500 hover:text-orange-600 hover:bg-orange-100"
          >
            <ArrowLeft size={18} />
            <span className="ml-1">Retour au panier</span>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mx-auto pr-10">
            Contacter les vendeurs
          </h1>
        </motion.div>

        <motion.div 
          className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {links.length > 0 ? (
            <>
              <div className="p-6 border-b border-orange-100">
                <motion.p 
                  className="text-gray-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Cliquez sur les boutons ci-dessous pour contacter directement les vendeurs via WhatsApp et discuter de votre commande.
                </motion.p>
              </div>
              
              <motion.div 
                className="p-6 space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {links.map((link, linkIndex) => {
                  // Essayer de corriger l'URL du logo
                  const relativePath = extractImageFileName(link.logo);
                  const logoUrl = relativePath ? `${backendUrl}${relativePath}` : null;
                  
                  return (
                    <motion.div 
                      key={linkIndex} 
                      className="bg-orange-50/70 rounded-lg overflow-hidden border border-orange-100 hover:shadow-md transition-shadow duration-300"
                      variants={itemVariants}
                    >
                      {/* En-tête avec le nom de la boutique */}
                      <div className="p-6 border-b border-orange-100 flex items-center">
                        {/* Essayer d'afficher le logo, sinon montrer les initiales */}
                        <motion.div 
                          className={`w-12 h-12 rounded-full overflow-hidden mr-4 border border-orange-200 flex items-center justify-center ${!logoUrl ? getRandomColor() : 'bg-white'}`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {logoUrl ? (
                            <img 
                              src={logoUrl}
                              alt={link.shopName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.log(`Erreur de chargement du logo: ${logoUrl}`);
                                e.target.style.display = 'none';
                                e.target.parentNode.className = `w-12 h-12 rounded-full overflow-hidden mr-4 border border-orange-200 flex items-center justify-center ${getRandomColor()}`;
                                e.target.parentNode.innerHTML = `<span class="text-lg font-bold">${getInitials(link.shopName)}</span>`;
                              }}
                            />
                          ) : (
                            <span className="text-lg font-bold">{getInitials(link.shopName)}</span>
                          )}
                        </motion.div>
                        
                        <div>
                          <h2 className="text-xl font-bold text-gray-800">{link.shopName}</h2>
                          <div className="text-gray-500 text-sm mt-1 flex items-center">
                            <ShoppingBag size={14} className="mr-1" />
                            <span>{link.itemCount} {link.itemCount > 1 ? 'articles' : 'article'}</span>
                            <span className="mx-2">•</span>
                            <span className="font-medium text-orange-600">{link.totalAmount?.toLocaleString() || '0'} FCFA</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Section des produits avec images */}
                      <div className="px-6 py-4 border-b border-orange-100">
                        <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                          <ShoppingCart size={14} className="mr-1.5" />
                          Articles de votre commande:
                        </h3>
                        <motion.div 
                          className="flex flex-wrap gap-3"
                          variants={containerVariants}
                        >
                          {link.productImages && link.productImages.length > 0 ? (
                            link.productImages.map((imgUrl, imgIndex) => {
                              // Extraire juste le nom du fichier et créer un chemin relatif
                              const prodRelativePath = extractImageFileName(imgUrl);
                              const fullImageUrl = prodRelativePath ? `${backendUrl}${prodRelativePath}` : null;
                              
                              return (
                                <motion.div 
                                  key={imgIndex} 
                                  className="w-16 h-16 bg-white rounded-md overflow-hidden border border-gray-200 hover:border-orange-300 transition-colors"
                                  variants={imageVariants}
                                  whileHover={{ 
                                    scale: 1.05,
                                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" 
                                  }}
                                >
                                  {fullImageUrl ? (
                                    <img 
                                      src={fullImageUrl}
                                      alt={`Produit ${imgIndex + 1}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        console.log(`Erreur de chargement de l'image: ${fullImageUrl}`);
                                        e.target.style.display = 'none';
                                        e.target.parentNode.className = `w-16 h-16 rounded-md flex items-center justify-center ${getRandomColor()}`;
                                        e.target.parentNode.innerHTML = `
                                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-600">
                                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                                            <line x1="7" y1="7" x2="7.01" y2="7"></line>
                                          </svg>
                                        `;
                                      }}
                                    />
                                  ) : (
                                    <div className={`w-full h-full flex items-center justify-center ${getRandomColor()}`}>
                                      <Tag size={24} className="text-gray-600" />
                                    </div>
                                  )}
                                </motion.div>
                              );
                            })
                          ) : (
                            // Si pas d'images, on affiche des placeholders en fonction du nombre d'articles
                            Array.from({ length: link.itemCount || 1 }).map((_, imgIndex) => (
                              <motion.div 
                                key={imgIndex} 
                                className={`w-16 h-16 rounded-md flex items-center justify-center ${getRandomColor()}`}
                                variants={imageVariants}
                                whileHover={{ scale: 1.05 }}
                              >
                                <Tag size={24} className="text-gray-600" />
                              </motion.div>
                            ))
                          )}
                        </motion.div>
                      </div>
                      
                      {/* Description et bouton WhatsApp */}
                      <div className="p-6">
                        <p className="text-gray-600 mb-5">
                          Discutez avec le vendeur pour confirmer la disponibilité des produits, les détails de livraison et tout autre aspect de votre commande.
                        </p>
                        <Button
                          className="bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2"
                          onClick={() => window.open(link.link, '_blank')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="white" className="shrink-0">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                          </svg>
                          <span>Contacter via WhatsApp</span>
                          <ExternalLink size={16} className="ml-1" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
              
              <motion.div 
                className="px-6 py-6 border-t border-orange-100 bg-orange-50/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-gray-500 mb-4 flex items-start">
                  <MessageCircle size={18} className="mr-2 mt-0.5 text-orange-400" />
                  Une fois que vous avez discuté avec les vendeurs, vous pouvez retourner à votre panier pour passer votre commande ou continuer vos achats.
                </p>
                <div className="flex flex-col md:flex-row gap-4">
                  <Button
                    variant="outline"
                    className="border-orange-200 text-gray-700 hover:bg-orange-50"
                    onClick={goBack}
                  >
                    <ShoppingCart size={18} />
                    Retourner au panier
                  </Button>
                  <Button
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => navigate('/')}
                  >
                    <ShoppingBag size={18} />
                    Continuer mes achats
                  </Button>
                </div>
              </motion.div>
            </>
          ) : (
            <motion.div 
              className="flex flex-col items-center justify-center py-16 px-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    repeatType: "loop", 
                    ease: "linear" 
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </motion.div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Aucun lien disponible</h2>
              <p className="text-gray-600 mb-8 text-center max-w-md">
                Nous n'avons pas pu générer de liens WhatsApp pour les vendeurs. Veuillez retourner à votre panier et réessayer.
              </p>
              <Button 
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={goBack}
              >
                <ShoppingCart size={18} />
                Retourner au panier
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default WhatsAppLinksPage;