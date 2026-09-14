import React from 'react';
import { 
  Users, 
  Target, 
  Award, 
  Heart, 
  Shield, 
  Smartphone, 
  Globe, 
  TrendingUp,
  CheckCircle,
  Star,
  Building,
  MapPin,
  Calendar,
  Zap
} from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-400 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              À propos de <span className="text-yellow-300">BibocomMarket</span>
            </h1>
            <p className="text-xl md:text-2xl text-orange-100 mb-8 leading-relaxed">
              La plateforme qui révolutionne le commerce local au Sénégal en connectant 
              marchands et clients dans un écosystème numérique innovant.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center bg-white/10 backdrop-blur rounded-full px-4 py-2">
                <Calendar className="mr-2" size={16} />
                Depuis 2024
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur rounded-full px-4 py-2">
                <MapPin className="mr-2" size={16} />
                Basé au Sénégal
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur rounded-full px-4 py-2">
                <Users className="mr-2" size={16} />
                Par Bibocom Digital
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notre Histoire */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Notre Histoire
              </h2>
              <p className="text-xl text-gray-600">
                Une vision née de la passion pour l'innovation et le développement local
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Une initiative de Bibocom Digital
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    BibocomMarket est né de l'expertise de <strong>Bibocom Digital</strong>, 
                    cabinet de formation et consulting spécialisé dans les métiers du numérique 
                    depuis plus de 13 ans. Fort de ses 600 000+ abonnés et de sa certification 
                    Google Partner Premier, Bibocom Digital a identifié un besoin crucial : 
                    démocratiser le commerce électronique au Sénégal.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <CheckCircle className="text-green-500 mr-3" size={20} />
                      <span className="text-gray-700">13+ années d'expérience digitale</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="text-green-500 mr-3" size={20} />
                      <span className="text-gray-700">Certifié Google Partner Premier</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="text-green-500 mr-3" size={20} />
                      <span className="text-gray-700">600 000+ abonnés de confiance</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="text-center">
                    <Building className="text-orange-500 mx-auto mb-4" size={48} />
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">
                      Bibocom Digital
                    </h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Cabinet de formation & consulting
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-orange-50 rounded-lg p-3">
                        <div className="font-semibold text-orange-600">600K+</div>
                        <div className="text-gray-600">Abonnés</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="font-semibold text-blue-600">13+</div>
                        <div className="text-gray-600">Ans d'expérience</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notre Mission */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Notre Mission
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transformer le paysage commercial sénégalais en créant un pont numérique 
              entre les marchands locaux et les consommateurs modernes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="text-orange-500" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Digitalisation du Commerce
                </h3>
                <p className="text-gray-600">
                  Permettre aux marchands locaux d'accéder au monde numérique avec 
                  des outils simples et efficaces pour développer leur activité.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="text-blue-500" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Inclusion Économique
                </h3>
                <p className="text-gray-600">
                  Créer des opportunités pour tous les acteurs économiques, 
                  des petits commerçants aux grandes entreprises.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="text-green-500" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Impact Social
                </h3>
                <p className="text-gray-600">
                  Contribuer au développement économique local en facilitant 
                  les échanges et en créant de nouveaux emplois.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nos Valeurs */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nos Valeurs
            </h2>
            <p className="text-xl text-gray-600">
              Les principes qui guident chacune de nos actions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex items-start space-x-4">
              <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="text-orange-500" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Confiance</h3>
                <p className="text-gray-600">
                  Nous construisons une plateforme sécurisée où marchands et clients 
                  peuvent échanger en toute confiance.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="text-blue-500" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Innovation</h3>
                <p className="text-gray-600">
                  Nous intégrons les dernières technologies pour offrir une expérience 
                  utilisateur exceptionnelle.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                <Globe className="text-green-500" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Accessibilité</h3>
                <p className="text-gray-600">
                  Notre plateforme est conçue pour être accessible à tous, 
                  indépendamment du niveau technique.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="text-purple-500" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Croissance</h3>
                <p className="text-gray-600">
                  Nous accompagnons nos partenaires dans leur développement et 
                  leur réussite à long terme.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistiques */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-orange-400 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              BibocomMarket en Chiffres
            </h2>
            <p className="text-xl text-orange-100">
              Notre impact grandit chaque jour
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">100+</div>
              <div className="text-orange-200">Marchands Actifs</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">1K+</div>
              <div className="text-orange-200">Produits Disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">500+</div>
              <div className="text-orange-200">Commandes Traitées</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">98%</div>
              <div className="text-orange-200">Satisfaction Client</div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Publicité - Galerie BibocomMarket */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              BibocomMarket en Images
            </h2>
            <p className="text-xl text-gray-600">
              Découvrez notre application et nos fonctionnalités en action
            </p>
          </div>

          {/* Galerie d'images */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Image 1 - Interface utilisateur */}
            <div className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="aspect-[4/3] bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                <div className="text-center p-6">
                  <Smartphone className="text-orange-500 mx-auto mb-4" size={48} />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Interface Intuitive</h3>
                  <p className="text-sm text-gray-600">Navigation simple et élégante pour tous les utilisateurs</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all"></div>
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur rounded-lg p-3 transform translate-y-full group-hover:translate-y-0 transition-transform">
                <p className="text-sm text-gray-700 font-medium">Application mobile responsive</p>
              </div>
            </div>

            {/* Image 2 - Dashboard marchand */}
            <div className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="aspect-[4/3] bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <div className="text-center p-6">
                  <Building className="text-blue-500 mx-auto mb-4" size={48} />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Dashboard Marchand</h3>
                  <p className="text-sm text-gray-600">Gérez vos produits et commandes facilement</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all"></div>
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur rounded-lg p-3 transform translate-y-full group-hover:translate-y-0 transition-transform">
                <p className="text-sm text-gray-700 font-medium">Outils de gestion complets</p>
              </div>
            </div>

            {/* Image 3 - Boutiques */}
            <div className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="aspect-[4/3] bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                <div className="text-center p-6">
                  <Users className="text-green-500 mx-auto mb-4" size={48} />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Réseau de Boutiques</h3>
                  <p className="text-sm text-gray-600">Découvrez nos marchands partenaires</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all"></div>
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur rounded-lg p-3 transform translate-y-full group-hover:translate-y-0 transition-transform">
                <p className="text-sm text-gray-700 font-medium">Communauté grandissante</p>
              </div>
            </div>

            {/* Image 4 - Commandes */}
            <div className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="aspect-[4/3] bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                <div className="text-center p-6">
                  <CheckCircle className="text-purple-500 mx-auto mb-4" size={48} />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Gestion Commandes</h3>
                  <p className="text-sm text-gray-600">Suivi en temps réel de vos achats</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all"></div>
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur rounded-lg p-3 transform translate-y-full group-hover:translate-y-0 transition-transform">
                <p className="text-sm text-gray-700 font-medium">Processus transparent</p>
              </div>
            </div>

            {/* Image 5 - Notifications */}
            <div className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="aspect-[4/3] bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center">
                <div className="text-center p-6">
                  <Zap className="text-yellow-500 mx-auto mb-4" size={48} />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Notifications</h3>
                  <p className="text-sm text-gray-600">Restez informé en temps réel</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all"></div>
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur rounded-lg p-3 transform translate-y-full group-hover:translate-y-0 transition-transform">
                <p className="text-sm text-gray-700 font-medium">Communication fluide</p>
              </div>
            </div>

            {/* Image 6 - Sécurité */}
            <div className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="aspect-[4/3] bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                <div className="text-center p-6">
                  <Shield className="text-red-500 mx-auto mb-4" size={48} />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Sécurité</h3>
                  <p className="text-sm text-gray-600">Vos données protégées en permanence</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all"></div>
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur rounded-lg p-3 transform translate-y-full group-hover:translate-y-0 transition-transform">
                <p className="text-sm text-gray-700 font-medium">Transactions sécurisées</p>
              </div>
            </div>
          </div>

          {/* Bannière publicitaire principale */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-8 md:p-12 text-white text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Rejoignez la Révolution du Commerce Digital
            </h3>
            <p className="text-lg text-orange-100 mb-8 max-w-2xl mx-auto">
              BibocomMarket : Où les marchands sénégalais rencontrent leurs clients de demain. 
              Simple, sécurisé, et conçu pour votre succès.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-orange-500 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors">
                Télécharger l'App
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-500 transition-colors">
                Devenir Marchand
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Notre Vision */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Notre Vision
            </h2>
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm">
              <Target className="text-orange-500 mx-auto mb-6" size={64} />
              <p className="text-xl md:text-2xl text-gray-700 leading-relaxed mb-8">
                "Devenir la première plateforme de commerce électronique en Afrique de l'Ouest, 
                en étant le catalyseur de la transformation digitale du commerce local et 
                en créant un écosystème où chaque entrepreneur peut prospérer."
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <span className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium">
                  Commerce Local
                </span>
                <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                  Innovation Tech
                </span>
                <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                  Impact Social
                </span>
                <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
                  Croissance Durable
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Final */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Prêt à Faire Partie de l'Aventure ?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Que vous soyez client ou marchand, BibocomMarket vous ouvre les portes 
            d'un nouveau monde de possibilités commerciales.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-8 text-center">
              <Users className="text-orange-500 mx-auto mb-4" size={48} />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Pour les Clients</h3>
              <p className="text-gray-600 mb-6">
                Découvrez des produits locaux authentiques et soutenez les marchands de votre région.
              </p>
              <button className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors">
                Commencer mes Achats
              </button>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 text-center">
              <Building className="text-blue-500 mx-auto mb-4" size={48} />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Pour les Marchands</h3>
              <p className="text-gray-600 mb-6">
                Développez votre business en ligne et touchez une clientèle plus large.
              </p>
              <button className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
                Ouvrir ma Boutique
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;