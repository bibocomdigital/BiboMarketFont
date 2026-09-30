"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getUserErrorMessage } from "@domain/errors/app-error";
import { useToast } from "@/hooks/use-toast";
import { formatDateFr, productStatusLabel } from "@/lib/admin-analytics";
import { checkoutBoost, confirmBoost, listPublicBoostPlans, type BoostPlan } from "@/services/boostService";
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

function boostLabel(product: Product): string {
  if (!product.boostedUntil) return "Booster";
  const until = new Date(product.boostedUntil);
  if (Number.isNaN(until.getTime()) || until.getTime() <= Date.now()) return "Booster";
  return `Boosté · ${formatDateFr(product.boostedUntil)}`;
}

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
  const [searchParams, setSearchParams] = useSearchParams();
  const queryFromUrl = searchParams.get("q") || "";
  const { isAuthenticated, user } = useAuthSession();
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState(queryFromUrl);
  const [search, setSearch] = useState(queryFromUrl);

  useEffect(() => {
    setDraft(queryFromUrl);
    setSearch(queryFromUrl);
  }, [queryFromUrl]);

  useEffect(() => {
    if (searchParams.get("boost") !== "1") return;
    const token = searchParams.get("token");
    if (!token) return;
    let cancelled = false;
    confirmBoost(token)
      .then((result) => {
        if (cancelled) return;
        toast({ title: result.paid ? "Produit boosté" : "Paiement non confirmé" });
        void query.refetch();
      })
      .catch((error) => {
        if (!cancelled) {
          toast({
            title: "Confirmation impossible",
            description: getUserErrorMessage(error),
            variant: "destructive",
          });
        }
      })
      .finally(() => {
        if (cancelled) return;
        setSearchParams((prev) => {
          const params = new URLSearchParams(prev);
          params.delete("token");
          params.delete("boost");
          return params;
        });
      });
    return () => {
      cancelled = true;
    };
    // Confirme le retour PayDunya une seule fois.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  const [status, setStatus] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const query = useMerchantCatalogQuery(merchantId, page, 20, enabled && hasShop);
  const updateStatus = useUpdateProductStatusMutation();
  const deleteProduct = useDeleteProductMutation();
  const [boostingId, setBoostingId] = useState<number | null>(null);
  const [boostTarget, setBoostTarget] = useState<Product | null>(null);
  const [boostPlans, setBoostPlans] = useState<BoostPlan[]>([]);
  const [boostSaleOpen, setBoostSaleOpen] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [boostPlansError, setBoostPlansError] = useState("");
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

  const openBoost = (product: Product) => {
    setBoostTarget(product);
    setSelectedPlanId(null);
    setBoostPlansError("");
    listPublicBoostPlans()
      .then((data) => {
        setBoostSaleOpen(data.saleOpen);
        setBoostPlans(data.plans);
        setSelectedPlanId(data.plans[0]?.id ?? null);
      })
      .catch((error) => setBoostPlansError(getUserErrorMessage(error)));
  };

  const startBoost = async () => {
    if (!boostTarget || !selectedPlanId) return;
    setBoostingId(boostTarget.id);
    try {
      const invoice = await checkoutBoost(boostTarget.id, selectedPlanId);
      window.location.assign(invoice.checkoutUrl);
    } catch (error) {
      toast({
        title: "Boost impossible",
        description: getUserErrorMessage(error),
        variant: "destructive",
      });
      setBoostingId(null);
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
                          {product.status === "PUBLISHED" ? (
                            <GhostButton disabled={boostingId === product.id} onClick={() => openBoost(product)}>
                              {boostLabel(product)}
                            </GhostButton>
                          ) : null}
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
                    {product.status === "PUBLISHED" ? (
                      <GhostButton disabled={boostingId === product.id} onClick={() => openBoost(product)}>
                        {boostLabel(product)}
                      </GhostButton>
                    ) : null}
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

      {boostTarget ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
          <button type="button" className="absolute inset-0 bg-bibocom-primary/45" aria-label="Fermer" onClick={() => setBoostTarget(null)} />
          <div role="dialog" aria-modal="true" className="relative w-full max-w-md rounded-[22px] bg-white p-5 shadow-2xl">
            <h2 className="text-lg font-semibold text-bibocom-primary">Booster {boostTarget.name}</h2>
            <p className="mt-1 text-sm text-slate-500">Choisissez une formule. Le produit passe devant les autres pendant la durée payée.</p>
            {boostPlansError ? <p className="mt-4 text-sm text-bibocom-error">{boostPlansError}</p> : null}
            {!boostPlansError && !boostSaleOpen ? (
              <p className="mt-4 text-sm text-slate-500">Le boost est fermé pour le moment.</p>
            ) : null}
            {boostSaleOpen && boostPlans.length === 0 && !boostPlansError ? (
              <p className="mt-4 text-sm text-slate-500">Aucune formule n’est proposée pour le moment.</p>
            ) : null}
            {boostSaleOpen && boostPlans.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {boostPlans.map((plan) => (
                  <li key={plan.id}>
                    <label className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-3 py-3 ${selectedPlanId === plan.id ? "border-bibocom-accent bg-orange-50" : "border-slate-200"}`}>
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="boost-plan"
                          checked={selectedPlanId === plan.id}
                          onChange={() => setSelectedPlanId(plan.id)}
                          className="accent-[#FF7E5F]"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-bibocom-primary">{plan.name}</span>
                          <span className="block text-xs text-slate-500">{plan.durationDays} jour{plan.durationDays > 1 ? "s" : ""}</span>
                        </span>
                      </span>
                      <span className="text-sm font-semibold text-bibocom-primary">{plan.priceCfa.toLocaleString("fr-FR")} FCFA</span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setBoostTarget(null)} className="rounded-full px-4 py-2 text-sm font-medium text-slate-500">
                Annuler
              </button>
              <button
                type="button"
                disabled={!selectedPlanId || boostingId === boostTarget.id || !boostSaleOpen}
                onClick={() => void startBoost()}
                className="rounded-full bg-bibocom-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {boostingId === boostTarget.id ? "Redirection…" : "Payer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
