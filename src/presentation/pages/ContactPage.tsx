"use client";

import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { contactFormSchema } from '@/presentation/lib/validation/schemas';
import { appAlert } from '@/presentation/lib/swal';
import { SupportAssistant } from '@/components/support/SupportAssistant';
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

const ContactPage = ({ embedded = false }: { embedded?: boolean }) => {
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
    <div className={embedded ? "overflow-hidden rounded-[18px] bg-white ring-1 ring-slate-100" : "flex min-h-screen flex-col bg-bibocom-light"}>
      {!embedded && <Header />}
      <div className={embedded ? undefined : "flex-1 pt-20 md:pt-24"}>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-bibocom-primary text-white">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-bibocom-secondary/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-bibocom-accent/20 blur-3xl" />
        <div className="container relative mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">
              Contactez-<span className="text-bibocom-accent">nous</span>
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Notre équipe est là pour vous accompagner dans votre expérience BibocomMarket
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <SupportAssistant />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire de contact */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-8">
              <h2 className="text-2xl font-bold text-bibocom-primary mb-6">
                Envoyez-nous un message
              </h2>

              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-bibocom-success/10 border border-bibocom-success/30 rounded-lg flex items-center">
                  <CheckCircle className="text-bibocom-success mr-3" size={20} />
                  <p className="text-bibocom-success">Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.</p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 flex items-center rounded-lg border border-bibocom-error/30 bg-bibocom-error/10 p-4">
                  <AlertCircle className="mr-3 text-bibocom-error" size={20} />
                  <p className="text-bibocom-error">Une erreur est survenue lors de l'envoi. Veuillez réessayer.</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-bibocom-primary/80 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-bibocom-primary outline-none ring-bibocom-accent/30 placeholder:text-slate-400 focus:ring-2"
                      placeholder="Votre nom complet"
                    />
                    {fieldErrors.name && <p className="mt-1 text-sm text-bibocom-error">{fieldErrors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-bibocom-primary/80 mb-2">
                      Email *
                    </label>
                    <input
                      type="text"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-bibocom-primary outline-none ring-bibocom-accent/30 placeholder:text-slate-400 focus:ring-2"
                      placeholder="votre@email.com"
                    />
                    {fieldErrors.email && <p className="mt-1 text-sm text-bibocom-error">{fieldErrors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-bibocom-primary/80 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-bibocom-primary outline-none ring-bibocom-accent/30 placeholder:text-slate-400 focus:ring-2"
                      placeholder="+221 XX XXX XX XX"
                    />
                  </div>

                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-bibocom-primary/80 mb-2">
                      Type de demande *
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-bibocom-primary outline-none ring-bibocom-accent/30 placeholder:text-slate-400 focus:ring-2"
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
                  <label htmlFor="subject" className="block text-sm font-medium text-bibocom-primary/80 mb-2">
                    Sujet *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-bibocom-primary outline-none ring-bibocom-accent/30 placeholder:text-slate-400 focus:ring-2"
                    placeholder="Résumé de votre demande"
                  />
                  {fieldErrors.subject && <p className="mt-1 text-sm text-bibocom-error">{fieldErrors.subject}</p>}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-bibocom-primary/80 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-bibocom-primary outline-none ring-bibocom-accent/30 placeholder:text-slate-400 focus:ring-2 resize-vertical"
                    placeholder="Décrivez votre demande en détail..."
                  />
                  {fieldErrors.message && <p className="mt-1 text-sm text-bibocom-error">{fieldErrors.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center rounded-xl bg-bibocom-accent py-3 px-6 font-semibold text-white transition-colors hover:bg-bibocom-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
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

                <p className="text-sm text-bibocom-primary/70 text-center">
                  En envoyant ce formulaire, vous acceptez que vos données soient utilisées pour traiter votre demande.
                </p>
              </form>
            </div>
          </div>

          {/* Informations de contact */}
          <div className="space-y-6">
            {/* Coordonnées principales */}
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6">
              <h3 className="text-xl font-bold text-bibocom-primary mb-4">
                Informations de contact
              </h3>

              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="text-bibocom-accent mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium text-bibocom-primary">Adresse</p>
                    <p className="text-bibocom-primary/70">
                      Colobane, près de la Caisse de Sécurité Sociale<br />
                      Sur les deux voies<br />
                      Dakar, Sénégal
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Phone className="text-bibocom-accent mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium text-bibocom-primary">Téléphones</p>
                    <div className="space-y-1">
                      {[
                        ["+221 78 358 40 65", "+221783584065"],
                        ["+221 77 782 90 71", "+221777829071"],
                        ["+221 76 020 28 66", "+221760202866"],
                        ["+221 77 481 66 56", "+221774816656"],
                      ].map(([label, tel]) => (
                        <a key={tel} href={`tel:${tel}`} className="block text-bibocom-primary/70 hover:text-bibocom-accent">
                          {label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <Mail className="text-bibocom-accent mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium text-bibocom-primary">Email</p>
                    <a href="mailto:bibocomdigital@gmail.com" className="text-bibocom-primary/70 hover:text-bibocom-accent">
                      bibocomdigital@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="text-bibocom-accent mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium text-bibocom-primary">Horaires</p>
                    <div className="text-bibocom-primary/70 space-y-1">
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
            <div className="bg-gradient-to-br from-bibocom-secondary/25 to-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-bibocom-primary mb-4 flex items-center">
                <Building className="text-bibocom-accent mr-2" size={20} />
                À propos de Bibocom Digital
              </h3>
              
              <div className="space-y-3 text-bibocom-primary/80">
                <p>
                  <strong>Bibocom Digital</strong> est un cabinet de formation & consulting spécialisé dans les métiers du numérique et de l'alphabétisation.
                </p>
                
                <div className="flex items-center text-sm">
                  <Users className="text-bibocom-accent mr-2" size={16} />
                  <span>Plus de 600 000 abonnés</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Globe className="text-bibocom-accent mr-2" size={16} />
                  <span>13 ans d'expérience</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <CheckCircle className="text-bibocom-accent mr-2" size={16} />
                  <span>Certifié Google Partner Premier</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-bibocom-secondary/40">
                <p className="text-sm text-bibocom-primary/70 mb-3">
                  <strong>BibocomMarket</strong> est une application développée par Bibocom Digital pour faciliter le commerce local au Sénégal.
                </p>
                
                {/* Réseaux sociaux */}
                <div className="flex items-center space-x-3">
                  <p className="text-sm font-medium text-bibocom-primary/80">Suivez-nous :</p>
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
                    className="text-bibocom-primary hover:text-bibocom-primary transition-colors"
                  >
                    <MessageSquare size={20} />
                  </a>
                </div>
              </div>
            </div>

            {/* Aide rapide */}
            <div className="bg-bibocom-secondary/20 rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-bibocom-primary mb-4">
                Besoin d'aide rapide ?
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <span className="text-bibocom-primary/80">Support WhatsApp</span>
                  <a 
                    href="https://wa.me/221783584065" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="rounded bg-bibocom-success px-3 py-1 text-sm text-white transition-colors hover:bg-bibocom-success/90"
                  >
                    Contacter
                  </a>
                </div>
                
                <a href="/about" className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <span className="text-bibocom-primary/80">À propos</span>
                  <span className="rounded bg-bibocom-accent px-3 py-1 text-sm text-white">Consulter</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Autres bureaux / Points d'accueil */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-bibocom-primary mb-8 text-center">
            Nos autres points d'accueil
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6 text-center">
              <MapPin className="text-bibocom-accent mx-auto mb-3" size={24} />
              <h4 className="font-semibold text-bibocom-primary mb-2">Liberté 5</h4>
              <p className="text-sm text-bibocom-primary/70">Dakar</p>
            </div>
            
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6 text-center">
              <MapPin className="text-bibocom-accent mx-auto mb-3" size={24} />
              <h4 className="font-semibold text-bibocom-primary mb-2">Guédiawaye</h4>
              <p className="text-sm text-bibocom-primary/70">Côté Mairie Wakhinane Nimzat</p>
            </div>
            
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6 text-center">
              <MapPin className="text-bibocom-accent mx-auto mb-3" size={24} />
              <h4 className="font-semibold text-bibocom-primary mb-2">Rufisque</h4>
              <p className="text-sm text-bibocom-primary/70">Gaindé 3, côté dépôt gaz</p>
            </div>
            
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6 text-center">
              <MapPin className="text-bibocom-accent mx-auto mb-3" size={24} />
              <h4 className="font-semibold text-bibocom-primary mb-2">Mbour</h4>
              <p className="text-sm text-bibocom-primary/70">Marché Central, face Préfecture</p>
            </div>
          </div>
        </div>
      </div>
      </div>
      {!embedded && <Footer />}
    </div>
  );
};

export default ContactPage;