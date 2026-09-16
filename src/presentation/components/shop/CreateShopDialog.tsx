"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Store, Upload, MapPin, Phone, X, Tag } from "lucide-react";
import { useCreateShopMutation } from "@/hooks/mutations/use-catalog-mutations";
import { isLogoUploadFailure } from "@/services/shopService";
import { useShopCategoriesQuery } from "@/hooks/queries/use-shop-categories-query";
import { appAlert } from "@/presentation/lib/swal";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const MAX_LOGO_SIZE = 5 * 1024 * 1024;
const LOGO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const LOGO_UPLOAD_HINT =
  "Le logo n'a pas pu être enregistré. Le serveur refuse actuellement le téléchargement d'images. Votre boutique sera créée sans logo ; vous pourrez l'ajouter plus tard depuis les paramètres.";

interface CreateShopFormData {
  name: string;
  description: string;
  phoneNumber: string;
  address: string;
  categorieShopId: string;
}

interface CreateShopDialogProps {
  onSuccess: () => void;
}

function withoutLogo(formData: FormData): FormData {
  const next = new FormData();
  formData.forEach((value, key) => {
    if (key !== "logo") {
      next.append(key, value);
    }
  });
  return next;
}

const CreateShopDialog: React.FC<CreateShopDialogProps> = ({ onSuccess }) => {
  const [open, setOpen] = useState(false);
  const createShopMutation = useCreateShopMutation();
  const [isSaving, setIsSaving] = useState(false);
  const isLoading = isSaving || createShopMutation.isPending;
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const {
    data: categories = [],
    isError: categoriesFailed,
    isPending: categoriesPending,
    refetch: refetchCategories,
  } = useShopCategoriesQuery();
  const categoryLoadError = categoriesFailed
    ? "Impossible de charger les catégories. Réouvrez la fenêtre ou réessayez."
    : !categoriesPending && categories.length === 0
      ? "Aucune catégorie disponible pour le moment."
      : null;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateShopFormData>();

  const showShopError = async (error: unknown) => {
    const message =
      error instanceof Error
        ? error.message
        : "Une erreur est survenue lors de la création de la boutique";

    if (/téléphone|telephone|phone/i.test(message)) {
      setError("phoneNumber", { type: "server", message });
      return;
    }
    if (/catégorie|categorie/i.test(message)) {
      void refetchCategories();
      return;
    }
    if (isLogoUploadFailure(error)) {
      setLogoError(
        "Le logo n'a pas pu être envoyé. Réessayez avec une image plus légère, ou créez la boutique sans logo."
      );
      return;
    }
    await appAlert.error("Création impossible", message);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!LOGO_TYPES.includes(file.type)) {
      setLogoError("Format invalide. Utilisez une image JPG, PNG, WEBP ou GIF.");
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      setLogoError("Le logo dépasse 5 Mo. Choisissez une image plus légère.");
      return;
    }

    setLogoError(null);
    setSelectedLogo(file);
    setPreviewURL(URL.createObjectURL(file));
  };

  const clearSelectedLogo = () => {
    setSelectedLogo(null);
    setLogoError(null);
    if (previewURL) {
      URL.revokeObjectURL(previewURL);
      setPreviewURL(null);
    }
  };

  const finishSuccess = (createdWithoutLogo: boolean) => {
    reset();
    clearSelectedLogo();
    setOpen(false);
    onSuccess();
    if (createdWithoutLogo) {
      void appAlert.warning("Boutique créée sans logo", LOGO_UPLOAD_HINT);
    }
  };

  const onSubmit = async (data: CreateShopFormData) => {
    setIsSaving(true);
    setLogoError(null);

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("phoneNumber", data.phoneNumber);
    formData.append("address", data.address);
    formData.append("categorieShopId", data.categorieShopId);

    if (selectedLogo) {
      formData.append("logo", selectedLogo);
    }

    try {
      await createShopMutation.mutateAsync(formData);
      finishSuccess(false);
    } catch (error) {
      const hadLogo = Boolean(selectedLogo);
      if (hadLogo && isLogoUploadFailure(error)) {
        setLogoError(LOGO_UPLOAD_HINT);
        try {
          await createShopMutation.mutateAsync(withoutLogo(formData));
          finishSuccess(true);
          return;
        } catch (retryError) {
          await showShopError(retryError);
          return;
        }
      }

      await showShopError(error);
    } finally {
      setIsSaving(false);
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
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-bibocom-primary">
            Créer votre boutique
          </DialogTitle>
          <DialogDescription>
            Remplissez les informations ci-dessous pour créer votre boutique et
            commencer à vendre vos produits.
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
                <div
                  className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-bibocom-accent transition-colors ${
                    logoError ? "border-red-400 bg-red-50/50" : "border-gray-300"
                  }`}
                  onClick={() => document.getElementById("logo")?.click()}
                >
                  <Upload className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 text-center">
                    Cliquez pour sélectionner une image ou faites-la glisser ici
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PNG, JPG jusqu&apos;à 5MB
                  </p>
                </div>
              )}

              <input
                id="logo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
              {logoError && (
                <p className="text-red-500 text-xs mt-1">{logoError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center">
                <Store className="h-4 w-4 mr-2 text-bibocom-accent" />
                Nom de la boutique <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Entrez le nom de votre boutique"
                {...register("name", {
                  required: "Le nom de la boutique est requis",
                })}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categorieShopId" className="flex items-center">
                <Tag className="h-4 w-4 mr-2 text-bibocom-accent" />
                Catégorie <span className="text-red-500 ml-1">*</span>
              </Label>
              <select
                id="categorieShopId"
                {...register("categorieShopId", {
                  required: "La catégorie de la boutique est requise",
                })}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ${
                  errors.categorieShopId ? "border-red-500" : "border-input"
                }`}
              >
                <option value="">Choisissez une catégorie</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categorieShopId && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.categorieShopId.message}
                </p>
              )}
              {categoryLoadError && (
                <p className="text-red-500 text-xs mt-1">{categoryLoadError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center">
                <Store className="h-4 w-4 mr-2 text-bibocom-accent" />
                Description <span className="text-red-500 ml-1">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Décrivez votre boutique et ce que vous vendez"
                {...register("description", {
                  required: "La description est requise",
                })}
                className={`min-h-[100px] ${
                  errors.description ? "border-red-500" : ""
                }`}
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-bibocom-accent" />
                Numéro de téléphone <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="phoneNumber"
                placeholder="Ex: +225 0707070707"
                {...register("phoneNumber", {
                  required: "Le numéro de téléphone est requis",
                  pattern: {
                    value: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
                    message: "Numéro de téléphone invalide",
                  },
                })}
                className={errors.phoneNumber ? "border-red-500" : ""}
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-bibocom-accent" />
                Adresse <span className="text-red-500 ml-1">*</span>
              </Label>
              <Textarea
                id="address"
                placeholder="Entrez l'adresse complète de votre boutique"
                {...register("address", { required: "L'adresse est requise" })}
                className={errors.address ? "border-red-500" : ""}
              />
              {errors.address && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.address.message}
                </p>
              )}
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
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Création en cours...
                </span>
              ) : (
                "Créer ma boutique"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateShopDialog;
