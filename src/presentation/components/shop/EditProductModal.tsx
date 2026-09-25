"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Package, Tag, Video, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { useUpdateProductMutation } from '@/hooks/mutations/use-catalog-mutations';
import { useProductCategoriesQuery } from '@/hooks/queries/use-products-query';
import { useUpdateProductStatusMutation } from '@/hooks/queries/use-merchant-query';
import { formatImageUrl, type Product, type ProductImage } from '@/services/productService';

const MAX_IMAGES = 5;

interface EditProductModalProps {
  product: Product;
  onClose: () => void;
  onProductUpdated?: () => void;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
  product,
  onClose,
  onProductUpdated,
}) => {
  const [keptImages, setKeptImages] = useState<ProductImage[]>(() => product.images ?? []);
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<Array<{ file: File; preview: string }>>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [removeVideo, setRemoveVideo] = useState(false);
  const [isPublished, setIsPublished] = useState(product.status === 'PUBLISHED');
  const [error, setError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const updateProductMutation = useUpdateProductMutation();
  const statusMutation = useUpdateProductStatusMutation();
  const { data: categories = [] } = useProductCategoriesQuery();
  const loading = updateProductMutation.isPending;

  const [formData, setFormData] = useState(() => ({
    name: product.name ?? '',
    description: product.description ?? '',
    price: product.price != null ? String(product.price) : '',
    promoPrice: product.promoPrice != null ? String(product.promoPrice) : '',
    stock: product.stock != null ? String(product.stock) : '',
    category:
      product.categorieProdId != null
        ? String(product.categorieProdId)
        : product.categorieProd?.id != null
          ? String(product.categorieProd.id)
          : '',
    videoUrl: product.videoUrl ?? '',
  }));

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const totalImages = keptImages.length + newImages.length;

  const addImages = (files: File[]) => {
    const remaining = MAX_IMAGES - totalImages;
    if (remaining <= 0) {
      setError(`Maximum ${MAX_IMAGES} images par produit`);
      return;
    }
    const added = files.slice(0, remaining).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewImages((prev) => [...prev, ...added]);
    if (files.length > remaining) {
      setError(`Maximum ${MAX_IMAGES} images par produit`);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addImages(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const removeKeptImage = (image: ProductImage) => {
    setKeptImages((prev) => prev.filter((item) => item !== image));
    setRemovedImageUrls((prev) => [...prev, image.imageUrl]);
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setRemoveVideo(false);
  };

  const clearNewVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoFile(null);
    setVideoPreview('');
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Le nom du produit est obligatoire');
      return false;
    }
    if (!formData.description.trim()) {
      setError('La description du produit est obligatoire');
      return false;
    }
    if (!formData.price.trim() || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      setError('Le prix doit être un nombre positif');
      return false;
    }
    if (formData.promoPrice.trim()) {
      const promo = parseFloat(formData.promoPrice);
      if (Number.isNaN(promo) || promo <= 0 || promo >= parseFloat(formData.price)) {
        setError('Le prix promo doit être inférieur au prix');
        return false;
      }
    }
    if (!formData.stock.trim() || isNaN(parseInt(formData.stock)) || parseInt(formData.stock) < 0) {
      setError('Le stock doit être un nombre positif ou zéro');
      return false;
    }
    if (!formData.category) {
      setError('La catégorie est obligatoire');
      return false;
    }
    if (totalImages === 0) {
      setError('Au moins une image est requise');
      return false;
    }
    setError(null);
    return true;
  };

  const submitForm = async () => {
    if (!validateForm()) return;
    setError(null);

    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('description', formData.description);
      payload.append('price', formData.price);
      payload.append('promoPrice', formData.promoPrice.trim());
      payload.append('stock', formData.stock);
      payload.append('categorieProdId', formData.category);
      payload.append(
        'existingImageUrls',
        JSON.stringify(keptImages.map((image) => image.imageUrl))
      );
      payload.append('imagesToDelete', JSON.stringify(removedImageUrls));

      newImages.forEach((image) => payload.append('productImages', image.file));

      if (videoFile) {
        payload.append('video', videoFile);
      } else if (removeVideo) {
        payload.append('videoUrl', '');
      } else if (formData.videoUrl !== (product.videoUrl ?? '')) {
        payload.append('videoUrl', formData.videoUrl);
      }

      await updateProductMutation.mutateAsync({ productId: product.id, formData: payload });

      if (isPublished !== (product.status === 'PUBLISHED')) {
        await statusMutation.mutateAsync({
          productId: product.id,
          status: isPublished ? 'PUBLISHED' : 'DRAFT',
        });
      }

      toast({
        title: 'Produit mis à jour',
        description: `${formData.name} a été enregistré`,
        variant: 'default',
      });

      if (onProductUpdated) {
        onProductUpdated();
      }
      onClose();
    } catch (err) {
      console.error('Error updating product:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la mise à jour');
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative flex h-full items-stretch justify-center sm:items-center sm:p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          className="pointer-events-auto flex h-[100dvh] w-full max-w-4xl flex-col overflow-hidden bg-white shadow-[0_8px_30px_rgba(0,0,0,0.35)] animate-in fade-in-50 zoom-in-95 duration-300 sm:h-auto sm:max-h-[90vh] sm:rounded-xl"
        >
          <div className="flex shrink-0 items-center justify-between border-b p-4 sm:p-5">
            <div className="flex items-center">
              <Package className="h-5 w-5 text-bibocom-accent mr-2" />
              <h2 className="text-xl font-bold text-gray-800">Modifier le produit</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100 transition-colors"
              type="button"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom du produit *</Label>
                  <Input
                    id="name"
                    className="mt-1"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    className="mt-1 resize-none"
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Catégorie *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Prix (FCFA) *</Label>
                    <Input
                      id="price"
                      type="number"
                      className="mt-1"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="promoPrice">Prix promo (FCFA)</Label>
                    <Input
                      id="promoPrice"
                      type="number"
                      className="mt-1"
                      placeholder="Laisser vide hors promo"
                      value={formData.promoPrice}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock">Stock disponible *</Label>
                    <Input
                      id="stock"
                      type="number"
                      className="mt-1"
                      value={formData.stock}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <Tag className="h-5 w-5 text-gray-500 mr-2" />
                    <div>
                      <p className="font-medium">Publier le produit</p>
                      <p className="text-sm text-gray-500">Ou conserver comme brouillon</p>
                    </div>
                  </div>
                  <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <p className="font-medium text-gray-700 mb-2">
                    Images du produit * ({totalImages}/{MAX_IMAGES})
                  </p>
                  <div
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => imageInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addImages(
                        Array.from(e.dataTransfer.files).filter((file) =>
                          file.type.startsWith('image/')
                        )
                      );
                    }}
                  >
                    <input
                      type="file"
                      ref={imageInputRef}
                      onChange={handleImageChange}
                      className="hidden"
                      accept="image/*"
                      multiple
                    />
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Ajouter des images</p>
                    <Button variant="outline" size="sm" type="button">Parcourir</Button>
                    <p className="text-xs text-gray-500 mt-2">PNG, JPG ou WEBP (max. 5MB)</p>
                  </div>

                  {(keptImages.length > 0 || newImages.length > 0) && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {keptImages.map((image, index) => (
                        <div key={`kept-${index}`} className="relative rounded-lg overflow-hidden h-24 bg-gray-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={formatImageUrl(image.imageUrl) || image.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeKeptImage(image)}
                            className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                          >
                            <X className="h-3 w-3 text-gray-600" />
                          </button>
                        </div>
                      ))}
                      {newImages.map((image, index) => (
                        <div key={`new-${index}`} className="relative rounded-lg overflow-hidden h-24 bg-gray-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={image.preview} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                          >
                            <X className="h-3 w-3 text-gray-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="font-medium text-gray-700 mb-2">Vidéo du produit (optionnel)</p>

                  {videoPreview ? (
                    <div className="relative rounded-lg overflow-hidden border">
                      <video src={videoPreview} controls className="w-full h-40 object-cover"></video>
                      <button
                        type="button"
                        onClick={clearNewVideo}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                      >
                        <X className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  ) : product.videoUrl && !removeVideo ? (
                    <div className="relative rounded-lg overflow-hidden border">
                      <video src={product.videoUrl} controls className="w-full h-40 object-cover"></video>
                      <button
                        type="button"
                        onClick={() => setRemoveVideo(true)}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                      >
                        <X className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1">
                          <Label htmlFor="videoUrl" className="sr-only">URL de la vidéo</Label>
                          <Input
                            id="videoUrl"
                            placeholder="URL Youtube ou autre"
                            value={formData.videoUrl}
                            onChange={handleInputChange}
                            disabled={!!videoFile}
                          />
                        </div>
                        <span className="text-gray-500">OU</span>
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => videoInputRef.current?.click()}
                          disabled={!!videoFile}
                        >
                          <Video className="h-4 w-4 mr-1" />
                          Télécharger
                        </Button>
                      </div>
                      <div
                        className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => videoInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const file = e.dataTransfer.files[0];
                          if (file?.type.startsWith('video/')) {
                            setVideoFile(file);
                            setVideoPreview(URL.createObjectURL(file));
                            setRemoveVideo(false);
                          }
                        }}
                      >
                        <Video className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-1">Glissez-déposez une vidéo ou</p>
                        <Button variant="outline" size="sm" type="button">Parcourir</Button>
                        <p className="text-xs text-gray-500 mt-2">MP4, MOV, etc. (max. 50MB)</p>
                      </div>
                    </>
                  )}

                  <input
                    type="file"
                    ref={videoInputRef}
                    onChange={handleVideoChange}
                    className="hidden"
                    accept="video/*"
                  />

                  {removeVideo && (
                    <button
                      type="button"
                      onClick={() => setRemoveVideo(false)}
                      className="mt-2 text-sm text-bibocom-accent hover:underline"
                    >
                      Annuler la suppression de la vidéo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 gap-3 border-t bg-gray-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
            <Button
              variant="outline"
              onClick={onClose}
              type="button"
              className="flex-1 sm:flex-none"
            >
              Annuler
            </Button>
            <Button
              onClick={submitForm}
              disabled={loading}
              className="flex-1 bg-bibocom-accent hover:bg-bibocom-accent/90 sm:flex-none sm:min-w-[9rem]"
              type="button"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProductModal;
