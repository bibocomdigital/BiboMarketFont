"use client";


import React from 'react';
import AnimatedText from './ui-custom/AnimatedText';
import AnimatedCard from './ui-custom/AnimatedCard';
import Badge from './ui-custom/Badge';
import Button from './ui-custom/Button';
import { Store, Users, Truck, ChevronRight, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { UserRole } from '@/types/user';

const UserTypes = () => {
  const navigate = useNavigate();
  
  const navigateToRegister = (role: string) => {
    navigate(`/register?role=${role}`);
  };

  const userTypes = [
    {
      icon: <Store size={28} />,
      title: "Commerçant",
      description: "Créez votre boutique en ligne et vendez à un public plus large.",
      color: "from-bibocom-secondary/70 to-bibocom-secondary/30",
      iconColor: "text-bibocom-primary",
      features: [
        "Création de boutique personnalisée",
        "Publication de produits illimitée",
        "Tableau de bord des ventes",
        "Messagerie avec clients",
        "Stories de 30 secondes (vérifié)",
        "Badge de vérification (payant)",
      ],
      buttonText: "Devenir commerçant",
      role: "merchant" // Utiliser "merchant" pour correspondre à UserRole.MERCHANT
    },
    {
      icon: <Users size={28} />,
      title: "Client",
      description: "Trouvez les meilleurs produits et services en un seul endroit.",
      color: "from-bibocom-accent/70 to-bibocom-accent/30",
      iconColor: "text-white",
      features: [
        "Inscription rapide et facile",
        "Navigation et recherche avancée",
        "Suivi de commandes en temps réel",
        "Messagerie avec vendeurs",
        "Abonnement aux boutiques favorites",
        "Notifications personnalisées",
      ],
      buttonText: "Créer un compte client",
      role: "client" // Utiliser "client" pour correspondre à UserRole.CLIENT
    },
    {
      icon: <Truck size={28} />,
      title: "Fournisseur",
      description: "Proposez vos services aux commerçants sur la plateforme.",
      color: "from-bibocom-success/70 to-bibocom-success/30",
      iconColor: "text-white",
      features: [
        "Profil professionnel détaillé",
        "Mise en relation avec commerçants",
        "Négociation via messagerie interne",
        "Stories de 30 secondes (vérifié)",
        "Badge de vérification (payant)",
        "Visibilité accrue sur la plateforme",
      ],
      buttonText: "S'inscrire comme fournisseur",
      role: "supplier" // Utiliser "supplier" pour correspondre à UserRole.SUPPLIER
    }
  ];

  return (
    <section className="section bg-white">
      <div className="text-center mb-16">
        <AnimatedText delay={100}>
          <Badge variant="accent" className="mb-4">
            Utilisateurs
          </Badge>
        </AnimatedText>
        
        <AnimatedText delay={200}>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            La plateforme pour <span className="text-gradient">tous les acteurs</span> du marché
          </h2>
        </AnimatedText>
        
        <AnimatedText delay={300}>
          <p className="text-bibocom-primary/80 max-w-2xl mx-auto">
            BIBOCOM MARKET réunit commerçants, clients et fournisseurs dans un écosystème complet et sécurisé.
          </p>
        </AnimatedText>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {userTypes.map((userType, index) => (
          <AnimatedCard 
            key={index} 
            delay={100 + (index * 150)}
            className="h-full overflow-hidden p-0"
          >
            <div className={`p-6 bg-gradient-to-br ${userType.color} relative overflow-hidden`}>
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full transform translate-x-8 -translate-y-8"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full transform -translate-x-4 translate-y-4"></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                  <span className={userType.iconColor}>{userType.icon}</span>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white">{userType.title}</h3>
                <p className="text-white/80">{userType.description}</p>
              </div>
            </div>
            
            <div className="p-6">
              <ul className="space-y-3 mb-6">
                {userType.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <Check size={18} className="text-bibocom-success mr-2 mt-1 flex-shrink-0" />
                    <span className="text-bibocom-primary/80">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                variant={index === 0 ? "secondary" : index === 1 ? "accent" : "outline"}
                icon={<ChevronRight size={16} />}
                iconPosition="right"
                className="w-full"
                onClick={() => navigateToRegister(userType.role)}
              >
                {userType.buttonText}
              </Button>
            </div>
          </AnimatedCard>
        ))}
      </div>
    </section>
  );
};

export default UserTypes;
