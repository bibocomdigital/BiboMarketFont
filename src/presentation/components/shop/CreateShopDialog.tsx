"use client";


import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { Store, Upload, MapPin, Phone, X } from 'lucide-react';
import { useCreateShopMutation } from '@/hooks/mutations/use-catalog-mutations';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface CreateShopFormData {
  name: string;
  description: string;
  phoneNumber: string;
  address: string;
}

interface CreateShopDialogProps {
  onSuccess: () => void;
}

const CreateShopDialog: React.FC<CreateShopDialogProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const createShopMutation = useCreateShopMutation();
  const isLoading = createShopMutation.isPending;
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateShopFormData>();
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedLogo(file);
      setPreviewURL(URL.createObjectURL(file));
    }
  };
  
  const clearSelectedLogo = () => {
    setSelectedLogo(null);
    if (previewURL) {
      URL.revokeObjectURL(previewURL);
      setPreviewURL(null);
    }
  };
  
  const onSubmit = async (data: CreateShopFormData) => {
    try {
      // Créer un objet FormData pour envoyer les données et le fichier
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('phoneNumber', data.phoneNumber);
      formData.append('address', data.address);
      
      if (selectedLogo) {
        formData.append('logo', selectedLogo);
      }
      
      // Appeler le service pour créer la boutique
      await createShopMutation.mutateAsync(formData);
      
      toast({
        title: "Boutique créée avec succès",
        description: "Votre boutique a été créée et est maintenant disponible.",
      });
      
      // Réinitialiser le formulaire
      reset();
      clearSelectedLogo();
      setOpen(false);
      
      // Appeler la fonction de succès
      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la création de la boutique:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la création de la boutique",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-bibocom-primary to-bibocom-accent text-white">
          <Store className="mr-2 h-4 w-4" />
          Créer ma boutique
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-bibocom-primary">Créer votre boutique</DialogTitle>
          <DialogDescription>
            Remplissez les informations ci-dessous pour créer votre boutique et commencer à vendre vos produits.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logo" className="flex items-center">
                Logo de la boutique
              </Label>
              
              {previewURL ? (
                <div className="relative w-32 h-32 mx-auto">
                  <img 
                    src={previewURL} 
                    alt="Aperçu du logo" 
                    className="w-full h-full object-cover rounded-lg border-2 border-bibocom-accent"
                  />
                  <button
                    type="button"
                    onClick={clearSelectedLogo}
                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-bibocom-accent transition-colors"
                  onClick={() => document.getElementById('logo')?.click()}>
                  <Upload className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 text-center">
                    Cliquez pour sélectionner une image ou faites-la glisser ici
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG jusqu'à 5MB</p>
                </div>
              )}
              
              <input
                id="logo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center">
                <Store className="h-4 w-4 mr-2 text-bibocom-accent" />
                Nom de la boutique <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Entrez le nom de votre boutique"
                {...register('name', { required: "Le nom de la boutique est requis" })}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center">
                <Store className="h-4 w-4 mr-2 text-bibocom-accent" />
                Description <span className="text-red-500 ml-1">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Décrivez votre boutique et ce que vous vendez"
                {...register('description', { required: "La description est requise" })}
                className={`min-h-[100px] ${errors.description ? "border-red-500" : ""}`}
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-bibocom-accent" />
                Numéro de téléphone <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="phoneNumber"
                placeholder="Ex: +225 0707070707"
                {...register('phoneNumber', { 
                  required: "Le numéro de téléphone est requis",
                  pattern: {
                    value: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
                    message: "Numéro de téléphone invalide"
                  }
                })}
                className={errors.phoneNumber ? "border-red-500" : ""}
              />
              {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-bibocom-accent" />
                Adresse <span className="text-red-500 ml-1">*</span>
              </Label>
              <Textarea
                id="address"
                placeholder="Entrez l'adresse complète de votre boutique"
                {...register('address', { required: "L'adresse est requise" })}
                className={errors.address ? "border-red-500" : ""}
              />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              className="bg-bibocom-accent hover:bg-bibocom-accent/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Création en cours...
                </span>
              ) : "Créer ma boutique"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateShopDialog;
