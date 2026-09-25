"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Package, 
  Tag,
  CheckCircle2,
  Video,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { useCreateProductMutation } from '@/hooks/mutations/use-catalog-mutations';
import { useProductCategoriesQuery } from '@/hooks/queries/use-products-query';

const MAX_IMAGES = 5;

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated?: () => void; // Callback pour rafraîchir la liste des produits
}

const CreateProductModal: React.FC<CreateProductModalProps> = ({ isOpen, onClose, onProductCreated }) => {
  console.log("CreateProductModal rendered, isOpen:", isOpen);
  
  const [images, setImages] = useState<Array<{file: File, preview: string}>>([]);
  const [isPublished, setIsPublished] = useState(false);
  const createProductMutation = useCreateProductMutation();
  const { data: categories = [] } = useProductCategoriesQuery(isOpen);
  const loading = createProductMutation.isPending;
  const [error, setError] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Formdata for product
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    promoPrice: '',
    stock: '',
    category: '',
    videoUrl: '',
    status: 'DRAFT'
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setImages([]);
      setVideoFile(null);
      setVideoPreview('');
      setIsPublished(false);
      setError(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        promoPrice: '',
        stock: '',
        category: '',
        videoUrl: '',
        status: 'DRAFT'
      });
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value
    });
  };

  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      category: value
    });
  };

  const addImages = (files: File[]) => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setError(`Maximum ${MAX_IMAGES} images par produit`);
      return;
    }
    const newImages = files.slice(0, remaining).map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setImages([...images, ...newImages]);
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

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      setVideoFile(file);
      setVideoPreview(preview);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const removeVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoFile(null);
    setVideoPreview('');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, type: 'image' | 'video') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files) {
      if (type === 'image') {
        const files = Array.from(e.dataTransfer.files).filter(file =>
          file.type.startsWith('image/')
        );
        addImages(files);
      } else if (type === 'video' && e.dataTransfer.files[0]?.type.startsWith('video/')) {
        const file = e.dataTransfer.files[0];
        const preview = URL.createObjectURL(file);
        setVideoFile(file);
        setVideoPreview(preview);
      }
    }
  };

  const handleClose = () => {
    console.log("Modal close triggered");
    onClose();
  };

  const validateForm = (): boolean => {
    // Vérification des champs obligatoires
    if (!formData.name.trim()) {
      setError("Le nom du produit est obligatoire");
      return false;
    }
    if (!formData.description.trim()) {
      setError("La description du produit est obligatoire");
      return false;
    }
    if (!formData.price.trim() || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      setError("Le prix doit être un nombre positif");
      return false;
    }
    if (formData.promoPrice.trim()) {
      const promo = parseFloat(formData.promoPrice);
      if (isNaN(promo) || promo <= 0 || promo >= parseFloat(formData.price)) {
        setError("Le prix promo doit être inférieur au prix");
        return false;
      }
    }
    if (!formData.stock.trim() || isNaN(parseInt(formData.stock)) || parseInt(formData.stock) < 0) {
      setError("Le stock doit être un nombre positif ou zéro");
      return false;
    }
    if (!formData.category) {
      setError("La catégorie est obligatoire");
      return false;
    }
    if (images.length === 0) {
      setError("Au moins une image est requise");
      return false;
    }
    
    setError(null);
    return true;
  };

  const submitForm = async () => {
    if (!validateForm()) return;
    
    console.log("Form submission started");
    setError(null);
    
    try {
      // Create FormData object for API submission
      const productData = new FormData();
      
      // Add text fields
      productData.append('name', formData.name);
      productData.append('description', formData.description);
      productData.append('price', formData.price);
      productData.append('promoPrice', formData.promoPrice.trim());
      productData.append('stock', formData.stock);
      productData.append('categorieProdId', formData.category);
      productData.append('status', isPublished ? 'PUBLISHED' : 'DRAFT');
      
      // Add image files
      images.forEach((image) => {
        // Utilisez 'productImages' au lieu de 'images' pour correspondre au middleware Multer du backend
        productData.append('productImages', image.file);
      });
      
      // Add video file if exists
      if (videoFile) {
        productData.append('video', videoFile);
      } else if (formData.videoUrl) {
        productData.append('videoUrl', formData.videoUrl);
      }
      
      console.log("Form data prepared:", {
        name: formData.name,
        description: formData.description.substring(0, 20) + "...",
        price: formData.price,
        stock: formData.stock,
        category: formData.category,
        status: isPublished ? 'PUBLISHED' : 'DRAFT',
        imageCount: images.length,
        hasVideo: videoFile ? true : false
      });
      
      await createProductMutation.mutateAsync(productData);
      
      // Afficher un message de succès
      if (typeof toast !== 'undefined') {
        toast({
          title: "Produit créé avec succès",
          description: `${formData.name} a été ajouté à votre catalogue`,
          variant: "default"
        });
      } else {
        alert(`Produit "${formData.name}" créé avec succès`);
      }
      
      // Fermer le modal et effectuer le callback si disponible
      if (onProductCreated) {
        onProductCreated();
      }
      handleClose();
      
    } catch (error) {
      console.error("Error creating product:", error);
      setError(error instanceof Error ? error.message : "Une erreur est survenue lors de la création du produit");
    }
  };

  // Force a re-render when isOpen changes to ensure z-index is applied correctly
  useEffect(() => {
    if (isOpen) {
      console.log("Modal is now open, applying styles");
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      console.log("Modal is now closed, removing styles");
      document.body.style.overflow = ''; // Restore scrolling
    }
    
    return () => {
      document.body.style.overflow = ''; // Cleanup on unmount
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div className="relative flex h-full items-stretch justify-center sm:items-center sm:p-4 pointer-events-none">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          className="pointer-events-auto flex h-[100dvh] w-full max-w-4xl flex-col overflow-hidden bg-white shadow-[0_8px_30px_rgba(0,0,0,0.35)] animate-in fade-in-50 zoom-in-95 duration-300 sm:h-auto sm:max-h-[90vh] sm:rounded-xl"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b p-4 sm:p-5">
            <div className="flex items-center">
              <Package className="h-5 w-5 text-bibocom-accent mr-2" />
              <h2 className="text-xl font-bold text-gray-800">Ajouter un produit</h2>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-1 hover:bg-gray-100 transition-colors"
              type="button"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>
          
          {/* Content */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            {/* Affichage des erreurs */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column - Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom du produit *</Label>
                  <Input 
                    id="name" 
                    placeholder="Ex: Smartphone Galaxy S22" 
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
                    placeholder="Décrivez votre produit en détail..."
                    className="mt-1 resize-none"
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Catégorie *</Label>
                  <Select value={formData.category} onValueChange={handleSelectChange}>
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
                      placeholder="Ex: 15000" 
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
                      placeholder="Laisser vide hors promo"
                      className="mt-1"
                      value={formData.promoPrice}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock">Stock disponible *</Label>
                    <Input 
                      id="stock" 
                      type="number" 
                      placeholder="Ex: 10" 
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
                      <p className="font-medium">Publier maintenant</p>
                      <p className="text-sm text-gray-500">Ou sauvegarder comme brouillon</p>
                    </div>
                  </div>
                  <Switch
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                  />
                </div>
              </div>
              
              {/* Right column - Media */}
              <div className="space-y-5">
                <div>
                  <p className="font-medium text-gray-700 mb-2">Images du produit *</p>
                  <div 
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => imageInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'image')}
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
                    <p className="text-sm text-gray-600 mb-1">Glissez-déposez vos images ici ou</p>
                    <Button variant="outline" size="sm" type="button">Parcourir</Button>
                    <p className="text-xs text-gray-500 mt-2">PNG, JPG ou WEBP (max. 5MB)</p>
                  </div>
                  
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {images.map((image, index) => (
                        <div key={index} className="relative rounded-lg overflow-hidden h-24 bg-gray-200">
                          <img
                            src={image.preview}
                            alt={`Aperçu ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
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
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1">
                      <Label htmlFor="videoUrl" className="sr-only">URL de la vidéo</Label>
                      <Input 
                        id="videoUrl" 
                        placeholder="URL Youtube ou autre (ex: https://youtube.com/watch?v=...)" 
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
                    <input
                      type="file"
                      ref={videoInputRef}
                      onChange={handleVideoChange}
                      className="hidden"
                      accept="video/*"
                    />
                  </div>
                  
                  {videoPreview && (
                    <div className="relative rounded-lg overflow-hidden border">
                      <video 
                        src={videoPreview} 
                        controls 
                        className="w-full h-40 object-cover"
                      ></video>
                      <button
                        type="button"
                        onClick={removeVideo}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                      >
                        <X className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  )}
                  
                  <div 
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors ${videoFile ? 'hidden' : 'block'}`}
                    onClick={() => videoInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'video')}
                  >
                    <Video className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Glissez-déposez une vidéo ou</p>
                    <Button variant="outline" size="sm" type="button">Parcourir la galerie</Button>
                    <p className="text-xs text-gray-500 mt-2">MP4, MOV, etc. (max. 50MB)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex shrink-0 gap-3 border-t bg-gray-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
            <Button
              variant="outline"
              onClick={handleClose}
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
              {loading ? (
                <>
                  <span className="mr-2">Création en cours...</span>
                  <span className="animate-spin">◌</span>
                </>
              ) : isPublished ? 'Publier' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProductModal;