"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getUserErrorMessage } from "@domain/errors/app-error";
import { useToast } from "@/hooks/use-toast";
import { productStatusLabel } from "@/lib/admin-analytics";
import { ProductPrice } from "@/components/product/ProductPrice";
import { formatImageUrl, type Product } from "@/services/productService";
import {
  useMerchantCatalogQuery,
  useUpdateProductStatusMutation,
} from "@/hooks/queries/use-merchant-query";
import { useDeleteProductMutation } from "@/hooks/mutations/use-catalog-mutations";
import CreateProductModal from "@/components/shop/CreateProductModal";
import EditProductModal from "@/components/shop/EditProductModal";
import ProductDetailModal from "@/components/ProductDetailModal";
import { useAuthSession } from "@/hooks/use-auth-session";
import NoShop from "@/components/shop/NoShop";
import { appAlert } from "@/presentation/lib/swal";
import {
  AccentButton,
  GhostButton,
  MerchantInput,
  MerchantSelect,
  MobileCard,
  PaginationBar,
  Panel,
  StateMessage,
  Td,
  Th,
  queryErrorMessage,
} from "./ui";

export function MerchantProductsView({
  merchantId,
  hasShop,
  enabled,
  onShopCreated,
}: {
  merchantId: number | null;
  hasShop: boolean;
  enabled: boolean;
  onShopCreated: () => void;
}) {
  const { toast } = useToast();
  const [, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuthSession();
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const query = useMerchantCatalogQuery(merchantId, page, 20, enabled && hasShop);
  const updateStatus = useUpdateProductStatusMutation();
  const deleteProduct = useDeleteProductMutation();
  const products = query.data?.products ?? [];
  const pagination = query.data?.pagination;

  const handleDelete = async (product: Product) => {
    const confirmed = await appAlert.confirm({
      title: "Supprimer ce produit ?",
      text: `"${product.name}" sera définitivement supprimé, ainsi que ses images et sa vidéo.`,
      confirmText: "Supprimer",
      cancelText: "Annuler",
      danger: true,
    });
    if (!confirmed) return;
    try {
      await deleteProduct.mutateAsync(product.id);
      toast({
        title: "Produit supprimé",
        description: `${product.name} a été supprimé`,
      });
    } catch (error) {
      toast({
        title: "Suppression impossible",
        description: getUserErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        String(product.id).includes(term);
      const matchesStatus = !status || product.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [products, search, status]);

  if (!hasShop) {
    return <NoShop onShopCreated={onShopCreated} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <MerchantInput
          value={draft}
          placeholder="Rechercher un produit"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              setPage(1);
              setSearch(draft.trim());
            }
          }}
          className="sm:max-w-sm"
        />
        <GhostButton
          onClick={() => {
            setPage(1);
            setSearch(draft.trim());
          }}
        >
          Rechercher
        </GhostButton>
        <MerchantSelect
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value);
          }}
        >
          <option value="">Tous les statuts</option>
          <option value="PUBLISHED">Publié</option>
          <option value="DRAFT">Brouillon</option>
        </MerchantSelect>
        <AccentButton className="sm:ml-auto" onClick={() => setCreateOpen(true)}>
          Ajouter un produit
        </AccentButton>
      </div>

      <Panel>
        {query.isPending && products.length === 0 ? (
          <StateMessage>Chargement des produits…</StateMessage>
        ) : query.isError ? (
          <StateMessage>{queryErrorMessage(query.error)}</StateMessage>
        ) : filtered.length === 0 ? (
          <StateMessage>Aucun produit trouvé.</StateMessage>
        ) : (
          <>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <Th>Produit</Th>
                  <Th>Prix</Th>
                  <Th>Stock</Th>
                  <Th>Statut</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const image = formatImageUrl(product.images?.[0]?.imageUrl || null);
                  const nextStatus = product.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
                  return (
                    <tr key={product.id} className="border-b border-slate-100 last:border-0">
                      <Td>
                        <div className="flex items-center gap-3">
                          {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-bibocom-light" />
                          )}
                          <span className="max-w-[220px] truncate font-medium">{product.name}</span>
                        </div>
                      </Td>
                      <Td><ProductPrice price={product.price} promoPrice={product.promoPrice} size="sm" /></Td>
                      <Td className={product.stock < 10 ? "font-medium text-amber-600" : undefined}>
                        {product.stock}
                        {product.stock < 10 ? " · bas" : ""}
                      </Td>
                      <Td>{productStatusLabel(product.status)}</Td>
                      <Td>
                        <div className="flex flex-wrap items-center gap-2">
                          <GhostButton
                            disabled={updateStatus.isPending}
                            onClick={() =>
                              updateStatus.mutate(
                                { productId: product.id, status: nextStatus },
                                {
                                  onError: (error) =>
                                    toast({
                                      title: "Statut non mis à jour",
                                      description: getUserErrorMessage(error),
                                      variant: "destructive",
                                    }),
                                }
                              )
                            }
                          >
                            {nextStatus === "PUBLISHED" ? "Publier" : "Mettre en brouillon"}
                          </GhostButton>
                          <GhostButton onClick={() => setPreviewProduct(product)}>
                            Voir
                          </GhostButton>
                          <GhostButton
                            onClick={() =>
                              setSearchParams({ view: "comptoir", product: String(product.id) })
                            }
                          >
                            Stock
                          </GhostButton>
                          <GhostButton onClick={() => setEditProduct(product)}>
                            Modifier
                          </GhostButton>
                          <GhostButton
                            disabled={deleteProduct.isPending}
                            onClick={() => void handleDelete(product)}
                          >
                            Supprimer
                          </GhostButton>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 p-3 md:hidden">
            {filtered.map((product) => {
              const image = formatImageUrl(product.images?.[0]?.imageUrl || null);
              const nextStatus = product.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
              return (
                <MobileCard key={product.id}>
                  <div className="flex items-center gap-3">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-bibocom-light" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium">{product.name}</p>
                      <p className="text-xs text-slate-500">{productStatusLabel(product.status)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <ProductPrice price={product.price} promoPrice={product.promoPrice} size="sm" />
                    <span className={product.stock < 10 ? "font-medium text-amber-600" : "text-slate-500"}>
                      Stock : {product.stock}{product.stock < 10 ? " · bas" : ""}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <GhostButton
                      disabled={updateStatus.isPending}
                      onClick={() =>
                        updateStatus.mutate(
                          { productId: product.id, status: nextStatus },
                          {
                            onError: (error) =>
                              toast({
                                title: "Statut non mis à jour",
                                description: getUserErrorMessage(error),
                                variant: "destructive",
                              }),
                          }
                        )
                      }
                    >
                      {nextStatus === "PUBLISHED" ? "Publier" : "Mettre en brouillon"}
                    </GhostButton>
                    <GhostButton onClick={() => setPreviewProduct(product)}>Voir</GhostButton>
                    <GhostButton
                      onClick={() =>
                        setSearchParams({ view: "comptoir", product: String(product.id) })
                      }
                    >
                      Stock
                    </GhostButton>
                    <GhostButton onClick={() => setEditProduct(product)}>Modifier</GhostButton>
                    <GhostButton
                      disabled={deleteProduct.isPending}
                      onClick={() => void handleDelete(product)}
                    >
                      Supprimer
                    </GhostButton>
                  </div>
                </MobileCard>
              );
            })}
          </div>
          </>
        )}
        {pagination ? (
          <PaginationBar
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPageChange={setPage}
          />
        ) : null}
      </Panel>

      <CreateProductModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onProductCreated={() => {
          setCreateOpen(false);
          void query.refetch();
        }}
      />

      {editProduct && (
        <EditProductModal
          key={editProduct.id}
          product={editProduct}
          onClose={() => setEditProduct(null)}
          onProductUpdated={() => {
            void query.refetch();
          }}
        />
      )}

      {previewProduct && (
        <ProductDetailModal
          product={previewProduct}
          isLoggedIn={isAuthenticated}
          currentUserId={user?.id}
          onClose={() => setPreviewProduct(null)}
        />
      )}
    </div>
  );
}
