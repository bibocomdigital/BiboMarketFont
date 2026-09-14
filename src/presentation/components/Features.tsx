
import React from 'react';
import AnimatedCard from './ui-custom/AnimatedCard';
import AnimatedText from './ui-custom/AnimatedText';
import Badge from './ui-custom/Badge';
import { 
  ShoppingBag, 
  Search, 
  CreditCard, 
  Lock, 
  MessageSquare, 
  Bell, 
  BadgeCheck, 
  Clock
} from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <ShoppingBag size={24} />,
      title: "Boutiques Personnalisées",
      description: "Créez votre boutique en ligne avec logo, description, et catalogues de produits.",
      color: "bg-bibocom-secondary/20",
      iconColor: "text-bibocom-primary"
    },
    {
      icon: <Search size={24} />,
      title: "Recherche Avancée",
      description: "Trouvez rapidement les produits par catégorie, localisation, ou mot-clé.",
      color: "bg-bibocom-accent/20",
      iconColor: "text-bibocom-accent"
    },
    {
      icon: <CreditCard size={24} />,
      title: "Paiement à la Livraison",
      description: "Payez en toute sécurité lors de la réception de vos achats.",
      color: "bg-bibocom-success/20",
      iconColor: "text-bibocom-success"
    },
    {
      icon: <Lock size={24} />,
      title: "Sécurité Renforcée",
      description: "Protection des données avec authentification à deux facteurs.",
      color: "bg-bibocom-primary/20",
      iconColor: "text-bibocom-primary"
    },
    {
      icon: <MessageSquare size={24} />,
      title: "Messagerie Interne",
      description: "Communication directe entre clients, commerçants et fournisseurs.",
      color: "bg-bibocom-secondary/20",
      iconColor: "text-bibocom-primary"
    },
    {
      icon: <Bell size={24} />,
      title: "Notifications",
      description: "Suivez les nouveaux produits et offres de vos commerçants favoris.",
      color: "bg-bibocom-accent/20",
      iconColor: "text-bibocom-accent"
    },
    {
      icon: <BadgeCheck size={24} />,
      title: "Badge de Vérification",
      description: "Obtenez un badge vérifié pour plus de visibilité et de confiance.",
      color: "bg-bibocom-success/20",
      iconColor: "text-bibocom-success"
    },
    {
      icon: <Clock size={24} />,
      title: "Stories Exclusives",
      description: "Partagez des vidéos de 30 secondes pour promouvoir vos produits.",
      color: "bg-bibocom-primary/20",
      iconColor: "text-bibocom-primary"
    }
  ];

  return (
    <section className="section bg-gradient-to-b from-white to-bibocom-light/50">
      <div className="text-center mb-16">
        <AnimatedText delay={100}>
          <Badge variant="secondary" className="mb-4">
            Fonctionnalités
          </Badge>
        </AnimatedText>
        
        <AnimatedText delay={200}>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tout ce dont vous avez besoin pour <span className="text-gradient">réussir en ligne</span>
          </h2>
        </AnimatedText>
        
        <AnimatedText delay={300}>
          <p className="text-bibocom-primary/80 max-w-2xl mx-auto">
            BIBOCOM MARKET offre une suite complète d'outils pour améliorer votre expérience d'achat et de vente en ligne.
          </p>
        </AnimatedText>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <AnimatedCard 
            key={index} 
            delay={100 + (index * 100)}
            className="h-full"
          >
            <div className={`${feature.color} w-12 h-12 rounded-full flex items-center justify-center mb-4`}>
              <span className={feature.iconColor}>{feature.icon}</span>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-bibocom-primary">{feature.title}</h3>
            <p className="text-bibocom-primary/70">{feature.description}</p>
          </AnimatedCard>
        ))}
      </div>
    </section>
  );
};

export default Features;
