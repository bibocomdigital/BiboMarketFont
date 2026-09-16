"use client";


import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UserRole, USER_ROLE_LABELS } from '@/types/user';
import { dashboardPathFor } from '@/hooks/use-auth-session';
import CountrySelect from '@/components/forms/register/CountrySelect';
import { Country } from '@/data/countries';
import { MapPin, UserCheck, ShoppingBag, ShoppingCart, User, Edit, Check } from 'lucide-react';
import PhoneInput from '@/components/forms/register/PhoneInput';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Validation schema for the form
const CompleteProfileSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phoneNumber: z.string().min(10, "Le numéro de téléphone doit contenir au moins 10 chiffres"),
  country: z.string().min(2, "Veuillez sélectionner un pays"),
  city: z.string().min(2, "Veuillez entrer une ville"),
  department: z.string().min(2, "Veuillez entrer un département"),
  commune: z.string().min(2, "Veuillez entrer une commune"),
  role: z.nativeEnum(UserRole, {
    required_error: "Veuillez sélectionner un rôle",
  }),
});

type CompleteProfileFormValues = z.infer<typeof CompleteProfileSchema>;

const CompleteProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  const form = useForm<CompleteProfileFormValues>({
    resolver: zodResolver(CompleteProfileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      country: '',
      city: '',
      department: '',
      commune: '',
      role: UserRole.CLIENT,
    },
  });

  useEffect(() => {
    // Get token from URL
    const params = new URLSearchParams(location.search);
    const urlToken = params.get('token');
    
    if (urlToken) {
      console.log('🔑 [COMPLETE_PROFILE] Token retrieved from URL:', urlToken.substring(0, 15) + '...');
      setToken(urlToken);
      
      // Store token in localStorage
      localStorage.setItem('auth_token', urlToken);
      
      // Verify token and prefill available user data
      fetchUserData(urlToken);
    } else {
      console.warn('⚠️ [COMPLETE_PROFILE] No token found in URL');
      toast({
        title: "Erreur d'authentification",
        description: "Veuillez vous connecter à nouveau",
        variant: "destructive"
      });
      navigate('/login');
    }
  }, [location, navigate, toast]);

  const fetchUserData = async (authToken: string) => {
    try {
      // API URL to get profile data
      const profileUrl = process.env.NEXT_PUBLIC_API_URL 
        ? `${process.env.NEXT_PUBLIC_API_URL}/auth/profile`
        : 'http://localhost:3000/api/auth/profile';
      
      console.log('🔍 [COMPLETE_PROFILE] Trying to retrieve profile from:', profileUrl);
      
      const response = await fetch(profileUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to retrieve user data');
      }
      
      const data = await response.json();
      console.log('👤 [COMPLETE_PROFILE] User data retrieved:', data);
      
      // Prefill form with existing data
      if (data.user) {
        const user = data.user;
        
        form.setValue('firstName', user.firstName || '');
        form.setValue('lastName', user.lastName || '');
        form.setValue('phoneNumber', user.phoneNumber || '');
        form.setValue('country', user.country || '');
        form.setValue('city', user.city || '');
        form.setValue('department', user.department || '');
        form.setValue('commune', user.commune || '');
        form.setValue('role', user.role || UserRole.CLIENT);
      }
    } catch (error) {
      console.error('🔴 [COMPLETE_PROFILE] Error retrieving data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer vos informations. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  const onCountryChange = (country: Country) => {
    setSelectedCountry(country);
    form.setValue('country', country.name);
  };

  const onSubmit = async (values: CompleteProfileFormValues) => {
    if (!token) {
      toast({
        title: "Erreur d'authentification",
        description: "Veuillez vous connecter à nouveau",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    
    setIsSubmitting(true);
    console.log('📝 [COMPLETE_PROFILE] Submitting form:', values);
    
    try {
      // API URL to update profile
      const updateProfileUrl = process.env.NEXT_PUBLIC_API_URL 
        ? `${process.env.NEXT_PUBLIC_API_URL}/auth/profile`
        : 'http://localhost:3000/api/auth/profile';
      
      console.log('🔄 [COMPLETE_PROFILE] Sending profile update to:', updateProfileUrl);
      
      const response = await fetch(updateProfileUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('🔴 [COMPLETE_PROFILE] Error response:', response.status, errorData);
        throw new Error(errorData.message || 'Failed to update profile');
      }
      
      const data = await response.json();
      console.log('✅ [COMPLETE_PROFILE] Profile updated successfully:', data);
      
      toast({
        title: "Profil complété",
        description: "Votre profil a été mis à jour avec succès",
      });
      
      navigate(dashboardPathFor(values.role));
    } catch (error) {
      console.error('🔴 [COMPLETE_PROFILE] Error updating profile:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre profil. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCompletionPercentage = () => {
    const fields = form.getValues();
    const totalFields = Object.keys(fields).length;
    let filledFields = 0;
    
    Object.values(fields).forEach(value => {
      if (value && value.toString().trim() !== '') {
        filledFields++;
      }
    });
    
    return Math.floor((filledFields / totalFields) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Compléter votre profil
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Rejoignez notre plateforme de commerce et profitez de nos services
          </p>
        </div>
        
        <div className="mt-10 flex flex-col lg:flex-row gap-8">
          {/* Left side: E-commerce imagery */}
          <div className="lg:w-5/12 flex flex-col gap-6">
            <Card className="bg-white shadow-lg rounded-lg overflow-hidden border-0">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 pb-6">
                <CardTitle className="text-white flex items-center text-2xl">
                  <ShoppingBag className="mr-2" />
                  Bienvenue sur notre plateforme
                </CardTitle>
                <CardDescription className="text-indigo-100">
                  Finalisez votre profil pour commencer votre expérience d'achat
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1607082349566-187342175e2f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                    alt="E-commerce shopping" 
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <h3 className="text-white text-lg font-bold">Des milliers de produits vous attendent</h3>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-semibold text-lg flex items-center">
                    <Check className="mr-2 text-green-500" />
                    Avantages de notre plateforme
                  </h3>
                  <ul className="mt-3 space-y-2">
                    <li className="flex items-start">
                      <Check className="mt-1 mr-2 text-green-500 h-4 w-4 flex-shrink-0" />
                      <span>Accès à des milliers de produits de qualité</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="mt-1 mr-2 text-green-500 h-4 w-4 flex-shrink-0" />
                      <span>Livraison rapide et sécurisée dans tout le pays</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="mt-1 mr-2 text-green-500 h-4 w-4 flex-shrink-0" />
                      <span>Service client disponible 24h/24 et 7j/7</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="mt-1 mr-2 text-green-500 h-4 w-4 flex-shrink-0" />
                      <span>Retours gratuits pendant 30 jours</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-lg rounded-lg overflow-hidden border-0">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <UserCheck className="mr-2 text-indigo-500" />
                  Progression du profil
                </h3>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-4 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${getCompletionPercentage()}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {getCompletionPercentage()}% complété
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Right side: Form */}
          <div className="lg:w-7/12">
            <Card className="bg-white shadow-xl rounded-lg border-0">
              <CardContent className="p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <Avatar className="h-12 w-12 mr-4">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-indigo-100 text-indigo-600">
                            <User size={24} />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-lg">Informations personnelles</h3>
                          <p className="text-sm text-gray-500">Complétez vos informations pour accéder à tous nos services</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="flex items-center" type="button">
                        <Edit className="mr-1 h-4 w-4" />
                        Modifier photo
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prénom</FormLabel>
                            <FormControl>
                              <Input placeholder="Votre prénom" {...field} className="border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom</FormLabel>
                            <FormControl>
                              <Input placeholder="Votre nom" {...field} className="border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-6">
                      <PhoneInput form={form} selectedCountry={selectedCountry || undefined} />
                      
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Je m'inscris en tant que*</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={(value) => {
                                  console.log('🔄 [COMPLETE_PROFILE] Role changed to:', value);
                                  field.onChange(value);
                                }}
                                value={field.value}
                                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                              >
                                {Object.values(UserRole)
                                  .filter((role) => role !== UserRole.ADMIN)
                                  .map((role) => (
                                  <FormItem key={role} className="flex items-start space-x-2 space-y-0 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                                    <FormControl>
                                      <RadioGroupItem value={role} className="mt-1" />
                                    </FormControl>
                                    <div className="space-y-1">
                                      <FormLabel className="font-semibold cursor-pointer">
                                        {USER_ROLE_LABELS[role as UserRole]}
                                      </FormLabel>
                                      <p className="text-xs text-gray-500">
                                        {role === UserRole.CLIENT ? 
                                          "Découvrez et achetez des produits" : 
                                          role === UserRole.MERCHANT ? 
                                          "Vendez vos produits sur notre plateforme" : 
                                          "Fournissez des produits aux marchands"}
                                      </p>
                                    </div>
                                  </FormItem>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <div className="text-xs text-muted-foreground">
                              * Veuillez sélectionner un rôle pour continuer
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex items-center mb-2">
                        <MapPin className="h-5 w-5 text-indigo-500 mr-2" />
                        <h3 className="font-medium">Localisation</h3>
                      </div>
                      
                      <CountrySelect form={form} onCountryChange={onCountryChange} />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ville</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    placeholder="Votre ville" 
                                    {...field} 
                                    className="border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" 
                                  />
                                  <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="department"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Département</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    placeholder="Votre département" 
                                    {...field} 
                                    className="border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" 
                                  />
                                  <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="commune"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Commune</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder="Votre commune" 
                                  {...field} 
                                  className="border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" 
                                />
                                <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Mise à jour en cours...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <UserCheck className="mr-2" size={20} />
                          Compléter mon profil
                        </span>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
