"use client";

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Shop } from '@/services/shopService';
import { useUpdateShopMutation } from '@/hooks/mutations/use-catalog-mutations';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UploadCloud } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  phoneNumber: z.string().min(8, "Le numéro de téléphone doit contenir au moins 8 caractères"),
});

interface EditShopDialogProps {
  shop: Shop;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShopUpdated: () => void;
}

const EditShopDialog: React.FC<EditShopDialogProps> = ({
  shop,
  open,
  onOpenChange,
  onShopUpdated
}) => {
  const { toast } = useToast();
  const updateShopMutation = useUpdateShopMutation();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    shop.logo ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/uploads/${shop.logo.split('/').pop()}` : null
  );
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: shop.name,
      description: shop.description,
      address: shop.address,
      phoneNumber: shop.phoneNumber
    },
  });

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Vérification du type de fichier
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une image valide",
        variant: "destructive",
      });
      return;
    }
    
    // Création d'une URL pour la prévisualisation
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
    setLogoFile(file);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      console.log("🔄 [EDIT SHOP] Soumission du formulaire");
      
      // Créer un FormData si un logo est présent
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('description', values.description);
      formData.append('address', values.address);
      formData.append('phoneNumber', values.phoneNumber);
      
      // Ajouter le fichier logo s'il existe
      if (logoFile) {
        formData.append('logo', logoFile);
      }
      
      console.log("📤 [EDIT SHOP] Envoi des données vers le serveur");
      await updateShopMutation.mutateAsync({ shopId: shop.id, formData });
      console.log("✅ [EDIT SHOP] Boutique mise à jour avec succès");
      
      toast({
        title: "Boutique modifiée",
        description: "Votre boutique a été mise à jour avec succès",
      });
      onShopUpdated();
      onOpenChange(false);
      
      // Nettoyage des URL d'objets pour éviter les fuites de mémoire
      if (logoPreview && !shop.logo) {
        URL.revokeObjectURL(logoPreview);
      }
    } catch (error) {
      console.error("❌ [EDIT SHOP] Erreur lors de la mise à jour:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la mise à jour de votre boutique",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier ma boutique</DialogTitle>
          <DialogDescription>
            Modifiez les informations de votre boutique. Cliquez sur enregistrer quand vous avez terminé.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {/* Champ pour le logo */}
            <div className="mb-6">
              <FormLabel htmlFor="logo" className="block mb-2">Logo de la boutique</FormLabel>
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16 border">
                  {logoPreview ? (
                    <AvatarImage src={logoPreview} alt="Logo de la boutique" />
                  ) : (
                    <AvatarFallback className="bg-bibocom-primary text-white text-xl">
                      {shop.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <UploadCloud className="h-4 w-4 mr-2 text-gray-500" />
                    <span>Changer le logo</span>
                    <input
                      id="logo-upload"
                      name="logo"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleLogoChange}
                    />
                  </div>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Formats recommandés : JPG, PNG. Taille maximale : 2MB
              </p>
            </div>
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la boutique</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom de votre boutique" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Décrivez votre boutique" 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Input placeholder="Adresse de votre boutique" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numéro de téléphone</FormLabel>
                  <FormControl>
                    <Input placeholder="Numéro de téléphone" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditShopDialog;
