
import React from 'react';
import Button from './ui-custom/Button';
import AnimatedText from './ui-custom/AnimatedText';
import { ArrowRight, CheckCircle } from 'lucide-react';

const CallToAction = () => {
  return (
    <section className="py-20 px-6 sm:px-10 relative overflow-hidden bg-gradient-to-br from-bibocom-primary via-bibocom-primary to-bibocom-primary/90 text-white">
      {/* Éléments décoratifs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-bibocom-secondary/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-bibocom-accent/20 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-6xl mx-auto">
        <div className="absolute top-0 left-10 w-4 h-4 bg-bibocom-secondary/70 rounded-full"></div>
        <div className="absolute top-20 right-20 w-6 h-6 bg-bibocom-accent/70 rounded-full"></div>
        <div className="absolute bottom-10 left-1/4 w-8 h-8 bg-bibocom-secondary/70 rounded-full"></div>
        <div className="absolute bottom-30 right-1/3 w-5 h-5 bg-bibocom-accent/70 rounded-full"></div>
      </div>
      
      {/* Contenu */}
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <AnimatedText delay={100}>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Prêt à rejoindre la révolution du e-commerce au Sénégal?
              </h2>
            </AnimatedText>
            
            <AnimatedText delay={200}>
              <p className="text-white/80 text-lg mb-8">
                Que vous soyez commerçant, client ou fournisseur, BIBOCOM MARKET vous offre tous les outils nécessaires pour réussir.
              </p>
            </AnimatedText>
            
            <AnimatedText delay={300}>
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <CheckCircle className="text-bibocom-secondary mr-3 mt-1 flex-shrink-0" size={20} />
                  <p className="text-white/90">Inscription gratuite et rapide en quelques minutes</p>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="text-bibocom-secondary mr-3 mt-1 flex-shrink-0" size={20} />
                  <p className="text-white/90">Support technique 7j/7 pour vous accompagner</p>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="text-bibocom-secondary mr-3 mt-1 flex-shrink-0" size={20} />
                  <p className="text-white/90">Commissions les plus basses du marché</p>
                </div>
              </div>
            </AnimatedText>
            
            <AnimatedText delay={400}>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="secondary"
                  size="lg"
                  icon={<ArrowRight size={18} />}
                  iconPosition="right"
                  className="font-bold"
                >
                  Créer mon compte
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  className="bg-transparent border-white text-white hover:bg-white/10"
                >
                  En savoir plus
                </Button>
              </div>
            </AnimatedText>
          </div>
          
          <AnimatedText delay={500} className="hidden lg:block">
            <div className="relative">
              <div className="relative z-10 glass p-8 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="h-60 bg-gradient-to-br from-bibocom-accent/20 to-bibocom-secondary/20 rounded-lg mb-6"></div>
                <div className="w-2/3 h-4 bg-white/30 rounded-full mb-3"></div>
                <div className="w-1/2 h-4 bg-white/30 rounded-full"></div>
              </div>
              <div className="absolute top-10 -left-10 z-0 glass p-8 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                <div className="h-40 bg-gradient-to-br from-bibocom-secondary/20 to-bibocom-accent/20 rounded-lg mb-6"></div>
                <div className="w-3/4 h-4 bg-white/30 rounded-full mb-3"></div>
                <div className="w-1/2 h-4 bg-white/30 rounded-full"></div>
              </div>
            </div>
          </AnimatedText>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
