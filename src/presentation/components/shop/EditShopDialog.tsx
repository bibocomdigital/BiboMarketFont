"use client";

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Shop, formatImageUrl, isLogoUploadFailure } from '@/services/shopService';
import { useUpdateShopMutation } from '@/hooks/mutations/use-catalog-mutations';
import { appAlert } from '@/presentation/lib/swal';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UploadCloud } from 'lucide-react';

const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const LOGO_UPLOAD_HINT =
  "Le nouveau logo n'a pas pu être enregistré. Le serveur refuse actuellement le téléchargement d'images. Les autres informations seront enregistrées sans changer le logo.";

function withoutLogo(formData: FormData): FormData {
  const next = new FormData();
  formData.forEach((value, key) => {
    if (key !== 'logo') {
      next.append(key, value);
    }
  });
  return next;
}

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
  const updateShopMutation = useUpdateShopMutation();
  const isSaving = updateShopMutation.isPending;
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    formatImageUrl(shop.logo)
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
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoError('Veuillez sélectionner une image JPG, PNG, WEBP ou GIF.');
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      setLogoError('Le logo dépasse 2 Mo. Choisissez une image plus légère.');
      return;
    }

    setLogoError(null);
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
    setLogoFile(file);
  };

  const finishSuccess = (savedWithoutNewLogo: boolean) => {
    onShopUpdated();
    onOpenChange(false);
    if (logoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreview);
    }
    if (savedWithoutNewLogo) {
      void appAlert.warning('Logo non enregistré', LOGO_UPLOAD_HINT);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLogoError(null);

    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('description', values.description);
    formData.append('address', values.address);
    formData.append('phoneNumber', values.phoneNumber);

    if (logoFile) {
      formData.append('logo', logoFile);
    }

    try {
      await updateShopMutation.mutateAsync({ shopId: shop.id, formData });
      finishSuccess(false);
    } catch (error) {
      if (logoFile && isLogoUploadFailure(error)) {
        setLogoError(LOGO_UPLOAD_HINT);
        try {
          await updateShopMutation.mutateAsync({
            shopId: shop.id,
            formData: withoutLogo(formData),
          });
          finishSuccess(true);
          return;
        } catch (retryError) {
          const message =
            retryError instanceof Error
              ? retryError.message
              : 'Impossible de mettre à jour la boutique.';
          await appAlert.error('Mise à jour impossible', message);
          return;
        }
      }

      if (isLogoUploadFailure(error)) {
        setLogoError(
          "Le logo n'a pas pu être envoyé. Enregistrez sans changer le logo, ou réessayez avec une image plus légère."
        );
        return;
      }

      await appAlert.error(
        'Mise à jour impossible',
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue lors de la mise à jour de votre boutique.'
      );
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
              {logoError && (
                <p className="text-red-500 text-xs mt-2">{logoError}</p>
              )}
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
                disabled={isSaving}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditShopDialog;
