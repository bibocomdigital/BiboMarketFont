"use client";

import React, { useState } from 'react';
import { contactFormSchema } from '@/presentation/lib/validation/schemas';
import { appAlert } from '@/presentation/lib/swal';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  MessageSquare, 
  Building, 
  Users, 
  Globe, 
  Facebook, 
  Linkedin, 
  Instagram,
  Youtube,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    type: 'general' // general, support, partnership, merchant
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('idle');

    const parsed = contactFormSchema.safeParse(formData);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = String(issue.path[0] || "form");
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      });
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      // Simulation d'envoi - remplacer par votre API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Ici vous pouvez ajouter l'appel à votre API de contact
      console.log('Données du formulaire:', formData);
      
      setSubmitStatus('success');
      await appAlert.success("Message envoyé", "Nous vous répondrons dans les plus brefs délais.");
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        type: 'general'
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      setSubmitStatus('error');
      await appAlert.error("Envoi impossible", "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-400 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Contactez-nous
            </h1>
            <p className="text-xl text-orange-100 max-w-2xl mx-auto">
              Notre équipe est là pour vous accompagner dans votre expérience BibocomMarket
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire de contact */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Envoyez-nous un message
              </h2>

              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                  <CheckCircle className="text-green-500 mr-3" size={20} />
                  <p className="text-green-700">Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.</p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                  <AlertCircle className="text-red-500 mr-3" size={20} />
                  <p className="text-red-700">Une erreur est survenue lors de l'envoi. Veuillez réessayer.</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Votre nom complet"
                    />
                    {fieldErrors.name && <p className="text-sm text-red-600 mt-1">{fieldErrors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="text"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="votre@email.com"
                    />
                    {fieldErrors.email && <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="+221 XX XXX XX XX"
                    />
                  </div>

                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                      Type de demande *
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="general">Demande générale</option>
                      <option value="support">Support technique</option>
                      <option value="merchant">Devenir marchand</option>
                      <option value="partnership">Partenariat</option>
                      <option value="billing">Facturation</option>
                      <option value="complaint">Réclamation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Sujet *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Résumé de votre demande"
                  />
                  {fieldErrors.subject && <p className="text-sm text-red-600 mt-1">{fieldErrors.subject}</p>}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-vertical"
                    placeholder="Décrivez votre demande en détail..."
                  />
                  {fieldErrors.message && <p className="text-sm text-red-600 mt-1">{fieldErrors.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send size={18} className="mr-2" />
                      Envoyer le message
                    </>
                  )}
                </button>

                <p className="text-sm text-gray-600 text-center">
                  En envoyant ce formulaire, vous acceptez que vos données soient utilisées pour traiter votre demande.
                </p>
              </form>
            </div>
          </div>

          {/* Informations de contact */}
          <div className="space-y-6">
            {/* Coordonnées principales */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Informations de contact
              </h3>

              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="text-orange-500 mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium text-gray-900">Adresse</p>
                    <p className="text-gray-600">
                      Colobane, près de la Caisse de Sécurité Sociale<br />
                      Sur les deux voies<br />
                      Dakar, Sénégal
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Phone className="text-orange-500 mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium text-gray-900">Téléphones</p>
                    <div className="text-gray-600 space-y-1">
                      <p>+221 78 358 40 65</p>
                      <p>+221 77 782 90 71</p>
                      <p>+221 76 020 28 66</p>
                      <p>+221 77 481 66 56</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <Mail className="text-orange-500 mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <p className="text-gray-600">bibocomdigital@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="text-orange-500 mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium text-gray-900">Horaires</p>
                    <div className="text-gray-600 space-y-1">
                      <p><strong>Lundi - Vendredi :</strong></p>
                      <p>09h30 - 13h30</p>
                      <p>15h00 - 17h00</p>
                      <p><strong>Samedi :</strong> 10h00 - 14h00</p>
                      <p><strong>Dimanche :</strong> Fermé</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* À propos de Bibocom Digital */}
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Building className="text-orange-500 mr-2" size={20} />
                À propos de Bibocom Digital
              </h3>
              
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Bibocom Digital</strong> est un cabinet de formation & consulting spécialisé dans les métiers du numérique et de l'alphabétisation.
                </p>
                
                <div className="flex items-center text-sm">
                  <Users className="text-orange-500 mr-2" size={16} />
                  <span>Plus de 600 000 abonnés</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Globe className="text-orange-500 mr-2" size={16} />
                  <span>13 ans d'expérience</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <CheckCircle className="text-orange-500 mr-2" size={16} />
                  <span>Certifié Google Partner Premier</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-orange-200">
                <p className="text-sm text-gray-600 mb-3">
                  <strong>BibocomMarket</strong> est une application développée par Bibocom Digital pour faciliter le commerce local au Sénégal.
                </p>
                
                {/* Réseaux sociaux */}
                <div className="flex items-center space-x-3">
                  <p className="text-sm font-medium text-gray-700">Suivez-nous :</p>
                  <a 
                    href="https://www.facebook.com/BibocomDigital" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Facebook size={20} />
                  </a>
                  <a 
                    href="https://www.linkedin.com/in/habib-ndiaye-officiel-b36015177" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:text-blue-800 transition-colors"
                  >
                    <Linkedin size={20} />
                  </a>
                  <a 
                    href="https://www.tiktok.com/@bibocom_digital" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-800 hover:text-gray-900 transition-colors"
                  >
                    <MessageSquare size={20} />
                  </a>
                </div>
              </div>
            </div>

            {/* Aide rapide */}
            <div className="bg-blue-50 rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Besoin d'aide rapide ?
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <span className="text-gray-700">Support WhatsApp</span>
                  <a 
                    href="https://wa.me/221783584065" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                  >
                    Contacter
                  </a>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <span className="text-gray-700">FAQ</span>
                  <button className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 transition-colors">
                    Consulter
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <span className="text-gray-700">Guide utilisateur</span>
                  <button className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors">
                    Télécharger
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Autres bureaux / Points d'accueil */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Nos autres points d'accueil
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <MapPin className="text-orange-500 mx-auto mb-3" size={24} />
              <h4 className="font-semibold text-gray-900 mb-2">Liberté 5</h4>
              <p className="text-sm text-gray-600">Dakar</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <MapPin className="text-orange-500 mx-auto mb-3" size={24} />
              <h4 className="font-semibold text-gray-900 mb-2">Guédiawaye</h4>
              <p className="text-sm text-gray-600">Côté Mairie Wakhinane Nimzat</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <MapPin className="text-orange-500 mx-auto mb-3" size={24} />
              <h4 className="font-semibold text-gray-900 mb-2">Rufisque</h4>
              <p className="text-sm text-gray-600">Gaindé 3, côté dépôt gaz</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <MapPin className="text-orange-500 mx-auto mb-3" size={24} />
              <h4 className="font-semibold text-gray-900 mb-2">Mbour</h4>
              <p className="text-sm text-gray-600">Marché Central, face Préfecture</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;